import pytest
from advisory_automation.branches import (
    ee_repo_name,
    is_unified_era,
    parse_compatible_line,
    select_branch_repo,
    select_lowest_active_line,
)


@pytest.mark.parametrize("line,unified", [
    ("2026.1", True),
    ("2026.2", True),
    ("2025.4", False),
    ("11.5", False),
])
def test_is_unified_era(line, unified):
    assert is_unified_era(line) is unified


@pytest.mark.parametrize("constraint,expected", [
    ("<2.3 || >= 3", "2.3"),       # data-hub @ 2025.4 -> 2.3
    ("<2026.1 || >=2026.2", "2026.1"),
    ("<2.3 || >=3", "2.3"),         # spacing variations
])
def test_parse_compatible_line(constraint, expected):
    assert parse_compatible_line(constraint) == expected


def test_parse_compatible_line_rejects_garbage():
    with pytest.raises(ValueError):
        parse_compatible_line("^2.3")


def test_select_lowest_active_line_picks_lowest_non_eol():
    assert select_lowest_active_line(
        ["2026.1", "2026.2", "2025.4"], eol_lines={"2025.4"}
    ) == "2026.1"


def test_select_lowest_active_line_all_eol_raises():
    with pytest.raises(ValueError):
        select_lowest_active_line(["2025.4"], eol_lines={"2025.4"})


def test_ee_repo_name_derives_counterpart():
    assert ee_repo_name("pimcore/pimcore") == "pimcore/ee-pimcore"
    assert ee_repo_name("pimcore/data-hub") == "pimcore/ee-data-hub"


def test_ee_repo_name_requires_owner_slash():
    with pytest.raises(ValueError):
        ee_repo_name("pimcore")


def test_select_branch_repo_prefers_base():
    assert select_branch_repo("pimcore/pimcore", True, False) == "pimcore/pimcore"


def test_select_branch_repo_falls_back_to_ee():
    # branch absent from pimcore/pimcore, present in derived ee-pimcore
    assert select_branch_repo("pimcore/pimcore", False, True) == "pimcore/ee-pimcore"


def test_select_branch_repo_absent_everywhere_raises():
    with pytest.raises(ValueError):
        select_branch_repo("pimcore/data-hub", False, False)
