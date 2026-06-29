import pytest
from advisory_automation.advisory import Advisory
from advisory_automation.package_map import RepoConfig
from advisory_automation.routing import RoutingDecision, route


def _adv(severity="critical", packages=("pimcore/admin-ui-classic-bundle",)):
    return Advisory(
        ghsa_id="GHSA-34vf-ww58-w3wc", state="triage",
        severity=severity, summary="x", packages=packages,
    )


def test_route_identity_when_unmapped():
    # no map entry -> fix repo is the package name (identity convention)
    [d] = route(_adv(), package_map={})
    assert d.fix_repo == "pimcore/admin-ui-classic-bundle"
    assert d.dedup_key == "GHSA-34vf-ww58-w3wc"


def test_route_uses_map_override():
    pm = {"pimcore/weird-pkg": RepoConfig(package="pimcore/weird-pkg", repo="pimcore/actual-repo")}
    [d] = route(_adv(packages=("pimcore/weird-pkg",)), package_map=pm)
    assert d.fix_repo == "pimcore/actual-repo"


def test_route_critical_sets_lts_and_ee_repo():
    [d] = route(_adv(severity="critical"), package_map={})
    assert d.lts_in_scope is True
    assert d.ee_repo == "pimcore/ee-admin-ui-classic-bundle"


def test_route_low_severity_no_lts():
    [d] = route(_adv(severity="low"), package_map={})
    assert d.lts_in_scope is False
    assert d.ee_repo is None


def test_route_one_decision_per_package():
    decisions = route(_adv(packages=("pimcore/a", "pimcore/b")), package_map={})
    assert [d.fix_repo for d in decisions] == ["pimcore/a", "pimcore/b"]
