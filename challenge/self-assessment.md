# Self-assessment, 2026-11-01

The team's own estimate against the published criteria. It predicts nothing about the judges.

| Criterion | Score | Evidence | What would earn one more point |
|---|---|---|---|
| Completeness and feasibility | 4/5 | PoC runs end-to-end: agent_runner.py, improvement_engine.py, 3-step Next.js UI, FastAPI /run + /improve; gate test 10/10 MEASURED (challenge/gate-test-result.md); 52 pytest tests pass; blueprint as-built; Bob session reports in bob_sessions/; 3-phase roadmap with passed Phase 1 gate | IBM watsonx.ai used as the primary inference engine instead of Gemini, so the IBM technology role would be both necessary and core |
| Creativity and innovation | 4/5 | Alternatives section with 5 options including "do nothing" (blueprint.json); feedback→suggestion→accept→improved-run loop absent from all listed alternatives; user stays in loop with explicit acceptance; no commercial builder offers a persistent self-improvement loop driven by user ratings | A cited source (product docs, academic paper) confirming no existing product does this — currently rests on team knowledge |
| Design and usability | 3/5 | 3 fields to define an agent — plain language only; demo script pass criterion: first-time user productive within 90 s of Step 2; no narration needed for the demo UI; 5-minute usability test script written in challenge/demo.md | One real person from outside the team timed on the full path — usability.md does not exist; rubric caps at 3 without external user evidence |
| Effectiveness and efficiency | 3/5 | Gate test: 10/10 MEASURED — loop produces actionable suggestions every time; process diagram shows 40 min → 6 min target; waterfall shows $118k/year per 100 workers; scaling argument in blueprint (scales to 1 000 workers × 10, any recurring output task) | One pilot timing: one real user doing a real task before and after, replacing the 40→6 min assumption with a measured number |

**Total: 14/20**

## Weakest criterion

**Design and usability (3/5).**

The rubric is explicit: without at least one person outside the team having tried it, this cannot score above 3. The fix is one 15-minute session — give a colleague the URL, the CMP-0001 complaint text, and say "build an agent that handles this". Time them from the home screen to the aha moment. Record one thing that confused them and fix it. That session moves this from 3 to 4.

## Left as it is

- **IBM technology as Bob, not as inference engine.** The production blueprint calls out watsonx.ai, but the PoC uses Gemini. The README is honest about this ("production architecture uses watsonx.ai"). Left as-is because switching inference engines this late risks breaking the gate test result.
- **Time/cost impact figures are all assumptions.** Left as-is because no pilot data exists yet; the blueprint marks them clearly as assumptions with how to check each.
- **No formal market search for the creativity claim.** Left as-is; the alternatives section is honest that the claim is based on team knowledge.
