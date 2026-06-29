import pytest
from advisory_automation.ghsa import extract_ghsa_id


@pytest.mark.parametrize("text,expected", [
    ("https://github.com/pimcore/pimcore/security/advisories/GHSA-8mjv-1234-abcd",
     "GHSA-8mjv-1234-abcd"),
    ("Security-Advisory: GHSA-AAAA-BBBB-CCCC", "GHSA-aaaa-bbbb-cccc"),
    ("see ghsa-8mjv-1234-abcd for details", "GHSA-8mjv-1234-abcd"),
    ("no advisory here", None),
    ("", None),
    (None, None),
])
def test_extract_ghsa_id(text, expected):
    assert extract_ghsa_id(text) == expected
