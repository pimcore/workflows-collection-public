from __future__ import annotations

import re

# A platform-version composer.json *conflict* bound: "<low || >=high".
# The compatible line is the start of the gap (the value after "<").
_CONFLICT_RE = re.compile(r"<\s*([0-9][0-9.]*)\s*\|\|\s*>=\s*([0-9][0-9.]*)")


def is_unified_era(platform_line: str) -> bool:
    """2026.1 and later use unified branch naming (repo version == platform version)."""
    return int(platform_line.split(".")[0]) >= 2026


def parse_compatible_line(conflict_constraint: str) -> str:
    """Return the compatible version line from a conflict bound like '<2.3 || >=3'."""
    match = _CONFLICT_RE.search(conflict_constraint or "")
    if not match:
        raise ValueError(f"unrecognised conflict constraint: {conflict_constraint!r}")
    return match.group(1)


def _version_key(line: str) -> tuple[int, ...]:
    return tuple(int(part) for part in line.split("."))


def select_lowest_active_line(
    candidate_lines: list[str], eol_lines: set[str]
) -> str:
    """Lowest non-EOL bugfix line by numeric version order."""
    active = [line for line in candidate_lines if line not in set(eol_lines)]
    if not active:
        raise ValueError("no active bugfix lines among candidates")
    return min(active, key=_version_key)


def ee_repo_name(base_repo: str) -> str:
    """Derive the conventional ee-* LTS counterpart: 'owner/name' -> 'owner/ee-name'."""
    if "/" not in base_repo:
        raise ValueError(f"expected 'owner/name', got {base_repo!r}")
    owner, name = base_repo.split("/", 1)
    return f"{owner}/ee-{name}"


def select_branch_repo(
    base_repo: str, branch_in_base: bool, branch_in_ee: bool
) -> str:
    """Where the target branch lives: base repo first, else the conventional
    ee-* counterpart. Raises if neither has it (human-fallback — this also
    covers packages that simply have no ee-* repo).

    Branch-presence is supplied by the caller's I/O (Plan 2): branch_in_ee is
    True only when the derived ee-* repo exists AND has the branch.
    """
    if branch_in_base:
        return base_repo
    if branch_in_ee:
        return ee_repo_name(base_repo)
    raise ValueError(
        f"branch not found in base repo {base_repo!r} or its ee-* counterpart"
    )
