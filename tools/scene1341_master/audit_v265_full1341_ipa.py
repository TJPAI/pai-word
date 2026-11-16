#!/usr/bin/env python3
"""Read-only, full-1341 source-row and unique-expression IPA coverage audit."""
import collections
import hashlib
import json
import pathlib
import sys
import unicodedata

INDEX = "tools/scene1341_master/production/SCENE1341_LIVE_INDEX.json"
def blob(raw):
    return hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()

def norm(s):
    return unicodedata.normalize("NFC", s.strip()).casefold()

def audit(root):
    root = pathlib.Path(root)
    idx = json.loads((root / INDEX).read_text(encoding="utf8"))
    assert len(idx["scenes"]) == idx["scene_count"] == 1341
    assert idx["source_associations"] == 230289
    assert idx["release_allowed"] is False and idx["srs_eligible"] is False
    counts = collections.Counter()
    expr = collections.defaultdict(lambda: {"total": 0, "ipa": 0, "native": 0})
    ids = set()
    for sid, meta in sorted(idx["scenes"].items()):
        raw = (root / meta["path"]).read_bytes()
        assert blob(raw) == meta["git_blob_sha1"], ("hash mismatch", sid)
        doc = json.loads(raw)
        assert doc["scene_id"] == sid and len(doc["records"]) == doc["record_count"] == meta["records"]
        assert doc["release_allowed"] is False and doc["srs_eligible"] is False
        for r in doc["records"]:
            assert r["scene_id"] == sid and not r["release_allowed"] and not r.get("srs_eligible")
            n = r["source_final_row"]
            assert n not in ids, ("duplicate source row", n)
            ids.add(n)
            word = norm(r["question_page"]["expression"])
            typ = "multiword" if any(ch.isspace() for ch in word) else "singleword"
            ipa = bool((r["question_page"].get("ipa_candidate") or "").strip())
            evidence = r.get("ipa_full_evidence") or r.get("ipa_evidence")
            native = bool(r.get("kaikki_full_native_evidence") or r.get("kaikki_native_evidence"))
            counts[typ + "_source_associations"] += 1
            counts[typ + "_with_ipa"] += int(ipa)
            counts[typ + "_ipa_without_provenance"] += int(ipa and not evidence and not r.get("editorial_evidence"))
            counts[typ + "_with_native_evidence"] += int(native)
            counts["qa_approved"] += int(r.get("qa_status") == "1审")
            counts["sources_total"] += 1
            e = expr[(typ, word)]
            e["total"] += 1
            e["ipa"] += int(ipa)
            e["native"] += int(native)
    assert len(ids) == 230289 and min(ids) == 1 and max(ids) == 230289
    for (typ, _), e in expr.items():
        counts[typ + "_unique_expressions"] += 1
        counts[typ + "_unique_any_ipa"] += int(e["ipa"] > 0)
        counts[typ + "_unique_all_ipa"] += int(e["ipa"] == e["total"])
        counts[typ + "_unique_any_native_evidence"] += int(e["native"] > 0)
    return {
        "schema": "cgmaster-v265-ipa-audit/v1",
        "source_version": idx["master_release"]["version"],
        "source_master_sha256": idx["source_master_sha256"],
        "scene_count": 1341,
        "all_source_rows_unique": True,
        "test_only": True,
        "counts": dict(sorted(counts.items())),
        "note": "IPA candidate coverage is not CG-QA certification or approved IPA."}

if __name__ == "__main__":
    report = audit(sys.argv[1] if len(sys.argv) > 1 else ".")
    print(json.dumps(report, ensure_ascii=False, indent=2))
