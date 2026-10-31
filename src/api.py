"""
api.py
------
FastAPI backend for Agent Studio.

Exposes the endpoints consumed by the Next.js API proxy routes:

  POST /run                 — run the complaint-handler agent
  POST /improve             — generate an improvement suggestion
  POST /extract-process     — list the steps the agent will take
  POST /check-example       — check an example output against policy
  POST /estimate-confidence — decide whether to ask a clarifying question
  GET  /logs                — recent backend log entries, newest first

Start:
    uvicorn src.api:app --reload

Required env vars (see src/.env.example):
    GEMINI_API_KEY
    GEMINI_MODEL  (optional — defaults to gemini-flash-latest)
"""

import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from src import event_log
from src.agent_runner import run_agent_by_policy_id
from src.improvement_engine import suggest_improvement
from src.process_extractor import extract_process
from src.mock_policy_store import get_policy
from src.example_checker import check_example_output, estimate_confidence

logger = logging.getLogger(__name__)
event_log.install(logging.getLogger("src"))

app = FastAPI(title="Agent Studio API", version="0.1.0")

# Allow requests from the Next.js dev server (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    """Model and configuration failures reach the client as JSON, without internals."""
    logger.exception("Unhandled %s on %s", type(exc).__name__, request.url.path)
    return JSONResponse(
        status_code=502,
        content={"detail": "The AI service failed. Please try again."},
    )


@app.middleware("http")
async def log_requests(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """Logs method, path, status and duration. Request bodies are never logged."""
    started = time.perf_counter()
    response = await call_next(request)
    if request.url.path != "/logs":  # The Logs page would otherwise fill its own list
        elapsed_ms = round((time.perf_counter() - started) * 1000)
        level = (
            logging.ERROR if response.status_code >= 500
            else logging.WARNING if response.status_code >= 400
            else logging.INFO
        )
        logger.log(
            level, "%s %s returned %d in %d ms",
            request.method, request.url.path, response.status_code, elapsed_ms,
        )
    return response


# ── /logs ─────────────────────────────────────────────────────────────────────

class LogEntryResponse(BaseModel):
    timestamp: str
    level: str
    message: str


class LogsResponse(BaseModel):
    entries: list[LogEntryResponse]


@app.get("/logs", response_model=LogsResponse)
def get_logs() -> LogsResponse:
    """Return recent backend log entries, newest first."""
    return LogsResponse(entries=event_log.memory_handler.recent())


# ── /run ──────────────────────────────────────────────────────────────────────

class RunRequest(BaseModel):
    complaint_text: str = Field(..., min_length=1)
    policy_doc_id: str = Field(..., min_length=1)
    agent_instructions: str = Field(..., min_length=1)
    policy_text_override: str | None = Field(default=None)


class RunResponse(BaseModel):
    email_draft: str
    action_note: str


@app.post("/run", response_model=RunResponse)
def run_agent(body: RunRequest) -> RunResponse:
    """
    Run the complaint-handler agent and return structured output.
    Accepts an optional policy_text_override to use an uploaded doc instead of
    the mock policy store.
    """
    try:
        if body.policy_text_override:
            from src.agent_runner import run_agent as _run_agent
            result = _run_agent(
                complaint_text=body.complaint_text,
                policy_text=body.policy_text_override,
                agent_instructions=body.agent_instructions,
            )
        else:
            result = run_agent_by_policy_id(
                complaint_text=body.complaint_text,
                policy_doc_id=body.policy_doc_id,
                agent_instructions=body.agent_instructions,
            )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return RunResponse(**result)


# ── /improve ──────────────────────────────────────────────────────────────────

class ImproveRequest(BaseModel):
    current_instructions: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(default="")


class ImproveResponse(BaseModel):
    suggestion: str


@app.post("/improve", response_model=ImproveResponse)
def improve_agent(body: ImproveRequest) -> ImproveResponse:
    """
    Propose a concrete edit to the agent instructions based on user feedback.
    """
    suggestion = suggest_improvement(
        current_instructions=body.current_instructions,
        rating=body.rating,
        comment=body.comment,
    )
    return ImproveResponse(suggestion=suggestion)


# ── /extract-process ──────────────────────────────────────────────────────────

class ExtractProcessRequest(BaseModel):
    input_type: str = Field(..., min_length=1)
    output_type: str = Field(..., min_length=1)
    policy_doc_id: str = Field(..., min_length=1)
    example_input: str | None = Field(default=None)
    example_output: str | None = Field(default=None)
    policy_text_override: str | None = Field(default=None)


class ExtractProcessResponse(BaseModel):
    steps: list[str]


@app.post("/extract-process", response_model=ExtractProcessResponse)
def extract_process_endpoint(body: ExtractProcessRequest) -> ExtractProcessResponse:
    """
    Given what the user described as input/output and a policy doc, return
    a short ordered list of plain-language steps showing what the agent will do.
    Accepts an optional policy_text_override to use an uploaded doc instead of
    the mock policy store.
    """
    if body.policy_text_override:
        policy_text = body.policy_text_override
    else:
        try:
            policy = get_policy(body.policy_doc_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        policy_text = policy["text"]

    try:
        steps = extract_process(
            input_type=body.input_type,
            output_type=body.output_type,
            policy_text=policy_text,
            example_input=body.example_input,
            example_output=body.example_output,
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ExtractProcessResponse(steps=steps)


# ── /check-example ────────────────────────────────────────────────────────────

class CheckExampleRequest(BaseModel):
    example_input: str = Field(..., min_length=1)
    example_output: str = Field(..., min_length=1)
    policy_doc_id: str = Field(..., min_length=1)
    policy_text_override: str | None = Field(default=None)


class CheckExampleResponse(BaseModel):
    conflict: bool
    reason: str


@app.post("/check-example", response_model=CheckExampleResponse)
def check_example_endpoint(body: CheckExampleRequest) -> CheckExampleResponse:
    """
    Check whether a user-supplied example output contradicts company policy.
    Returns {conflict, reason}.
    """
    if body.policy_text_override:
        policy_text = body.policy_text_override
    else:
        try:
            policy = get_policy(body.policy_doc_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        policy_text = policy["text"]

    try:
        result = check_example_output(
            example_input=body.example_input,
            example_output=body.example_output,
            policy_text=policy_text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return CheckExampleResponse(**result)


# ── /estimate-confidence ──────────────────────────────────────────────────────

class EstimateConfidenceRequest(BaseModel):
    input_type: str = Field(..., min_length=1)
    output_type: str = Field(..., min_length=1)
    policy_doc_id: str = Field(..., min_length=1)
    policy_text_override: str | None = Field(default=None)


class EstimateConfidenceResponse(BaseModel):
    confidence: float
    clarification_question: str | None


@app.post("/estimate-confidence", response_model=EstimateConfidenceResponse)
def estimate_confidence_endpoint(body: EstimateConfidenceRequest) -> EstimateConfidenceResponse:
    """
    When no example output is provided, estimate how confident the agent is
    and return a clarification question if confidence < 0.9.
    """
    if body.policy_text_override:
        policy_text = body.policy_text_override
    else:
        try:
            policy = get_policy(body.policy_doc_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        policy_text = policy["text"]

    try:
        result = estimate_confidence(
            input_type=body.input_type,
            output_type=body.output_type,
            policy_text=policy_text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return EstimateConfidenceResponse(**result)
