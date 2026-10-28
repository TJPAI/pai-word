#!/usr/bin/env python3
"""Second-pass non-destructive Sense triage: evidence categories and duplicate review queues.
No sense-frequency inference from rank; no automated semantic rejection or merging.
"""
import pathlib,json,collections,re
root=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
stats=collections.Counter();total=0
for b in range(1,41):
 source=[json.loads(s) for s in (root/f"batch{b:03d}.jsonl").open(encoding="utf8")]
 prior=[json.loads(s) for s in (root/f"sense_selection_v1_batch{b:03d}.jsonl").open(encoding="utf8")]
 old={(r["rank"],r["external_sense_id"]):r for r in prior}
 output=[]
 for w in source:
  norm=collections.defaultdict(list)
  for s in w["senses"]:
   key=(str(s.get("pos") or ""),re.sub(r"\s+"," ",s["definition_en_source"].strip().casefold()))
   norm[key].append(s["external_sense_id"])
  for s in w["senses"]:
   sid=s["external_sense_id"];key=(w["rank"],sid);p=old[key]
   definition=s["definition_en_source"].strip()
   group=norm[(str(s.get("pos") or ""),re.sub(r"\s+"," ",definition.casefold()))]
   categories=[]
   if len(group)>1:categories.append("EXACT_SAME_DEFINITION_WITHIN_WORD_REVIEW")
   if len(definition)<15:categories.append("SHORT_OR_UNINFORMATIVE_SOURCE_DEFINITION_REVIEW")
   if not s.get("pos"):categories.append("SOURCE_POS_MISSING_REVIEW")
   if w["rank"]>15000:categories.append("LOWER_RANK_HEADWORD_SENSE_VALUE_UNDETERMINED")
   if not categories:categories.append("NO_DETERMINISTIC_SOURCE_ANOMALY")
   lane=("DUPLICATE_REVIEW" if len(group)>1 else "SOURCE_QUALITY_REVIEW" if len(definition)<15 or not s.get("pos") else "VALUE_REVIEW" if w["rank"]>15000 else "PRESERVE_CANDIDATE")
   stats[lane]+=1;total+=1
   output.append({"rank":w["rank"],"lemma":w["lemma"],"external_sense_id":sid,
    "definition_en_source":definition,"selection_v1":p["decision_v1"],"selection_v2_queue":lane,
    "evidence_flags":categories,"exact_definition_sense_ids":group if len(group)>1 else [],
    "suggested_delete":False,"suggested_merge":False,"pending_semantic_adjudication":True,
    "production_ready":False})
 (root/f"sense_selection_v2_triage_batch{b:03d}.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in output),encoding="utf8")
assert total==60204
manifest={"source_senses":total,"queues":dict(stats),"auto_deleted":0,"auto_merged":0,
 "note":"Non-destructive preliminary triage, not actual rare-sense frequency adjudication."}
(root/"sense_selection_v2_triage_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SENSE_SELECTION_V2_TRIAGE_PASS",json.dumps(manifest))
