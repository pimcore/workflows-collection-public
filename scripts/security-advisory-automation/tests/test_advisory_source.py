from advisory_automation import advisory_source


def test_fetch_advisory_builds_correct_path(monkeypatch):
    captured = {}

    def fake_gh_json(path):
        captured["path"] = path
        return {"ghsa_id": "GHSA-x"}

    monkeypatch.setattr(advisory_source, "_gh_json", fake_gh_json)
    result = advisory_source.fetch_advisory("pimcore/pimcore", "GHSA-x")
    assert captured["path"] == "repos/pimcore/pimcore/security-advisories/GHSA-x"
    assert result["ghsa_id"] == "GHSA-x"


def test_fetch_latest_builds_correct_path(monkeypatch):
    captured = {}

    def fake_gh_json(path):
        captured["path"] = path
        return [{"ghsa_id": "GHSA-a"}, {"ghsa_id": "GHSA-b"}]

    monkeypatch.setattr(advisory_source, "_gh_json", fake_gh_json)
    result = advisory_source.fetch_latest_advisories("pimcore/pimcore", 2)
    assert captured["path"] == "repos/pimcore/pimcore/security-advisories?per_page=2"
    assert len(result) == 2


def test_fetch_latest_non_list_returns_empty(monkeypatch):
    monkeypatch.setattr(advisory_source, "_gh_json", lambda path: {"message": "err"})
    assert advisory_source.fetch_latest_advisories("pimcore/pimcore", 2) == []
