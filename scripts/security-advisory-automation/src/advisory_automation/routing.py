from __future__ import annotations

from dataclasses import dataclass

from advisory_automation.advisory import Advisory, requires_lts_backport
from advisory_automation.branches import ee_repo_name


@dataclass(frozen=True)
class RoutingDecision:
    package: str          # affected composer package
    fix_repo: str         # repo the fix belongs in
    dedup_key: str        # the advisory's GHSA id
    lts_in_scope: bool    # severity >= high
    ee_repo: str | None   # derived ee-* repo, only when lts_in_scope


def route(advisory: Advisory) -> list[RoutingDecision]:
    """Map an advisory to one routing decision per affected composer package.

    Fix repo = the package's repo by the Pimcore identity convention (composer
    package `pimcore/X` lives in repo `pimcore/X`). A package whose repo name
    differs from its composer name is caught downstream by the repo/branch
    existence check and falls to human-fallback — no maintained map needed.
    """
    lts = requires_lts_backport(advisory.severity)
    decisions: list[RoutingDecision] = []
    for package in advisory.packages:
        decisions.append(
            RoutingDecision(
                package=package,
                fix_repo=package,
                dedup_key=advisory.ghsa_id,
                lts_in_scope=lts,
                ee_repo=ee_repo_name(package) if lts else None,
            )
        )
    return decisions
