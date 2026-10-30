#!/usr/bin/env python3
"""Validate V140 Sense snapshot integrity. Structural validation only."""
import argparse, hashlib, json, zipfile
def rows(z, path):
    return [json.loads(s) for s in z.read(path).splitlines() if s.strip()]
def validate(path):
    with zipfile.ZipFile(path) as z:
        m=json.loads(z.read("manifest.json"))
        for name,digest in m["files_sha256"].items():
            assert hashlib.sha256(z.read(name)).hexdigest()==digest, f"bad SHA256: {name}"
        d=rows(z,"full_688_drafts.jsonl")
        p=rows(z,"remaining_988_source.jsonl")
        j=rows(z,"current_1676_joint_state.jsonl")
    key=lambda r:r.get("sense_key") or r.get("source_sense_key")
    ds={key(r):r for r in d}
    ps={key(r):r for r in p}
    js={key(r):r for r in j}
    assert (len(d),len(p),len(j))==(688,988,1676)
    assert (len(ds),len(ps),len(js))==(688,988,1676),"duplicate key"
    assert not (ds.keys() & ps.keys()) and js.keys()==ds.keys()|ps.keys()
    fields=("rank","lemma","pos","definition_en","ili","source_lexemes")
    for k,r in list(ds.items())+list(ps.items()):
        src=js[k]
        for f in fields:
            assert r[f]==src[f], f"provenance mismatch {k}:{f}"
        assert r.get("semantically_certified") is not True
        assert r.get("semantic_certified") is not True
        assert r.get("production_ready") is not True
    assert sum(bool(r.get("gloss_zh_draft","").strip()) for r in d)==688
    assert all(not r.get("gloss_zh_draft","").strip() for r in p)
    return {"sha256":"PASS","counts":[688,988,1676],"source_matching":"PASS","unique_keys":"PASS","certification":"0"}
if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("zip")
    args=ap.parse_args()
    print(json.dumps(validate(args.zip),ensure_ascii=False))
