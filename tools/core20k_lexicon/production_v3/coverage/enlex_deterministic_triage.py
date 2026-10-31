#!/usr/bin/env python3
"""Fail-closed deterministic triage; NEVER treats rules as semantic certification."""
import argparse, collections, hashlib, json, pathlib, re
def load(path):
    with open(path,encoding="utf-8") as fh:
        for n,line in enumerate(fh,1):
            if line.strip():
                try: yield json.loads(line)
                except Exception as e: raise ValueError(f"{path}:{n}: {e}")
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--queue",action="append",required=True)
    p.add_argument("--editorial",action="append",default=[])
    p.add_argument("--out",required=True)
    a=p.parse_args()
    rows=[x for f in a.queue for x in load(f)]
    assert rows
    ids=[r["teaching_sense_id"] for r in rows]
    assert len(ids)==len(set(ids)), "Duplicate source Sense ID"
    decisions={}
    for f in a.editorial:
        for r in load(f):
            key=r["teaching_sense_id"]
            assert key not in decisions,"Duplicate editorial ID"
            decisions[key]=r
    assert set(decisions)<=set(ids),"Editorial ID without source Sense"
    out=pathlib.Path(a.out); out.mkdir(parents=True,exist_ok=True)
    cards=[]; counts=collections.Counter()
    for r in rows:
        zh=r.get("zh_candidates") or []
        values=[z.get("value","").strip() for z in zh if isinstance(z,dict) and z.get("value")]
        flags=list(r.get("flags") or [])
        if len(set(values))<len(values) and values: flags.append("DUPLICATE_ZH_GLOSS")
        if len(values)>1 and len(set(values))>1: flags.append("MULTIPLE_ZH_CANDIDATES")
        if not r.get("synset_id"): flags.append("MISSING_SYNSET")
        if not r.get("pos"): flags.append("MISSING_POS")
        flags=list(dict.fromkeys(flags))
        item={"teaching_sense_id":r["teaching_sense_id"],"rank":r["rank"],"lemma":r["lemma"],"pos":r.get("pos"),"source_sense_id":r.get("source_sense_id"),"synset_id":r.get("synset_id"),"definition_en":r.get("definition_en"),"zh_candidates":zh,"rule_flags":flags,"editorial_status":decisions.get(r["teaching_sense_id"],{}).get("editorial_disposition", decisions.get(r["teaching_sense_id"],{}).get("decision","PENDING_EDUCATIONAL_REVIEW")),"review_depth":"INTERNAL_AI_EDITORIAL_TRIAGE" if r["teaching_sense_id"] in decisions else "DETERMINISTIC_TRIAGE_ONLY","semantic_certified":False,"production_ready":False}
        cards.append(item)
        for flag in flags:counts[flag]+=1
    fp=out/"triage.jsonl"
    fp.write_text("".join(json.dumps(x,ensure_ascii=False,separators=(",",":"))+"\n" for x in cards),encoding="utf-8")
    man={"schema":"enlex-deterministic-triage-v1","input_rows":len(rows),"unique_ids":len(ids),"editorial_ids_matched":len(decisions),"rules_screened":len(rows),"new_semantic_reviews":0,"certified":0,"production_ready":0,"flags":dict(sorted(counts.items())),"source_sha256":{str(p):digest(pathlib.Path(p)) for p in a.queue+a.editorial},"triage_sha256":digest(fp)}
    (out/"manifest.json").write_text(json.dumps(man,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(man,ensure_ascii=False,indent=2))
if __name__=="__main__": main()
