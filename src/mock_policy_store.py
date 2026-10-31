"""
mock_policy_store.py
--------------------
Mock implementation of the policy document store.

In production this would connect to SharePoint or a knowledge base.
For the PoC it reads from challenge/data/policies/ — the interface is
identical to what a real adapter would expose, so swapping it later
is just a config change.

Usage:
    from src.mock_policy_store import list_policies, get_policy

    docs = list_policies()
    # [{"doc_id": "service_policy", "title": "Service Policy"}, ...]

    doc = get_policy("service_policy")
    # {"doc_id": "service_policy", "title": "Service Policy", "text": "..."}
"""

import os
import re
from pathlib import Path

# Path to the policies folder — relative to the repo root
_POLICIES_DIR = Path(__file__).parent.parent / "challenge" / "data" / "policies"

# doc_id comes from the API, so it must never contain path separators
_DOC_ID_PATTERN = re.compile(r"[a-z0-9_-]+")


def _doc_id_to_title(doc_id: str) -> str:
    """Convert a snake_case filename to a human-readable title."""
    return doc_id.replace("_", " ").title()


def list_policies() -> list[dict]:
    """
    Return all available policy documents (without their text).

    Returns:
        List of dicts: [{"doc_id": str, "title": str}, ...]
    """
    return [
        {"doc_id": p.stem, "title": _doc_id_to_title(p.stem)}
        for p in sorted(_POLICIES_DIR.glob("*.txt"))
    ]


def get_policy(doc_id: str) -> dict:
    """
    Return a policy document including its full text.

    Args:
        doc_id: The policy identifier (filename without .txt extension).

    Returns:
        Dict: {"doc_id": str, "title": str, "text": str}

    Raises:
        FileNotFoundError: if doc_id does not match any policy file.
    """
    path = _POLICIES_DIR / f"{doc_id}.txt"
    if not _DOC_ID_PATTERN.fullmatch(doc_id) or not path.exists():
        available = [p.stem for p in _POLICIES_DIR.glob("*.txt")]
        raise FileNotFoundError(
            f"Policy '{doc_id}' not found. "
            f"Available policies: {available}"
        )
    return {
        "doc_id": doc_id,
        "title": _doc_id_to_title(doc_id),
        "text": path.read_text(encoding="utf-8"),
    }
