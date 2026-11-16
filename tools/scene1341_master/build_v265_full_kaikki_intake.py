#!/usr/bin/env python3
"""V265 all-scene Kaikki exact-entry intake. No semantic selection or QA promotion.

Usage:
 python tools/scene1341_master/build_v265_full_kaikki_intake.py \
   --root . --kaikki /path/to/kaikki.org-dictionary-English.jsonl.gz --release V265 --apply

Default = read-only dry run. Source archive SHA256 is pinned to a separately
verified 2026-11-13 snapshot. Requires all 1341 scene JSONs and current index.
"""
import argparse
import collections
import gzip
import hashlib
import json
import pathlib
import unicodedata

ARCHIVE_SHA256 = "4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99"
MASTER_SHA256 = "62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986"
INDEX = "tools/scene1341_master/production/SCENE1341_LIVE_INDEX.json"
REPORT = "tools/scene1341_master/qa_reports/CGMASTER_V265_FULL1341_KAIKKI_INTAKE_REPORT.json"

def key(s):
    return unicodedata.normalize("NFC", s.strip()).casefold()

def blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def candidate(entry, line):
    sounds = entry.get("sounds") or []
    ipa = sorted({s["ipa"] for s in sounds if isinstance(s, dict)
                  and isinstance(s.get("ipa"), str) and s["ipa"].strip()})
    senses = []
    for n, s in enumerate(entry.get("senses") or []):
        glosses = [g for g in (s.get("glosses") or s.get("raw_glosses") or []) if isinstance(g, str)]
        senses.append({"source_sense_index": n, "glosses": glosses,
                       "native_example_count": len(s.get("examples") or [])})
    return {"source_line": line, "source_word": entry.get("word"), "pos": entry.get("pos"),
            "ipa_candidates": ipa, "senses": senses}

def run(root, archive, release, date, apply):
    root, archive = pathlib.Path(root), pathlib.Path(archive)
    ipath = root / INDEX
    idx = json.loads(ipath.read_text(encoding="utf8"))
    assert (idx["scene_count"], len(idx["scenes"]), idx["source_associations"]) == (1341, 1341, 230289)
    assert idx["source_master_sha256"] == MASTER_SHA256
    assert idx["release_allowed"] is False and idx["srs_eligible"] is False
    target = set()
    identity = set()
    for sid, meta in idx["scenes"].items():
        data = (root / meta["path"]).read_bytes()
        assert blob_sha(data) == meta["git_blob_sha1"], ("index blob mismatch", sid)
        doc = json.loads(data)
        assert doc["scene_id"] == sid and len(doc["records"]) == meta["records"] == doc["record_count"]
        assert doc["release_allowed"] is False and doc["srs_eligible"] is False
        for r in doc["records"]:
            assert r["scene_id"] == sid and r["release_allowed"] is False and r.get("srs_eligible") is False
            n = r["source_final_row"]
            assert n not in identity
            identity.add(n)
            target.add(key(r["question_page"]["expression"]))
    assert identity == set(range(1, 230290)), "original Sense-Scene associations changed"
    with archive.open("rb") as f:
        digest = hashlib.file_digest(f, "sha256").hexdigest()
    assert digest == ARCHIVE_SHA256, "unverified Kaikki source: no mutation allowed"
    found = collections.defaultdict(list)
    malformed = 0
    opener = gzip.open if archive.suffix == ".gz" else open
    with opener(archive, "rt", encoding="utf8") as f:
        for line, raw in enumerate(f, 1):
            try: entry = json.loads(raw)
            except json.JSONDecodeError:
                malformed += 1
                continue
            word = entry.get("word")
            if isinstance(word, str) and key(word) in target:
                found[key(word)].append(candidate(entry, line))
    assert malformed == 0, ("malformed Kaikki JSONL", malformed)
    counters = collections.Counter()
    changes = {}
    for sid, meta in idx["scenes"].items():
        doc = json.loads((root / meta["path"]).read_text(encoding="utf8"))
        changed = False
        for r in doc["records"]:
            native = found.get(key(r["question_page"]["expression"]))
            if not native:
                counters["not_found"] += 1
                continue
            counters["exact_entry_associations"] += 1
            evidence = {
                "schema": "scene1341-kaikki-full-native/v1", "archive_sha256": digest,
                "source_final_row": r["source_final_row"],
                "expression_exact": r["question_page"]["expression"],
                "candidates": native, "native_sense_selection": "UNRESOLVED",
                "qa_stage": "待审", "first_review": False, "release_allowed": False}
            prior = r.get("kaikki_full_native_evidence")
            if prior and prior.get("archive_sha256") != digest:
                counters["source_conflict_hold"] += 1
                continue
            if prior != evidence:
                r["kaikki_full_native_evidence"] = evidence
                changed = True
                counters["evidence_updated"] += 1
            if len(native) == 1 and len(native[0]["senses"]) == 1:
                counters["single_entry_single_sense_candidate"] += 1
            else:
                counters["ambiguous_hold"] += 1
            ipas = [set(x["ipa_candidates"]) for x in native if unicodedata.normalize("NFC", x["source_word"]) == unicodedata.normalize("NFC", r["question_page"]["expression"])]
            common = set.intersection(*ipas) if len(ipas) == len(native) and ipas and all(ipas) else set()
            if len(common) == 1 and not r["question_page"].get("ipa_candidate"):
                r["question_page"]["ipa_candidate"] = next(iter(common))
                r["ipa_full_evidence"] = {
                    "source_archive_sha256": digest,
                    "native_source_lines": [x["source_line"] for x in native],
                    "selection_method": "EXACT_ENTRY_CONCORDANT_IPA",
                    "qa_stage": "待审", "first_review": False, "release_allowed": False}
                changed = True
                counters["new_ipa_candidates"] += 1
        if changed:
            raw = (json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
            changes[sid] = (raw, blob_sha(raw))
    counters.update({"scene_count": 1341, "associations": 230289,
                     "unique_expressions": len(target), "exact_native_expressions": len(found),
                     "changed_scenes": len(changes)})
    report = {"schema": "cgmaster-v265-full-intake/v1", "release": release,
              "archive_sha256": digest, "status": "TEST_ONLY_QA_PENDING" if apply else "DRY_RUN",
              "counts": dict(counters), "changed_scene_ids": list(changes),
              "qa_stage": "待审", "first_review": 0, "release_allowed": False, "srs_eligible": False}
    if apply and changes:
        # Validate staged data first, then publish index only after scene writes.
        for sid, (raw, sha) in changes.items():
            d = json.loads(raw)
            assert blob_sha(raw) == sha and d["release_allowed"] is False and d["srs_eligible"] is False
            assert d["record_count"] == len(d["records"])
            assert all(x["release_allowed"] is False and x.get("srs_eligible") is False for x in d["records"])
        for sid, (raw, sha) in changes.items():
            (root / idx["scenes"][sid]["path"]).write_bytes(raw)
            idx["scenes"][sid]["git_blob_sha1"] = sha
        idx["master_release"] = {
            "metadata_schema": "scene1341-master-release/v1", "version": release,
            "content_baseline": release + "_KAIKKI_FULL1341_INTAKE",
            "published_date": date, "stage": "TEST_ONLY_QA_PENDING",
            "headline": f"Kaikki全场景证据新增/更新{counters['evidence_updated']}条；IPA候选新增{counters['new_ipa_candidates']}条；全部待审",
            "changes": [{"category": x, "count": counters[x]} for x in
                        ("evidence_updated", "new_ipa_candidates", "ambiguous_hold")],
            "changed_scene_ids": list(changes), "qa_stage": "待审",
            "release_allowed": False, "srs_eligible": False}
        ipath.write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf8")
        out = root / REPORT
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    return report

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", default=".")
    p.add_argument("--kaikki", required=True)
    p.add_argument("--release", default="V265")
    p.add_argument("--date", default="2026-11-16")
    p.add_argument("--apply", action="store_true")
    a = p.parse_args()
    print(json.dumps(run(a.root, a.kaikki, a.release, a.date, a.apply), ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
