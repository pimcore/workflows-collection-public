from pathlib import Path

import pytest
from advisory_automation.package_map import (
    RepoConfig,
    load_package_map,
    resolve_repo,
)

FIXTURE = Path(__file__).parent / "fixtures" / "package_repo_map.yaml"


@pytest.fixture
def package_map():
    return load_package_map(FIXTURE)


def test_load_returns_repo_configs(package_map):
    assert package_map["pimcore/data-hub"] == RepoConfig(
        package="pimcore/data-hub", repo="pimcore/data-hub"
    )


def test_load_includes_all_packages(package_map):
    assert set(package_map) == {"pimcore/pimcore", "pimcore/data-hub"}


def test_resolve_known_package(package_map):
    assert resolve_repo("pimcore/data-hub", package_map).repo == "pimcore/data-hub"


def test_resolve_unknown_package_returns_none(package_map):
    assert resolve_repo("pimcore/does-not-exist", package_map) is None
