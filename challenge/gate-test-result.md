# Gate Test Result — Improvement Loop

## Summary

| Field | Value |
|---|---|
| **Score** | 10 / 10 |
| **Date** | 2026-10-23 |
| **Script** | `tests/test_improvement_gate.py` |
| **Threshold** | ≥ 8 / 10 (PASS) |
| **Outcome** | ✓ GATE PASSED |

## What the test proves

For each of 10 planted complaints from `challenge/data/complaints.csv`:

1. **Run the agent** — calls `/run` with a starter instruction set and the real complaint text; produces `email_draft` + `action_note`.
2. **Simulate feedback** — 3-star rating + comment *"Too formal — more human, use their name"*.
3. **Call the improvement engine** — passes the actual email draft as context so the suggestion is grounded in what was produced, not just the starter instructions.
4. **Evaluate the suggestion** — non-empty, not a copy of the comment, ≥ 15 words.

## Per-complaint results

| Complaint ID | Result | Notes |
|---|---|---|
| CMP-0001 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0002 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0003 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0007 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0010 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0011 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0014 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0018 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0019 | PASS | Suggestion ≥ 15 words, non-trivial |
| CMP-0021 | PASS | Suggestion ≥ 15 words, non-trivial |

**Final: 10/10 PASS**

## Root fix that unblocked the gate

`DEFAULT_MAX_TOKENS` was raised from 800 → 2048 in `src/watsonx_client.py`. The lower value caused JSON truncation when using `response_schema` structured output — the Gemini API would cut the response mid-JSON, causing parse failures. At 2048 tokens all 10 complaints produce complete, parseable structured output.

## How to re-run

```bash
# From repo root, with GEMINI_API_KEY set in src/.env
python tests/test_improvement_gate.py
```

Expected output:
```
Gate result: 10/10 passed (skipped 0)
Threshold:   8/10
✓ GATE PASSED
```

Exits 0 on pass (≥ 8/10), exits 1 on fail.
