import json
from pathlib import Path

import pytest
from advisory_automation.advisory import Advisory, parse_advisory, requires_lts_backport

FIXTURE = Path(__file__).parent / "fixtures" / "advisory_sample.json"


def test_parse_advisory_extracts_fields():
    raw = json.loads(FIXTURE.read_text())
    adv = parse_advisory(raw)
    assert adv.ghsa_id == "GHSA-34vf-ww58-w3wc"
    assert adv.state == "triage"
    assert adv.severity == "critical"
    assert adv.summary.startswith("Missing Authorization")


def test_parse_advisory_keeps_only_composer_packages():
    raw = json.loads(FIXTURE.read_text())
    adv = parse_advisory(raw)
    assert adv.packages == ("pimcore/admin-ui-classic-bundle",)


def test_parse_advisory_handles_empty():
    adv = parse_advisory({})
    assert adv.ghsa_id == ""
    assert adv.packages == ()


@pytest.mark.parametrize("severity,expected", [
    ("critical", True), ("high", True), ("HIGH", True),
    ("moderate", False), ("low", False), ("", False),
])
def test_requires_lts_backport(severity, expected):
    assert requires_lts_backport(severity) is expected
