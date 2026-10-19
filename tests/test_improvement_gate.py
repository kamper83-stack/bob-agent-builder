"""
test_improvement_gate.py
------------------------
Week 1 gate test — proves the core improvement loop works end-to-end.

Uses 10 planted complaints from challenge/data/complaints.csv.
For each: runs the agent, simulates a 3-star rating + comment, calls the
improvement engine, and checks that the suggestion is non-trivial.

Pass criteria per complaint:
  - Suggestion is non-empty
  - Suggestion is not just a copy of the comment
  - Suggestion is at least 15 words long

Gate passes if 8 or more of 10 complaints pass.

Run:
    python tests/test_improvement_gate.py

Exits 0 on pass (>=8/10), 1 on fail.

--- Gate report (fill in after running) ---
Score   : /10
Date    : TBD
Notes   : TBD
---
"""

import csv
import sys
from pathlib import Path

# Allow imports from repo root
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.agent_runner import run_agent_by_policy_id
from src.improvement_engine import suggest_improvement

# 10 planted complaint IDs from the spec
TEST_COMPLAINT_IDS = [
    "CMP-0001", "CMP-0002", "CMP-0003", "CMP-0007", "CMP-0010",
    "CMP-0011", "CMP-0014", "CMP-0018", "CMP-0019", "CMP-0021",
]

STARTER_INSTRUCTIONS = (
    "You are a customer service assistant. "
    "Write a professional response email and a brief internal action note."
)

POLICY_DOC_ID = "service_policy"

SIMULATED_RATING = 3
SIMULATED_COMMENT = "Too formal — more human, use their name"

MIN_SUGGESTION_WORDS = 15
PASS_THRESHOLD = 8


def load_complaints(csv_path: Path) -> dict[str, str]:
    """Return {complaint_id: complaint_text} from the CSV."""
    complaints = {}
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            complaints[row["complaint_id"]] = row["complaint_text"]
    return complaints


def is_useful_suggestion(suggestion: str, comment: str) -> bool:
    """Return True if the suggestion passes the non-trivial check."""
    if not suggestion.strip():
        return False
    if suggestion.strip().lower() == comment.strip().lower():
        return False
    if len(suggestion.split()) < MIN_SUGGESTION_WORDS:
        return False
    return True


def main() -> None:
    complaints_path = Path(__file__).parent.parent / "challenge" / "data" / "complaints.csv"
    all_complaints = load_complaints(complaints_path)

    passed = 0
    failed = 0
    results = []

    for cid in TEST_COMPLAINT_IDS:
        complaint_text = all_complaints.get(cid)
        if not complaint_text:
            print(f"  [SKIP] {cid} — not found in CSV")
            results.append((cid, "SKIP", "not found"))
            continue

        print(f"\nRunning {cid}: \"{complaint_text[:60]}...\"" if len(complaint_text) > 60
              else f"\nRunning {cid}: \"{complaint_text}\"")

        try:
            # Step 1 — run the agent
            run_agent_by_policy_id(complaint_text, POLICY_DOC_ID, STARTER_INSTRUCTIONS)

            # Step 2 — generate improvement suggestion
            suggestion = suggest_improvement(
                current_instructions=STARTER_INSTRUCTIONS,
                rating=SIMULATED_RATING,
                comment=SIMULATED_COMMENT,
            )

            # Step 3 — evaluate
            if is_useful_suggestion(suggestion, SIMULATED_COMMENT):
                print(f"  [PASS] Suggestion ({len(suggestion.split())} words): {suggestion[:100]}...")
                passed += 1
                results.append((cid, "PASS", suggestion))
            else:
                print(f"  [FAIL] Suggestion too short or trivial: \"{suggestion}\"")
                failed += 1
                results.append((cid, "FAIL", suggestion))

        except Exception as e:
            print(f"  [ERROR] {e}")
            failed += 1
            results.append((cid, "ERROR", str(e)))

    print(f"\n{'='*60}")
    print(f"Gate result: {passed}/{len(TEST_COMPLAINT_IDS)} passed")
    print(f"Threshold:   {PASS_THRESHOLD}/{len(TEST_COMPLAINT_IDS)}")

    if passed >= PASS_THRESHOLD:
        print("✓ GATE PASSED")
        sys.exit(0)
    else:
        print("✗ GATE FAILED")
        sys.exit(1)


if __name__ == "__main__":
    main()
