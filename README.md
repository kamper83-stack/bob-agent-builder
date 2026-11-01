# Agent Studio — Self-Improving AI Agent Builder

A no-code studio where non-technical employees build AI agents grounded in company documents, rate each output, and let the agent improve its own instructions based on the feedback pattern.

Built for the IBM Bob Challenge.

---

## What it does

1. **Build** — describe what the agent receives and produces, upload a policy document, add examples.
2. **Test** — run the agent on a real input and see the output instantly.
3. **Improve** — rate the output (1–5 stars), add a comment, and accept the agent's self-generated instruction improvement.

The core differentiator is the **feedback → improvement loop**: the agent reads its own output and the user's rating, then proposes a concrete rewrite of its own instructions. Accept it and the next run is measurably better.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.11+ | |
| Node.js | 18+ | |
| npm | 9+ | |
| Gemini API key | — | Free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## Quick start

### 1. Clone and set up credentials

```bash
git clone https://github.com/kamper83-stack/bob-agent-builder.git
cd bob-agent-builder

cp src/.env.example src/.env
# Edit src/.env and add your GEMINI_API_KEY

cp app/.env.local.example app/.env.local
# Default is BACKEND_URL=http://localhost:8000 — no change needed for local dev
```

### 2. Start the backend

```bash
pip install -r src/requirements.txt
uvicorn src.api:app --port 8000
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 3. Start the frontend

```bash
cd app
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## Running the tests

```bash
# Python syntax check
python3 -m py_compile src/*.py

# Unit tests (no API key needed)
PYTHONPATH=. pytest tests/test_event_log.py tests/test_mock_policy_store.py

# End-to-end gate test (requires GEMINI_API_KEY in src/.env, ~2 min)
python3 tests/test_improvement_gate.py

# Browser smoke test (requires both servers running)
python3 tests/e2e_browser.py
```

Gate test last result: **10/10** ✓

---

## What is real and what is mocked

| Component | Status |
|---|---|
| Gemini LLM inference (run agent, suggest improvement) | ✅ Real |
| 3-step Builder UI (Build → Test → Improve) | ✅ Real |
| Feedback → self-improvement engine | ✅ Real |
| Company policy document store | 🟡 Mocked — `challenge/data/policies/*.txt` |
| Email send connector | 🟡 Mocked — UI only, no real send |
| CRM / ticketing connector | 🟡 Mocked — UI only |
| Agent versioning / history | ⬜ Out of scope (Phase 2) |
| User auth / multi-tenant | ⬜ Out of scope (Phase 2) |

Demo data in `challenge/data/` is fully synthetic (`manifest.json` → `"synthetic": true`).

---

## IBM technology used

| Technology | Role |
|---|---|
| **IBM Bob** | Built entirely in Bob IDE; session reports document the build process |
| **Google Gemini via `google-genai`** | LLM inference for agent runs and improvement suggestions |

The production architecture (described in `challenge/blueprint.html`) uses **IBM watsonx.ai** for enterprise-grade inference.

---

## Project structure

```
src/            FastAPI backend + Gemini client
app/            Next.js 16 frontend (TypeScript, Tailwind 4)
challenge/      Brief, blueprint, synthetic data, interfaces
tests/          Unit tests + e2e browser test + gate test
```

---

## Bob session report

The build session report is exported from IBM Bob IDE and submitted separately as part of the challenge entry. It documents the full development process including design decisions, code reviews, and validation runs.
