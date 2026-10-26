"""
dot_alias.py
------------
Gmail Dot-Aliasing utilities for QA and automated testing.

Gmail ignores ALL dots in the local part of an address, so these are
identical in delivery but treated as distinct addresses by most systems:

    username@gmail.com
    user.name@gmail.com
    u.s.e.r.n.a.m.e@gmail.com

Use this as a fallback when the system under test blocks the '+' character
(Plus-Aliasing) via a strict email regex.

Functions
---------
- dot_variants(base)          → iterator of all possible dot-inserted variants
- nth_variant(base, n)        → deterministic nth variant (reproducible in CI)
- random_variant(base, seed)  → random variant (seed for reproducibility)
- is_dot_alias_of(a, b)       → True if two Gmail addresses are equivalent
"""

from __future__ import annotations

import random
import itertools
from typing import Iterator


def _split(base: str) -> tuple[str, str]:
    """Split ``user@domain`` into ``(local, domain)``, stripping existing dots."""
    if "@" not in base:
        raise ValueError(f"Invalid email address: {base!r}")
    local, domain = base.split("@", 1)
    # Normalise: remove existing dots and any plus-tag
    local = local.replace(".", "").split("+")[0]
    return local, domain


def dot_variants(base: str) -> Iterator[str]:
    """Yield every possible dot-inserted variant of *base* (excluding the plain form).

    For a local part of length N there are 2^(N-1) - 1 variants (all non-zero
    subsets of N-1 gap positions).  For ``"ab"`` that is 1; for ``"abc"`` that
    is 3; for ``"user"`` (4 chars) that is 7.

    Warning: for long local parts (> 12 chars) this can be thousands of variants.
    Use :func:`nth_variant` or :func:`random_variant` for large local parts.

    Yields:
        Unique variant strings like ``"u.ser@gmail.com"``.
    """
    local, domain = _split(base)
    n = len(local)
    if n < 2:
        raise ValueError(f"Local part too short to dot-alias: {local!r}")

    # Each gap between characters can have a dot or not → 2^(n-1) combinations
    # We skip the all-zeros combination (= original, no dots)
    gaps = n - 1
    for mask in range(1, 2 ** gaps):
        chars: list[str] = [local[0]]
        for i in range(gaps):
            if mask & (1 << i):
                chars.append(".")
            chars.append(local[i + 1])
        yield "".join(chars) + "@" + domain


def nth_variant(base: str, n: int) -> str:
    """Return the *n*-th dot variant (0-indexed, deterministic).

    Wraps around if *n* >= total number of variants.

    Args:
        base: Full Gmail address.
        n:    Zero-based index into the variant sequence.

    Returns:
        A dot-alias variant string.
    """
    local, domain = _split(base)
    gaps = len(local) - 1
    total = 2 ** gaps - 1
    if total < 1:
        raise ValueError(f"Local part too short to dot-alias: {local!r}")

    mask = (n % total) + 1  # 1-based mask, wraps within [1, total]
    chars: list[str] = [local[0]]
    for i in range(gaps):
        if mask & (1 << i):
            chars.append(".")
        chars.append(local[i + 1])
    return "".join(chars) + "@" + domain


def random_variant(base: str, seed: int | None = None) -> str:
    """Return a random dot variant of *base*.

    Args:
        base: Full Gmail address.
        seed: Optional RNG seed for reproducible output in CI.

    Returns:
        A random dot-alias variant string.
    """
    local, domain = _split(base)
    gaps = len(local) - 1
    total = 2 ** gaps - 1
    if total < 1:
        raise ValueError(f"Local part too short to dot-alias: {local!r}")

    rng = random.Random(seed)
    mask = rng.randint(1, total)
    chars: list[str] = [local[0]]
    for i in range(gaps):
        if mask & (1 << i):
            chars.append(".")
        chars.append(local[i + 1])
    return "".join(chars) + "@" + domain


def is_dot_alias_of(address_a: str, address_b: str) -> bool:
    """Return True if *address_a* and *address_b* are Gmail dot-aliases of each other.

    Two addresses are dot-aliases when they have the same domain and the same
    local part after removing all dots.

    Args:
        address_a: First email address.
        address_b: Second email address.

    Returns:
        ``True`` if Gmail would deliver both to the same inbox.

    Example::

        is_dot_alias_of("u.ser@gmail.com", "user@gmail.com")  # True
        is_dot_alias_of("user@gmail.com", "user@outlook.com")  # False
    """
    if "@" not in address_a or "@" not in address_b:
        return False
    local_a, domain_a = address_a.lower().split("@", 1)
    local_b, domain_b = address_b.lower().split("@", 1)
    if domain_a != domain_b:
        return False
    # Strip dots and plus-tags before comparing
    norm_a = local_a.replace(".", "").split("+")[0]
    norm_b = local_b.replace(".", "").split("+")[0]
    return norm_a == norm_b
