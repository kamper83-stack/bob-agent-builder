# Project Architecture Rules (Non-Obvious Only)

- **Backend is the only LLM caller** — the Next.js frontend never calls Gemini directly; all AI calls flow through FastAPI → `src/watsonx_client.call_model()`.
- **All Next.js API routes are proxies** — `app/app/api/*/route.ts` forward requests to FastAPI. This means a new feature requires: (1) a FastAPI endpoint in `src/api.py`, (2) a Pydantic request/response model, (3) a proxy route.ts, (4) logic in a module file (not in api.py).
- **Policy store is a filesystem mock behind a real interface** — `mock_policy_store.get_policy(doc_id)` is designed to be swapped for a SharePoint/knowledge-base adapter without changing callers. Do not bypass it with direct file reads.
- **Scope is locked to the customer complaint handler** — the PoC handles one case type end-to-end. Do not expand scope without updating `challenge/brief.md`.
- **Structured output requires `DEFAULT_MAX_TOKENS ≥ 2048`** — Gemini's JSON schema mode truncates at lower limits, silently returning invalid JSON.
- **CORS is locked to localhost:3000** — `src/api.py` only allows `http://localhost:3000`. Change this explicitly if deploying.
