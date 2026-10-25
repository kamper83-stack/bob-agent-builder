"""
test_dot_alias.py
-----------------
Unit tests for tests/dot_alias.py
"""

import pytest
from dot_alias import dot_variants, nth_variant, random_variant, is_dot_alias_of


class TestDotVariants:
    def test_two_char_local_has_one_variant(self):
        variants = list(dot_variants("ab@gmail.com"))
        assert variants == ["a.b@gmail.com"]

    def test_three_char_local_has_three_variants(self):
        variants = list(dot_variants("abc@gmail.com"))
        assert len(variants) == 3

    def test_all_variants_contain_dot(self):
        for v in dot_variants("user@gmail.com"):
            local = v.split("@")[0]
            assert "." in local

    def test_all_variants_have_correct_domain(self):
        for v in dot_variants("user@gmail.com"):
            assert v.endswith("@gmail.com")

    def test_strips_existing_dots(self):
        # u.ser and user should produce same variants
        a = sorted(dot_variants("u.ser@gmail.com"))
        b = sorted(dot_variants("user@gmail.com"))
        assert a == b

    def test_short_local_raises(self):
        with pytest.raises(ValueError):
            list(dot_variants("a@gmail.com"))

    def test_invalid_email_raises(self):
        with pytest.raises(ValueError):
            list(dot_variants("notanemail"))


class TestNthVariant:
    def test_returns_string(self):
        result = nth_variant("user@gmail.com", 0)
        assert isinstance(result, str)
        assert "@gmail.com" in result

    def test_deterministic(self):
        a = nth_variant("user@gmail.com", 3)
        b = nth_variant("user@gmail.com", 3)
        assert a == b

    def test_wraps_around(self):
        # There are 7 variants for "user" (2^3 - 1)
        # n=0 and n=7 should be the same
        a = nth_variant("user@gmail.com", 0)
        b = nth_variant("user@gmail.com", 7)
        assert a == b

    def test_different_n_gives_different_result(self):
        a = nth_variant("username@gmail.com", 0)
        b = nth_variant("username@gmail.com", 1)
        assert a != b


class TestRandomVariant:
    def test_returns_valid_email(self):
        result = random_variant("user@gmail.com")
        assert "@gmail.com" in result
        assert "." in result.split("@")[0]

    def test_seed_is_deterministic(self):
        a = random_variant("user@gmail.com", seed=42)
        b = random_variant("user@gmail.com", seed=42)
        assert a == b

    def test_different_seeds_differ(self):
        a = random_variant("username@gmail.com", seed=1)
        b = random_variant("username@gmail.com", seed=999)
        assert a != b


class TestIsDotAliasOf:
    def test_same_address_is_alias(self):
        assert is_dot_alias_of("user@gmail.com", "user@gmail.com")

    def test_dotted_is_alias(self):
        assert is_dot_alias_of("u.ser@gmail.com", "user@gmail.com")

    def test_heavily_dotted_is_alias(self):
        assert is_dot_alias_of("u.s.e.r@gmail.com", "user@gmail.com")

    def test_different_domain_is_not_alias(self):
        assert not is_dot_alias_of("user@gmail.com", "user@outlook.com")

    def test_different_local_is_not_alias(self):
        assert not is_dot_alias_of("alice@gmail.com", "bob@gmail.com")

    def test_case_insensitive(self):
        assert is_dot_alias_of("User@Gmail.com", "user@gmail.com")

    def test_strips_plus_tag(self):
        assert is_dot_alias_of("user+tag@gmail.com", "u.ser@gmail.com")

    def test_invalid_returns_false(self):
        assert not is_dot_alias_of("notanemail", "user@gmail.com")
