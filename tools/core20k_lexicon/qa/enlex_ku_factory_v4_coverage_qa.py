#!/usr/bin/env python3
"""KU Factory V4: assemble and QA independently generated candidate shards.
This script does NOT claim to generate linguistic KU content."""
import argparse, glob, json, pathlib, sys, collections

def load(path):
    with open(path, encoding="utf-8") as f: return json.load(f)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--headwords", required=True, help="Authoritative JSON array of {headword_id, lemma, rank}")
    p.add_argument("--shards", required=True, help="Glob of actual AI-generated JSON shard files")
    p.add_argument("--out", required=True)
    p.add_argument("--expected", type=int, default=20000)
    a=p.parse_args()
    headwords=load(a.headwords)
    if isinstance(headwords,dict): headwords=headwords.get("headwords",headwords.get("words",[]))
    if not isinstance(headwords,list): raise ValueError("Headword source must be an array or contain headwords/words array")
    authorized={}
    errors=[]
    for h in headwords:
        hid=h.get("headword_id")
        if not hid or hid in authorized: errors.append(["bad_headword_identity",hid])
        authorized[hid]=h
    if len(authorized)!=a.expected: errors.append(["headword_count",len(authorized),a.expected])
    paths=sorted(glob.glob(a.shards))
    collected=collections.defaultdict(list)
    seen=set()
    for path in paths:
        d=load(path)
        words=d.get("words",[]) if isinstance(d,dict) else d
        for w in words:
            hid=w.get("headword_id")
            if hid not in authorized:
                errors.append(["unrecognized_headword",hid,path]); continue
            if w.get("lemma")!=authorized[hid].get("lemma"): errors.append(["lemma_mismatch",hid,path])
            if w.get("rank")!=authorized[hid].get("rank"): errors.append(["rank_mismatch",hid,path])
            candidates=w.get("candidates",w.get("proposals",[]))
            for c in candidates:
                cid=c.get("candidate_id")
                if not cid or cid in seen: errors.append(["bad_candidate_id",cid,path])
                seen.add(cid)
                if not c.get("ku_type") or not c.get("gloss_en") or not c.get("gloss_zh"):
                    errors.append(["missing_semantic_content",cid,path])
                if c.get("activation_allowed") is not False:
                    errors.append(["production_gate_violation",cid,path])
                collected[hid].append(c)
    missing=sorted(set(authorized)-set(collected))
    result={"schema":"enlex-v4-coverage-report-v1","expected_headwords":a.expected,
      "source_headwords":len(authorized),"shard_count":len(paths),
      "candidate_covered_headwords":len(collected),"candidate_count":sum(map(len,collected.values())),
      "missing_candidate_headwords":len(missing),"missing_headword_ids":missing,
      "errors":errors,"structure_qa_pass":not errors and not missing,
      "semantic_certified":False,"runtime_activated":False}
    pathlib.Path(a.out).parent.mkdir(parents=True,exist_ok=True)
    pathlib.Path(a.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items() if k not in ("missing_headword_ids","errors")},ensure_ascii=False))
    if errors: print("FIRST_ERRORS:",errors[:8],file=sys.stderr)
    sys.exit(0 if result["structure_qa_pass"] else 2)

if __name__=="__main__": main()
