#!/usr/bin/env python3
"""Deterministic audit of recovered Sense register. Never certifies a Sense."""
import argparse,collections,hashlib,json,pathlib
BASE=pathlib.Path("tools/core20k_lexicon/production_v3/recovery/v93_register_20261030")
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def records(p):
    with p.open(encoding="utf-8") as f:
        for n,line in enumerate(f,1):
            if line.strip():
                try:yield json.loads(line)
                except Exception as e:raise ValueError(f"{p}:{n}: {e}")
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--out",default="tools/core20k_lexicon/production_v3/coverage/full27k-ci-output")
    a=parser.parse_args()
    manifest=json.loads((BASE/"manifest.json").read_text())
    shards=[BASE/f"shards/senses_{i:03}.jsonl" for i in range(1,7)]
    expected={x["file"]:x for x in manifest["shards"]}
    for p in shards:
        entry=expected[str(p.relative_to(BASE))]
        assert p.stat().st_size==entry["bytes"],p
        assert sha(p)==entry["sha256"],p
    out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
    ids=set();ranks=set();count=0;flags=collections.Counter();per_rank=collections.Counter()
    h=hashlib.sha256()
    dest=out/"triage.jsonl"
    with dest.open("w",encoding="utf-8") as target:
        for p in shards:
            with p.open("rb") as raw:
                for block in iter(lambda:raw.read(1048576),b""):h.update(block)
            for x in records(p):
                sid=x["teaching_sense_id"];rank=int(x["rank"])
                assert sid not in ids,(p,sid)
                assert x["headword_id"]==f"core20k:rank:{rank}",sid
                assert 1<=rank<=20000
                ids.add(sid);ranks.add(rank);per_rank[rank]+=1;count+=1
                zh=x.get("zh_candidates") or []
                vv=[z.get("value","").strip() for z in zh if isinstance(z,dict) and z.get("value")]
                f=[]
                if not x.get("synset_id"):f.append("MISSING_SYNSET")
                if not x.get("pos"):f.append("MISSING_POS")
                if not vv:f.append("NO_ZH_CANDIDATE")
                if len(str(x.get("definition_en") or "").split())<5:f.append("SHORT_DEFINITION")
                if len(set(vv))<len(vv):f.append("DUPLICATE_ZH_GLOSS")
                if len(set(vv))>1:f.append("MULTIPLE_ZH_CANDIDATES")
                for t in f:flags[t]+=1
                row={"teaching_sense_id":sid,"rank":rank,"lemma":x["lemma"],"pos":x.get("pos"),
                  "definition_en":x.get("definition_en"),"synset_id":x.get("synset_id"),
                  "source_sense_id":x.get("source_sense_id"),"source":x.get("original_source"),
                  "zh_candidates":zh,"rule_flags":f,"editorial_status":"PENDING_EDUCATIONAL_REVIEW",
                  "review_depth":"DETERMINISTIC_TRIAGE_ONLY","semantic_certified":False,"production_ready":False}
                target.write(json.dumps(row,ensure_ascii=False,separators=(",",":"))+"\n")
    assert h.hexdigest()=="22b0d24e0e2e9f8d32c24d23a5a29ea93939cb6bd6969a9678d76f472e5eb2e4"
    assert count==27471 and len(ids)==27471 and len(ranks)==19995
    expected_missing={11104,12959,13676,16482,16842}
    assert set(range(1,20001))-ranks==expected_missing
    report={"schema":"enlex-full27k-rule-triage-v1","recovery_manifest_sha256":sha(BASE/"manifest.json"),
            "register_sha256":h.hexdigest(),"input_records":count,"unique_sense_ids":len(ids),
            "covered_headwords":len(ranks),"missing_ranks":sorted(expected_missing),
            "rule_screened":count,"new_semantic_reviews":0,"independent_certifications":0,
            "production_ready":0,"rule_flags":dict(sorted(flags.items())),"output_sha256":sha(dest)}
    (out/"manifest.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
