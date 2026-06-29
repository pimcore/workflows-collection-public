from __future__ import annotations

import re

# GHSA IDs are "GHSA-" + three hyphen-separated groups of four base32 chars.
_GHSA_RE = re.compile(r"GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}", re.IGNORECASE)


def extract_ghsa_id(text: str | None) -> str | None:
    """Return the canonical GHSA ID found in *text*, or None.

    Canonical form is "GHSA-" with a lowercase suffix, so the same advisory
    referenced in any case produces the same dedup key.
    """
    if not text:
        return None
    match = _GHSA_RE.search(text)
    if not match:
        return None
    return "GHSA-" + match.group(0)[len("GHSA-"):].lower()
