"""
api.py
------
FastAPI backend for Agent Studio.

Exposes two endpoints consumed by the Next.js API proxy routes:

  POST /run     — run the complaint-handler agent
  POST /improve — generate an improvement suggestion

Start:
    uvicorn src.api:app --reload

Required env vars (same as watsonx_client.py):
    WATSONX_APIKEY
    WATSONX_PROJECT_ID
    WATSONX_URL  (optional — defaults to us-south endpoint)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.agent_runner import run_agent_by_policy_id
from src.improvement_engine import suggest_improvement

app = FastAPI(title="Agent Studio API", version="0.1.0")

# Allow requests from the Next.js dev server (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


# ── /run ──────────────────────────────────────────────────────────────────────

class RunRequest(BaseModel):
    complaint_text: str = Field(..., min_length=1)
    policy_doc_id: str = Field(..., min_length=1)
    agent_instructions: str = Field(..., min_length=1)


class RunResponse(BaseModel):
    email_draft: str
    action_note: str


@app.post("/run", response_model=RunResponse)
def run_agent(body: RunRequest) -> RunResponse:
    """
    Run the complaint-handler agent and return structured output.
    """
    try:
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
