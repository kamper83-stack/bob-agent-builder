"""
email_utils.py
--------------
Utilities for generating unique test email addresses using Gmail sub-addressing
(Plus-Aliasing): username+tag@gmail.com routes to username@gmail.com.

Usage in tests:
    from email_utils import unique_email, dot_alias_email

    addr = unique_email("yourname@gmail.com")
    # → "yourname+a3f2c1b0@gmail.com"

    addr = dot_alias_email("yourname@gmail.com", seed=42)
    # → "y.ourname@gmail.com"  (fallback when + is blocked by regex)
"""

import uuid
import hashlib
import random
import string


def unique_email(base: str, tag: str | None = None) -> str:
    """Return a unique plus-alias for *base*.

    Args:
        base: A full Gmail address, e.g. ``"user@gmail.com"``.
        tag:  Optional fixed tag.  If omitted, an 8-char hex suffix is
              generated from ``uuid4`` so every call produces a fresh address.

    Returns:
        A unique address like ``"user+a1b2c3d4@gmail.com"``.

    Raises:
        ValueError: If *base* is not a valid ``user@domain`` address.
    """
    if "@" not in base:
        raise ValueError(f"Invalid email address: {base!r}")

    local, domain = base.split("@", 1)
    # Strip any existing plus-tag so the function is idempotent on its own output
    local = local.split("+")[0]
    suffix = tag if tag is not None else uuid.uuid4().hex[:8]
    return f"{local}+{suffix}@{domain}"


def dot_alias_email(base: str, seed: int | None = None) -> str:
    """Return a dot-alias variant of *base* (Gmail ignores dots in local part).

    Useful as a fallback when the target system's email regex blocks ``+``.
    A dot is inserted after the first character of the local part.

    Args:
        base: A full Gmail address, e.g. ``"username@gmail.com"``.
        seed: Optional integer seed for reproducible output in tests.

    Returns:
        An address like ``"u.sername@gmail.com"`` that Gmail treats identically
        to the original but most systems consider a different address.

    Raises:
        ValueError: If the local part is shorter than 2 characters.
    """
    if "@" not in base:
        raise ValueError(f"Invalid email address: {base!r}")

    local, domain = base.split("@", 1)
    local = local.split("+")[0]  # strip any existing plus-tag

    if len(local) < 2:
        raise ValueError(f"Local part too short to dot-alias: {local!r}")

    # Insert a dot after a pseudo-random position (deterministic with seed)
    rng = random.Random(seed if seed is not None else int(hashlib.md5(local.encode()).hexdigest(), 16))
    pos = rng.randint(1, len(local) - 1)
    aliased = local[:pos] + "." + local[pos:]
    return f"{aliased}@{domain}"


def bulk_unique_emails(base: str, count: int) -> list[str]:
    """Return *count* unique plus-alias addresses derived from *base*.

    Handy for seeding parallel test runs.

    Example::

        addrs = bulk_unique_emails("user@gmail.com", 5)
        # ["user+00000001@gmail.com", "user+00000002@gmail.com", ...]
    """
    if count < 1:
        raise ValueError("count must be >= 1")
    local, domain = base.split("@", 1)
    local = local.split("+")[0]
    return [f"{local}+{i:08x}@{domain}" for i in range(1, count + 1)]
