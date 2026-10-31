# Project Coding Rules (Non-Obvious Only)

- `watsonx_client.py` is the Gemini client — despite the name, import `from src.watsonx_client import call_model` for all LLM calls.
- `DEFAULT_MAX_TOKENS` must stay at 2048 or higher — values below this cause JSON truncation with `response_schema` structured output.
- Use `call_model(..., response_schema=SomePydanticModel)` for structured output; the return value is a JSON **string**, not a dict — call `json.loads()` on it.
- Complaint text must always be wrapped in `<complaint>` XML tags in prompts — this is the prompt-injection defense pattern.
- `run_agent_by_policy_id()` is the preferred entry point for tests and the API; `run_agent()` is for when you already have the policy text (e.g. uploaded doc override).
- Frontend API routes in `app/app/api/` are **proxy only** — all logic goes in `src/`. Never add business logic to route.ts files.
- Path alias `@/*` maps to the `app/` directory, not the project root — `@/app/foo` resolves to `app/app/foo`.
- `pytest` tests in `tests/` that import sibling modules (e.g. `from email_utils import ...`) must be run from the repo root so Python finds them via relative import.
- `test_improvement_gate.py` is a standalone script (`if __name__ == "__main__"`), not a pytest file — run it as `python tests/test_improvement_gate.py` from repo root; it exits 1 on failure.
