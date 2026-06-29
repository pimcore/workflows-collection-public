from __future__ import annotations

from dataclasses import dataclass

from advisory_automation.ghsa import extract_ghsa_id


@dataclass(frozen=True)
class Advisory:
    ghsa_id: str            # canonical GHSA id (dedup key)
    state: str              # e.g. "triage", "draft", "published"
    severity: str           # "low" | "moderate" | "high" | "critical"
    summary: str
    packages: tuple[str, ...]  # affected composer package names


def parse_advisory(raw: dict) -> Advisory:
    """Parse a GitHub repository-security-advisory JSON object into an Advisory.

    Only composer packages are kept (Pimcore advisories may also list other
    ecosystems). The ghsa id is normalised via extract_ghsa_id so it matches
    the dedup key used elsewhere.
    """
    ghsa = extract_ghsa_id(raw.get("ghsa_id", "")) or ""
    packages = tuple(
        v["package"]["name"]
        for v in (raw.get("vulnerabilities") or [])
        if (v.get("package") or {}).get("ecosystem") == "composer"
        and v.get("package", {}).get("name")
    )
    return Advisory(
        ghsa_id=ghsa,
        state=raw.get("state", ""),
        severity=(raw.get("severity") or "").lower(),
        summary=raw.get("summary", ""),
        packages=packages,
    )


def requires_lts_backport(severity: str) -> bool:
    """LTS backport is in scope only for severity >= high (high or critical)."""
    return severity.lower() in {"high", "critical"}
