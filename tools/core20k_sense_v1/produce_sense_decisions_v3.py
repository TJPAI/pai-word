#!/usr/bin/env python3
"""Source-grounded provisional Sense selection. Never infer sense usage frequency from wordhead rank.
Identical definitions may be merge candidates, never automatic semantic merges.
"""
import json,pathlib,collections
root=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
counts=collections.Counter();protected=0;total=0
for batch in range(1,41):
 words=[json.loads(s) for s in (root/f"batch{batch:03d}.jsonl").open(encoding="utf8")]
 lanes={(r["rank"],r["external_sense_id"]):r for r in (json.loads(s) for s in (root/f"sense_selection_v2_triage_batch{batch:03d}.jsonl").open(encoding="utf8"))}
 decisions=[]
 for w in words:
  senses=w["senses"]
  if not senses:continue
  for i,s in enumerate(senses):
   sid=s["external_sense_id"];lane=lanes[w["rank"],sid]["selection_v2_queue"]
   has_original=any(k.get("original_contextual_cloze") and k.get("linked_external_sense_id")==sid for k in w["ku_drafts"])
   if has_original:action="KEEP_CORE_CANDIDATE";why="PREEXISTING_CONTEXTUAL_KU"
   elif lane=="DUPLICATE_REVIEW":action="MERGE_REVIEW";why="EXACT_DEFINITION_DUPLICATE_NOT_SEMANTICALLY_VERIFIED"
   elif lane=="SOURCE_QUALITY_REVIEW":action="SOURCE_REVIEW";why="SHORT_DEFINITION_OR_MISSING_POS"
   elif lane=="VALUE_REVIEW":action="DEFER_REVIEW";why="NO_SENSE_FREQUENCY_EVIDENCE"
   else:action="KEEP_REVIEW";why="NO_DETERMINISTIC_SOURCE_ANOMALY"
   # Prevent automatic orphaning: the only-sense headword must never be deferred without review.
   if len(senses)==1 and action in {"DEFER_REVIEW","MERGE_REVIEW"}:
    action="KEEP_REVIEW";why="ONLY_ATTESTED_SENSE_WORDHEAD_PROTECTION";protected+=1
   decisions.append({"rank":w["rank"],"lemma":w["lemma"],"external_sense_id":sid,
     "recommended_action":action,"reason":why,"original_contextual_ku":has_original,
     "source_definition":s["definition_en_source"],
     "finalized":False,"source_deleted":False,"ku_deleted":False,"production_ready":False})
   counts[action]+=1;total+=1
 (root/f"sense_selection_v3_decisions_batch{batch:03d}.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in decisions),encoding="utf8")
assert total==60204
report={"source_senses":total,"decisions":dict(counts),"single_sense_protected":protected,
"final_deletions":0,"final_merges":0,"human_semantic_qa":0,
"note":"DEFER_REVIEW is not deletion; classification uses no actual sense-frequency dataset."}
(root/"sense_selection_v3_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SENSE_SELECTION_V3_DECISION_PROPOSALS_PASS",json.dumps(report))
