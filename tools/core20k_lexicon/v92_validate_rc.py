#!/usr/bin/env python3
"""V92: independently check local V3RC full register against editorial ledger.
Usage: python tools/core20k_lexicon/v92_validate_rc.py v91.zip
Does NOT perform semantic certification.
"""
import sys, json, zipfile, hashlib, collections
p=sys.argv[1]
with zipfile.ZipFile(p) as z:
    load=lambda n:[json.loads(x) for x in z.read(n).splitlines() if x.strip()]
    register=load("all_27471_v3rc_working_register.jsonl")
    ledger=load("v81_v91_all_editorial_deltas.jsonl")
assert len(register)==27471, "source count mismatch"
by_id={r["teaching_sense_id"]:r for r in register}
by_delta={d["teaching_sense_id"]:d for d in ledger}
assert len(by_id)==len(register), "duplicate register ID"
assert len(by_delta)==len(ledger), "duplicate ledger ID"
embedded={sid for sid,r in by_id.items() if r.get("v3rc_editorial_delta")}
assert embedded==set(by_delta), "embedded vs ledger ID mismatch"
for sid,d in by_delta.items():
    r=by_id[sid]
    for field in ("rank","lemma","pos","definition_en"):
        assert r[field]==d[field], f"{sid} drifted in {field}"
    e=r["v3rc_editorial_delta"]
    gloss=d.get("gloss_zh_editorial_candidate") or d.get("gloss_zh")
    assert e["gloss_zh"]==gloss and gloss.strip(), f"{sid} gloss mismatch"
    assert not e.get("semantic_certified") and not e.get("production_ready")
print(json.dumps({"status":"PASS","sense_count":len(register),
    "editorial_count":len(ledger),
    "zip_sha256":hashlib.sha256(open(p,"rb").read()).hexdigest(),
    "semantic_certified_by_this_check":0},indent=2))
