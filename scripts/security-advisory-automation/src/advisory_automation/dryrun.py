from __future__ import annotations

import argparse

from advisory_automation.advisory import Advisory, parse_advisory
from advisory_automation.advisory_source import (
    fetch_advisory,
    fetch_latest_advisories,
)
from advisory_automation.routing import RoutingDecision, route

BANNER = "DRY RUN — no tickets, PRs, or writes performed."


def format_report(advisory: Advisory, decisions: list[RoutingDecision]) -> str:
    """Render the routing decision for one advisory as human-readable text."""
    lines = [
        BANNER,
        f"Advisory {advisory.ghsa_id}  [state: {advisory.state}, "
        f"severity: {advisory.severity}]",
        f"  summary: {advisory.summary}",
    ]
    if not decisions:
        lines.append(
            "  affects: (no composer packages found) "
            "→ HUMAN-FALLBACK: cannot route automatically"
        )
        return "\n".join(lines)
    lines.append(
        "  affects: " + ", ".join(d.package for d in decisions)
    )
    for d in decisions:
        if d.lts_in_scope:
            lts = (
                f"YES (severity >= high) → ee-* repo {d.ee_repo} "
                "(if branch absent from base)"
            )
        else:
            lts = "no (severity < high)"
        lines += [
            f"  → {d.package}",
            f"      fix repo:     {d.fix_repo}   (package→repo)",
            f"      dedup key:    {d.dedup_key}",
            f"      LTS backport: {lts}",
            "      WOULD: create tracking issue + assign Copilot   (NOT executed)",
        ]
    return "\n".join(lines)


def _report_for(raw: dict) -> str:
    advisory = parse_advisory(raw)
    return format_report(advisory, route(advisory))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="advisory-dryrun",
        description="Read-only dry run: show the routing decision for an advisory.",
    )
    parser.add_argument("ghsa_id", nargs="?", help="GHSA id to evaluate")
    parser.add_argument("--repo", default="pimcore/pimcore",
                        help="advisory source repo (default: pimcore/pimcore)")
    parser.add_argument("--latest", type=int, metavar="N",
                        help="instead of a GHSA id, evaluate the N most recent advisories")
    args = parser.parse_args(argv)

    if args.latest:
        raws = fetch_latest_advisories(args.repo, args.latest)
    elif args.ghsa_id:
        raws = [fetch_advisory(args.repo, args.ghsa_id)]
    else:
        parser.error("provide a GHSA id or --latest N")
        return 2  # unreachable; parser.error exits

    print(("\n\n").join(_report_for(raw) for raw in raws))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
