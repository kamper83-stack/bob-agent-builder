# Challenge Brief

## Team
- **Agent experience:** fluent
- **Team size:** 2
- **Hours per week per person:** 20

## Starting point
- Idea in mind — sharpen with idea-studio (half-an-idea variation)

## Idea
- **Self-Improving Agent Studio** — A no-code studio where employees build personal AI agents grounded in company material, then rate each result, and the agent proposes its own improvements based on the feedback pattern.
- Core loop: Input (description + connectors) → Processing (grounded on company docs, natural-language instructions) → Output (doc, email, table, etc.) → Rating + comment → Suggested prompt improvement → Accept → better next run.

## Decisions made
- Idea chosen: **Card B — Self-Improving Agent Studio**
- Reason: The feedback→improvement loop is the differentiating demo moment; creativity score 5/5.

## PoC Slice
**"A customer service manager opens the Agent Builder, defines a 'Customer Complaint Handler' agent (input: complaint text, output: response email draft + internal action note, context: service policy doc), runs it on a sample complaint, rates the result as too formal, accepts the agent's suggested improvement, and runs it again — seeing a visibly better output."**

## Component Table
| Component | Status |
|---|---|
| 3-step Agent Builder UI (Define → Test → Improve) | Real |
| watsonx.ai inference (run agent, generate output) | Real |
| Feedback → Suggestion engine (rating + comment → prompt edit) | Real |
| Company policy/procedures doc (grounding context) | Mocked |
| Output renderer (email draft + action note) | Real |
| Connector: email send | Mocked |
| Connector: CRM / ticketing | Mocked |
| User auth / org management | Out (Phase 2) |
| Agent library / marketplace | Out (Phase 3) |
| Connector catalog | Out (Phase 2) |
| Agent versioning / history | Out (Phase 2) |

## Data & Interfaces
- Invented data: `challenge/data/` (complaints.csv, service_reps.csv, agent_runs.csv, manifest.json)
- Policy docs: `challenge/data/policies/service_policy.txt`, `escalation_guide.txt`
- Mock interfaces: `challenge/interfaces.md`

## Open questions
- ~~What does the blueprint claim?~~ Blueprint written as a plan.

## Next step
- Run `app/SMOKE_TEST.md` checklist end-to-end (needs watsonx credentials in `.env`).
- Gate test: `python tests/test_improvement_gate.py` (requires live watsonx credentials).
- Submit / pre-submission check when gate passes.

## Log
- Brief created.
- Team: 2 people, 20 h/week each, fluent with coding agents.
- Starting point: idea in mind.
- Idea sharpened with idea-studio (half-an-idea variation); four cards scored.
- Decision: Card B — Self-Improving Agent Studio (total score 16/20).
- IBM stack recommendation: watsonx.ai + Bob for PoC; Orchestrate in production pitch.
- Demo use case: customer service complaint handler (customer service manager as user).
- PoC scoped: thin slice defined, component table agreed, invented data generated (seed 42), mock interfaces written.
- Blueprint written as a plan (carbon theme): challenge/blueprint.html (72 KB), challenge/blueprint.pdf. No warnings.
- Blueprint updated to as-built (carbon theme): challenge/blueprint.html (73 KB), challenge/blueprint.pdf (700 KB). Status chip: AS BUILT. Hero: 10/10 MEASURED. 0 warnings. Evidence paths added to all built nodes.
- Track A complete (A1–A5): watsonx client, agent runner, mock policy store, improvement engine, gate test.
- Track B complete (B1–B5): Next.js + Tailwind scaffold, Define/Test/Improve screens, API proxy wired to backend.
- S1 complete: end-to-end smoke test checklist written (app/SMOKE_TEST.md).
- src/api.py created: FastAPI backend exposing /run and /improve for the Next.js proxy.
- All feature branches merged to main.
