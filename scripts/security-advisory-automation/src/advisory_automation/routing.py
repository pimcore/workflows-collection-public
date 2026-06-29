from __future__ import annotations

from dataclasses import dataclass

from advisory_automation.advisory import Advisory, requires_lts_backport
from advisory_automation.branches import ee_repo_name
from advisory_automation.package_map import RepoConfig, resolve_repo


@dataclass(frozen=True)
class RoutingDecision:
    package: str          # affected composer package
    fix_repo: str         # repo the fix belongs in
    dedup_key: str        # the advisory's GHSA id
    lts_in_scope: bool    # severity >= high
    ee_repo: str | None   # derived ee-* repo, only when lts_in_scope


def route(
    advisory: Advisory, package_map: dict[str, RepoConfig] | None = None
) -> list[RoutingDecision]:
    """Map an advisory to one routing decision per affected composer package.

    Fix repo resolution: a package_map override if present, else identity
    (composer package name == repo name — the Pimcore convention).
    """
    lts = requires_lts_backport(advisory.severity)
    decisions: list[RoutingDecision] = []
    for package in advisory.packages:
        cfg = resolve_repo(package, package_map)
        fix_repo = cfg.repo if cfg is not None else package
        decisions.append(
            RoutingDecision(
                package=package,
                fix_repo=fix_repo,
                dedup_key=advisory.ghsa_id,
                lts_in_scope=lts,
                ee_repo=ee_repo_name(fix_repo) if lts else None,
            )
        )
    return decisions
