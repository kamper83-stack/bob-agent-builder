# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack
- **Frontend:** Next.js 16 + React 19 + Tailwind 4, TypeScript strict — lives in `app/` (run all frontend commands from `app/`)
- **Backend:** FastAPI + Google Gemini (`google-genai`) — lives in `src/`
- **Tests:** `tests/` (Python, pytest)

## Commands

### Frontend (run from `app/`)
```bash
cd app && npx tsc --noEmit          # TypeScript check — must pass with zero errors
cd app && npx eslint app/           # Lint — must pass (one pre-existing UploadedDoc warning is acceptable)
cd app && npm run dev               # Dev server on :3000
```

### Backend
```bash
uvicorn src.api:app --reload        # FastAPI on :8000 (run from repo root)
python -m py_compile src/*.py       # Python syntax check
```

### Tests (run from repo root)
```bash
pytest tests/test_email_utils.py   # Run a single test file
pytest tests/                      # Run all pytest tests
python tests/test_improvement_gate.py  # Gate test — NOT a pytest file; run directly; exits 0 on ≥8/10
```

**Critical:** `test_improvement_gate.py` is a standalone script, not a pytest test. It calls the live Gemini API and requires `GEMINI_API_KEY` in `src/.env`.

`tests/test_dot_alias.py` and `tests/test_email_utils.py` import from siblings in `tests/` (not `src/`), so run pytest from the repo root.

## Environment Variables

- `src/.env` (copy from `src/.env.example`) — Gemini credentials for the backend
- `app/.env.local` (copy from `app/.env.local.example`) — `BACKEND_URL=http://localhost:8000` for the Next.js proxy

Only `GEMINI_API_KEY` is required to run the app. `WATSONX_*` vars are in `.env.example` for historical reasons but are unused — the module is named `watsonx_client.py` for import-compatibility only; it actually wraps Gemini.

## Key Architecture Gotchas

- **`watsonx_client.py` is actually a Gemini client** — the filename is legacy. All LLM calls go through `src/watsonx_client.call_model()`.
- **`DEFAULT_MAX_TOKENS` is 2048** — was 800; lowering it again will cause JSON truncation in structured-output responses.
- **Prompt injection defense:** `agent_runner.py` wraps user complaint text in `<complaint>` XML tags with an explicit instruction to treat it as data. Maintain this pattern when editing prompts.
- **Policy store reads from `challenge/data/policies/*.txt`** — `mock_policy_store.get_policy(doc_id)` uses the filename stem as the `doc_id` (no `.txt`). Adding a policy = drop a `.txt` file in that directory.
- **Next.js API routes are thin proxies** — all routes in `app/app/api/` forward to FastAPI at `BACKEND_URL` (default `http://localhost:8000`). No business logic lives there.
- **`@/*` path alias maps to `app/`** (not project root) — e.g., `@/app/components/Foo` resolves to `app/app/components/Foo`.

## TypeScript Rules
- `strict: true` — no `any`, no `@ts-ignore`, no `as unknown`
- Tailwind utility classes only — no inline `style=` props, no CSS modules
- No new npm dependencies without a clear reason

## Python Rules
- Python 3.11+, type hints on all function signatures
- Route handlers in `src/api.py` stay thin — logic lives in module files
- `ValueError` → HTTP 502, `FileNotFoundError` → HTTP 404 (established convention in all handlers)
