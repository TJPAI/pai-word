#!/usr/bin/env python3
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
items=[json.loads(x) for x in (p/"joined_coverage_20000.jsonl").read_text(encoding="utf8").splitlines()]
assert len(items)==20000
def priority(x):
 n=len(x["external_sources"]);rt=x["has_runtime_sense_ku"]
 return (0 if n==0 and not rt else 1 if n==0 else 2 if n==1 and not rt else 3 if n==1 else 4 if n==2 and not rt else 5 if n==2 else 6, x["rank"])
items.sort(key=priority)
out=p/"prioritized_semantic_queue_20k.jsonl";counts=collections.Counter()
with out.open("w",encoding="utf8") as f:
 for x in items:
  band=priority(x)[0];counts[str(band)]+=1
  x["priority_band"]=band;x["next_step"]=("FETCH_OTHER_LEXICAL_SOURCE" if band<=1 else "CROSSCHECK_GLOSS_POS_AND_POLYSEMY")
  x["semantic_status"]="NOT_REVIEWED"
  f.write(json.dumps(x,ensure_ascii=False)+"\n")
(p/"priority_summary.json").write_text(json.dumps({"bands":dict(counts),"first_30":[{"rank":x["rank"],"lemma":x["lemma"],"sources":x["external_sources"]} for x in items[:30]],"certified":0},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("PRIORITY_QUEUE",json.dumps(dict(counts)))
