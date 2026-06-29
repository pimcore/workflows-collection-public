from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml

_DEFAULT_MAP_PATH = (
    Path(__file__).resolve().parents[2] / "config" / "package_repo_map.yaml"
)


@dataclass(frozen=True)
class RepoConfig:
    package: str
    repo: str


def load_package_map(path: Path | None = None) -> dict[str, RepoConfig]:
    path = path or _DEFAULT_MAP_PATH
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    result: dict[str, RepoConfig] = {}
    for package, cfg in (data.get("packages") or {}).items():
        result[package] = RepoConfig(package=package, repo=cfg["repo"])
    return result


def resolve_repo(
    package: str, package_map: dict[str, RepoConfig] | None = None
) -> RepoConfig | None:
    if package_map is None:
        package_map = load_package_map()
    return package_map.get(package)
