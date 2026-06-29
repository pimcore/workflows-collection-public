from advisory_automation.advisory import Advisory
from advisory_automation.routing import RoutingDecision, route


def _adv(severity="critical", packages=("pimcore/admin-ui-classic-bundle",)):
    return Advisory(
        ghsa_id="GHSA-34vf-ww58-w3wc", state="triage",
        severity=severity, summary="x", packages=packages,
    )


def test_route_uses_identity_repo():
    # fix repo is the package name (identity convention)
    [d] = route(_adv())
    assert d.fix_repo == "pimcore/admin-ui-classic-bundle"
    assert d.dedup_key == "GHSA-34vf-ww58-w3wc"


def test_route_critical_sets_lts_and_ee_repo():
    [d] = route(_adv(severity="critical"))
    assert d.lts_in_scope is True
    assert d.ee_repo == "pimcore/ee-admin-ui-classic-bundle"


def test_route_low_severity_no_lts():
    [d] = route(_adv(severity="low"))
    assert d.lts_in_scope is False
    assert d.ee_repo is None


def test_route_one_decision_per_package():
    decisions = route(_adv(packages=("pimcore/a", "pimcore/b")))
    assert [d.fix_repo for d in decisions] == ["pimcore/a", "pimcore/b"]
