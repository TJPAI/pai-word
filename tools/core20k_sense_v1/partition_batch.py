#!/usr/bin/env python3
"""Partition full extracted queue into rank-stable 500-word batches and prioritize risk."""
import json,pathlib,collections
base=pathlib.Path("tools/core20k_sense_v1/reports")
entries=[json.loads(s) for s in (base/"sense_ku_inventory.jsonl").read_text(encoding="utf-8").splitlines() if s]
assert len(entries)==20000
batch_dir=base/"rank_batches";batch_dir.mkdir(parents=True,exist_ok=True)
risk_priority={"EXACT_DUPLICATE_GLOSS":0,"POLYSEMY_REVIEW":1,"NO_SENSE_TYPE_KU":2,"NO_KU":3}
statistics=[]
for group in range(40):
 start=group*500+1;end=start+499
 subset=sorted((x for x in entries if start<=x["rank"]<=end),key=lambda x:x["rank"])
 assert len(subset)==500
 flags=collections.Counter(y for x in subset for y in x["flags"])
 for x in subset:
  if x["flags"]:x["risk_priority"]=min(risk_priority.get(y,5) for y in x["flags"])
  else:x["risk_priority"]=6
 out=batch_dir/f"rank_{start:05d}_{end:05d}.jsonl"
 with out.open("w",encoding="utf-8") as f:
  for row in subset:f.write(json.dumps(row,ensure_ascii=False)+"\n")
 statistics.append({"batch":group+1,"range":[start,end],"entries":500,"flags":dict(flags)})
(base/"batch_index.json").write_text(json.dumps({"batch_size":500,"batches":statistics,"quality_note":"Risk prioritization only; semantic certifications 0."},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("PARTITION_SUCCESS 40 rank batches x 500 words; zero frozen modifications")
