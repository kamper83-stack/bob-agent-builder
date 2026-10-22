# Project rules — bob-agent-builder

## What this project is
A no-code **Self-Improving Agent Studio** for the IBM Bob Challenge.
- **Frontend:** Next.js 16 + React 19 + Tailwind 4, TypeScript strict mode — lives in `app/`
- **Backend:** FastAPI + Google Gemini (`google-genai`) — lives in `src/`
- **Tests:** `tests/` (Python)
- **Challenge artefacts:** `challenge/` — do not modify without reading `challenge/brief.md` first

## Validation — run before marking any task done
```
# TypeScript (must pass with zero errors)
cd app && npx tsc --noEmit

# ESLint (must pass with zero errors — one pre-existing UploadedDoc warning is acceptable)
cd app && npx eslint app/

# Python (if src/ was changed)
cd src && python -m py_compile *.py
```

## TypeScript / React rules
- Strict mode is on (`"strict": true`). No `any`, no `@ts-ignore`, no `as unknown`.
- All components are functional — no class components.
- State and side effects use React hooks. No external state library.
- Tailwind utility classes only — no inline `style=` props, no CSS modules.
- Path alias `@/*` maps to `app/` root — use it instead of relative `../../` chains.
- Do not add new npm dependencies without a clear reason.

## Python rules
- Python 3.11+. Use type hints on all function signatures.
- `src/api.py` is the FastAPI entry point. Route handlers stay thin — logic lives in the module files (`agent_runner.py`, `improvement_engine.py`, etc.).
- Environment variables come from `.env` (loaded by `python-dotenv`). Never hard-code credentials.
- `src/.env.example` must stay in sync when new env vars are added.

## Git conventions
- Branch naming: `feat/`, `fix/`, `refactor/`, `chore/` prefixes.
- Commit messages: `type(scope): short description` — e.g. `fix(build): correct textarea placeholder`.
- One logical change per commit. Squash before merging to `main`.
- `main` is the stable branch. Every code change — no matter how small — goes through a PR. Never commit directly to `main`.
- Never merge a PR without at least one review approval. Do not self-merge without explicit user confirmation.

## Challenge-specific
- `challenge/brief.md` is the project memory — read it at the start of challenge tasks, update the Log section when decisions are made.
- Synthetic data lives in `challenge/data/`. Never replace it with real customer or company data.
- The PoC is scoped to the **customer complaint handler** slice — do not expand scope without updating the brief.
- Credentials stay out of tracked files. Run `submission-check` skill before any public push.
