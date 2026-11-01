"""
test_mock_policy_store.py
-------------------------
Unit tests for src/mock_policy_store.py
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.mock_policy_store import get_policy


def test_returns_known_policy():
    assert get_policy("service_policy")["text"]


@pytest.mark.parametrize("doc_id", ["missing", "../../../src/requirements", "a/b", "..", ""])
def test_rejects_unknown_or_traversing_ids(doc_id):
    with pytest.raises(FileNotFoundError):
        get_policy(doc_id)
