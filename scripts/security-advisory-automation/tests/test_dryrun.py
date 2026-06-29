from advisory_automation.advisory import Advisory
from advisory_automation.dryrun import BANNER, format_report
from advisory_automation.routing import route


def _critical_advisory():
    return Advisory(
        ghsa_id="GHSA-34vf-ww58-w3wc", state="triage", severity="critical",
        summary="IDOR in version deletion",
        packages=("pimcore/admin-ui-classic-bundle",),
    )


def test_format_report_includes_banner_and_routing():
    adv = _critical_advisory()
    report = format_report(adv, route(adv, package_map={}))
    assert BANNER in report
    assert "GHSA-34vf-ww58-w3wc" in report
    assert "fix repo:     pimcore/admin-ui-classic-bundle" in report
    assert "pimcore/ee-admin-ui-classic-bundle" in report  # ee-* for critical
    assert "NOT executed" in report


def test_format_report_low_severity_no_lts():
    adv = Advisory(
        ghsa_id="GHSA-aaaa-bbbb-cccc", state="published", severity="low",
        summary="minor", packages=("pimcore/data-hub",),
    )
    report = format_report(adv, route(adv, package_map={}))
    assert "no (severity < high)" in report


def test_format_report_no_packages_is_human_fallback():
    adv = Advisory(
        ghsa_id="GHSA-aaaa-bbbb-cccc", state="triage", severity="high",
        summary="x", packages=(),
    )
    report = format_report(adv, route(adv, package_map={}))
    assert "HUMAN-FALLBACK" in report
