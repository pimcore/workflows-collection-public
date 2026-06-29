from __future__ import annotations

import json
import subprocess


def _gh_json(path: str):
    """Run `gh api <path>` and return the parsed JSON. Read-only."""
    result = subprocess.run(
        ["gh", "api", path],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)


def fetch_advisory(repo: str, ghsa_id: str) -> dict:
    """Fetch one repository security advisory by GHSA id."""
    return _gh_json(f"repos/{repo}/security-advisories/{ghsa_id}")


def fetch_latest_advisories(repo: str, limit: int = 5) -> list[dict]:
    """Fetch the most recent repository security advisories."""
    data = _gh_json(f"repos/{repo}/security-advisories?per_page={int(limit)}")
    return data if isinstance(data, list) else []
