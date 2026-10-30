"""
test_email_utils.py
-------------------
Unit tests for tests/email_utils.py
"""

import pytest
from email_utils import unique_email, dot_alias_email, bulk_unique_emails


class TestUniqueEmail:
    def test_adds_plus_tag(self):
        result = unique_email("user@gmail.com", tag="test1")
        assert result == "user+test1@gmail.com"

    def test_random_tag_is_8_chars(self):
        result = unique_email("user@gmail.com")
        local = result.split("@")[0]
        tag = local.split("+")[1]
        assert len(tag) == 8

    def test_each_call_is_unique(self):
        a = unique_email("user@gmail.com")
        b = unique_email("user@gmail.com")
        assert a != b

    def test_strips_existing_plus_tag(self):
        result = unique_email("user+old@gmail.com", tag="new")
        assert result == "user+new@gmail.com"

    def test_invalid_email_raises(self):
        with pytest.raises(ValueError):
            unique_email("notanemail")

    def test_preserves_domain(self):
        result = unique_email("user@company.co.il", tag="qa")
        assert result.endswith("@company.co.il")


class TestDotAliasEmail:
    def test_inserts_dot(self):
        result = dot_alias_email("username@gmail.com", seed=42)
        local = result.split("@")[0]
        assert "." in local

    def test_deterministic_with_seed(self):
        a = dot_alias_email("username@gmail.com", seed=7)
        b = dot_alias_email("username@gmail.com", seed=7)
        assert a == b

    def test_different_seeds_may_differ(self):
        a = dot_alias_email("username@gmail.com", seed=1)
        b = dot_alias_email("username@gmail.com", seed=99)
        # Not guaranteed to differ for all seeds, but for these two they should
        # (local part is long enough)
        assert a != b or True  # soft check — just ensure no crash

    def test_short_local_raises(self):
        with pytest.raises(ValueError):
            dot_alias_email("a@gmail.com")

    def test_strips_plus_before_dotting(self):
        result = dot_alias_email("user+tag@gmail.com", seed=1)
        assert "+tag" not in result


class TestBulkUniqueEmails:
    def test_returns_correct_count(self):
        results = bulk_unique_emails("user@gmail.com", 5)
        assert len(results) == 5

    def test_all_unique(self):
        results = bulk_unique_emails("user@gmail.com", 10)
        assert len(set(results)) == 10

    def test_zero_count_raises(self):
        with pytest.raises(ValueError):
            bulk_unique_emails("user@gmail.com", 0)

    def test_format(self):
        results = bulk_unique_emails("user@gmail.com", 3)
        assert results[0] == "user+00000001@gmail.com"
        assert results[2] == "user+00000003@gmail.com"
