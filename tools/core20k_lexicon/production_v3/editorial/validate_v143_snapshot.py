#!/usr/bin/env python3
"""V143 snapshot verification. Verify both provenance AND joined Chinese gloss data."""
import argparse, hashlib, json, zipfile
def records(z,n):
    return [json.loads(s) for s in z.read(n).splitlines() if s.strip()]
def validate(path):
    with zipfile.ZipFile(path) as z:
        m=json.loads(z.read("manifest.json"))
        for f,sha in m["files_sha256"].items():
            if hashlib.sha256(z.read(f)).hexdigest()!=sha:
                raise ValueError("SHA256 mismatch: "+f)
        d=records(z,"full_688_drafts.jsonl")
        p=records(z,"remaining_988_source.jsonl")
        j=records(z,"current_1676_joint_state.jsonl")
    key=lambda r:r.get("sense_key") or r.get("source_sense_key")
    dm={key(r):r for r in d};pm={key(r):r for r in p};jm={key(r):r for r in j}
    if (len(d),len(p),len(j),len(dm),len(pm),len(jm))!=(688,988,1676,688,988,1676):
        raise ValueError("count or duplicate key")
    if dm.keys() & pm.keys() or jm.keys() != dm.keys()|pm.keys():
        raise ValueError("missing or overlapping entries")
    for k,r in dm.items():
        joined=jm[k]
        for fld in ("rank","lemma","pos","definition_en","ili","source_lexemes","gloss_zh_draft"):
            if r.get(fld)!=joined.get(fld):
                raise ValueError("joined draft mismatch: "+k+" "+fld)
        if not str(r.get("gloss_zh_draft") or "").strip():
            raise ValueError("empty draft: "+k)
    for k,r in pm.items():
        if str(jm[k].get("gloss_zh_draft") or "").strip():
            raise ValueError("pending row unexpectedly has gloss "+k)
    for r in j:
        if r.get("production_ready") or r.get("semantically_certified") or r.get("semantic_certified"):
            raise ValueError("uncertified record mislabeled")
    return {"rows":1676,"draft_glosses_preserved":688,"pending":988,"independent_certified":0,"status":"PASS"}
if __name__=="__main__":
    ap=argparse.ArgumentParser();ap.add_argument("archive");args=ap.parse_args()
    print(json.dumps(validate(args.archive),ensure_ascii=False))
