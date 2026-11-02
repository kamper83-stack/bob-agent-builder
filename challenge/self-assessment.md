# Self-assessment, 2026-11-02

The team's own estimate against the published criteria. It predicts nothing about the judges.

| Criterion | Score | Evidence | What would earn one more point |
|---|---|---|---|
| **Completeness and feasibility** | 4/5 | Full end-to-end PoC running: Define → Test → Improve → History loop. Gate test: 10/10 (`challenge/gate-test-result.md`). All IBM components named; mocks behind real interfaces. 3-phase roadmap with measurable gates. `tsc`, `eslint`, `pytest` all pass; smoke test documented in `challenge/smoke-test-results.md`. | Connectors wired to a real system (email or policy store) — currently behind mocks. |
| **Creativity and innovation** | 4/5 | The feedback-to-improvement loop is absent from every listed alternative (`blueprint.json` alternatives section). The agent proposes its own instruction edit from a rating + free-text comment — no prompt engineering by the user. Version history + restore is unique to this UI. | A formal citation (link, product page) confirming no commercial tool offers this loop. Currently team's assertion only. |
| **Design and usability** | 3/5 | Three-field definition (no config files). Clear button, History page, and "✓ Saved to history" confirmation added in PR #76. Demo scripted to 4 min with no UI narration (`challenge/demo.md`). | One real user outside the team timed through the flow. Without that, cap is 3 by the scoring rules. |
| **Effectiveness and efficiency** | 3/5 | Problem is daily, widespread (knowledge workers). Gate test proves the loop closes measurably (rating trajectory exists in the run log). Architecture scales to 1 000 workers with no code change. | At least one measured number (a real before/after time from a real run). All impact figures are assumptions; cap is 3 by the scoring rules. |

**Total: 14 / 20**

## Weakest criterion

**Design and usability (3/5)**

The single action that moves it most in the time left: **get one person who did not build it to open the app, try to define an agent, and time them to first useful output.** Even five minutes of watching someone use it yields at least one concrete fix and changes the score from capped-at-3 to potentially 4.

## Left as it is

- **All impact numbers remain assumptions.** No pilot with real users ran during the PoC window. The score cap at 3 for Effectiveness is accepted.
- **Session report is placeholder.** Requires manual export from Bob IDE (issue #70). Does not affect the code or the demo.
- **`app/app/build/page.tsx` flagged by submission-check** as "installed or built output" — it is a source file, not a build artefact. The script pattern-matched the path; no action needed.
