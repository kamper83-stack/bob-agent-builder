# Project Documentation Rules (Non-Obvious Only)

- `src/watsonx_client.py` is **not** a watsonx/IBM client — it wraps Google Gemini. The filename is kept for import compatibility with the rest of `src/`.
- Policy documents live in `challenge/data/policies/*.txt` — the doc_id is the filename stem (e.g. `service_policy` → `service_policy.txt`). There is no database.
- `tests/email_utils.py` and `tests/dot_alias.py` are utility modules, not tests — they are helpers used by the actual test files in the same directory.
- The `app/app/` double nesting is intentional — outer `app/` is the Next.js project root; inner `app/` is the Next.js App Router directory.
- `challenge/brief.md` is the project memory for the IBM hackathon — read it before any challenge-related work.
