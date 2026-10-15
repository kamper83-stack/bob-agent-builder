# Week 1 Build Plan

**Goal:** The improvement loop closes end-to-end.
A rating + comment → produces a concrete suggestion → user accepts →
next run is visibly better — on at least 8 of 10 planted test cases.

**Team:** Shiri (`shirikyky`) · Eran (`kamper83-stack`)
**Capacity:** 2 × 20 h = 40 h total
**Gate date:** End of Week 1

---

## Task breakdown

### Track A — Backend / AI (Eran · `kamper83-stack`)

| # | Order | Task | Est. | Depends on | Deliverable |
|---|---|---|---|---|---|
| A1 | 1st | Set up watsonx.ai project, API key in env, smoke-test inference call | 3 h | — | `src/watsonx_client.py` |
| A2 | 2nd | Build the agent runner — complaint text + policy doc + instructions → email draft + action note | 5 h | A1 | `src/agent_runner.py` |
| A3 | 3rd | Wire mock policy store — `list_policies()` / `get_policy()` reading from `challenge/data/policies/` | 2 h | A2 | `src/mock_policy_store.py` |
| A4 | 4th | Build the improvement engine — rating + comment + current instructions → suggested prompt edit | 5 h | A2 | `src/improvement_engine.py` |
| A5 | 5th | Run gate test — 10 planted complaints, verify 8/10 produce a useful suggestion | 3 h | A3, A4 | `tests/test_improvement_gate.py` |

**Track A total: ~18 h**

---

### Track B — UI / Frontend (Shiri · `shirikyky`)

| # | Order | Task | Est. | Depends on | Deliverable |
|---|---|---|---|---|---|
| B1 | 1st | Scaffold the app (Next.js + Tailwind), confirm it runs locally | 2 h | — | `app/` directory, `npm run dev` works |
| B2 | 2nd | Step 1 — Define screen: 3-field form (input type, output type, context doc) + Save | 4 h | B1 | `app/pages/define.tsx` |
| B3 | 3rd | Step 2 — Test screen: paste complaint input, Run button, output panel (email draft + action note) | 5 h | B2 | `app/pages/test.tsx` |
| B4 | 4th | Step 3 — Improve screen: star rating + comment, Suggest button, suggestion card, Accept button | 5 h | B3 | `app/pages/improve.tsx` |
| B5 | 5th | Wire UI to backend: connect Run → agent_runner, Suggest → improvement_engine via API calls | 3 h | B4, **A2, A4** | `app/lib/api.ts` |

**Track B total: ~19 h · Note: B1–B4 run in parallel with Eran's track. B5 waits for A2 + A4.**

---

## Shared / integration (both · 3 h buffer)

| # | Order | Task | Who | Est. | Depends on |
|---|---|---|---|---|---|
| S1 | 1st | End-to-end smoke test: define agent, run CMP-0001, rate 3★ "too formal", accept suggestion, run again | Both | 2 h | B5 |
| S2 | 2nd | Update `challenge/brief.md` log and push all code | Both | 1 h | S1 |

---

## What is NOT in Week 1

- Email connector send (mock only — already spec'd in `interfaces.md`)
- CRM connector (mock only)
- User auth
- Agent versioning history UI
- Any deployment beyond `localhost`

---

## Week 1 gate checklist

- [ ] `npm run dev` starts the app without errors
- [ ] Agent runner returns a structured output (email draft + action note) for CMP-0001
- [ ] Improvement engine returns a non-trivial suggestion from a 3★ + "too formal" input
- [ ] Accepted suggestion changes the agent instructions stored in memory
- [ ] Second run with same complaint produces a visibly different (less formal) output
- [ ] Gate test: 8 of 10 planted complaints produce a useful improvement suggestion (`tests/test_improvement_gate.py` passes)
