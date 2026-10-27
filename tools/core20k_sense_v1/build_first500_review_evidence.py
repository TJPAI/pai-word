#!/usr/bin/env python3
"""Create auditable Core20K source-level review records. No automatic certification."""
import json,pathlib,collections,hashlib
base=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
records=[json.loads(z) for z in (base/"prioritized_semantic_queue_20k.jsonl").open(encoding="utf-8")]
assert len(records)==20000
target={r["rank"]:r for r in records[:500]}
sources={
 "oewn2025":base/"oewn"/"oewn2025_full20k_sense_candidates.jsonl",
 "ecdict":base/"ecdict"/"ecdict_core20k.jsonl",
 "kaikki_en":base/"kaikki"/"kaikki_en_core20k.jsonl",
 "zhwiktionary":base/"zh"/"zhwiktionary_core20k.jsonl"
}
ev={rank:collections.defaultdict(list) for rank in target}
for name,path in sources.items():
 for line in path.open(encoding="utf-8"):
  row=json.loads(line);rank=row["rank"]
  if rank not in target:continue
  assert row["lemma"].casefold()==target[rank]["lemma"].casefold()
  if name=="oewn2025":
   for item in row.get("oewn_candidates",[]):ev[rank][name].append({"id":item.get("oewn_sense_id"),"pos":item.get("pos"),"gloss":item.get("gloss_en"),"synset":item.get("oewn_synset_id")})
  elif name=="kaikki_en":
   for s in row.get("senses",[]):ev[rank][name].append({"pos":row.get("pos"),"glosses":s.get("glosses",[]),"tags":s.get("tags",[]),"topics":s.get("topics",[])})
  elif name=="zhwiktionary":
   for s in row.get("senses",[]):ev[rank][name].append({"pos":row.get("pos"),"glosses":s.get("glosses",[]),"tags":s.get("tags",[])})
  else:
   ev[rank][name].append({"pos":row.get("pos"),"definition_en":row.get("definition_en"),"translation_zh":row.get("translation_zh")})
counts=collections.Counter()
out=base/"first500_semantic_evidence.jsonl"
with out.open("w",encoding="utf-8") as f:
 for rank,r in target.items():
  data={name:ev[rank][name] for name in sources if ev[rank][name]}
  counts["words"]+=1
  for name,items in data.items():counts[name+"_records"]+=len(items)
  if not data:counts["no_external_evidence"]+=1
  obj={"rank":rank,"lemma":r["lemma"],"has_runtime_sense_ku":r["has_runtime_sense_ku"],"source_evidence":data,"action":"REVIEW_GLOSS_SEMANTICS_AND_MERGE_BY_POS","draft_status":"UNCERTIFIED","stable_sense_id":None}
  f.write(json.dumps(obj,ensure_ascii=False)+"\n")
summary={"counts":dict(counts),"first_30_missing_or_weak":[{"rank":r["rank"],"lemma":r["lemma"],"source_count":len(r["external_sources"])} for r in records[:30]],"quality_gate":"SOURCE_EXTRACTION_NOT_SEMANTIC_CERTIFICATION"}
(base/"first500_semantic_evidence_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("FIRST500_SEMANTIC_EVIDENCE",json.dumps(summary,ensure_ascii=False))
