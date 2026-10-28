#!/usr/bin/env python3
"""Create actionable evidence packages for proposed DEFER and exact-definition MERGE reviews.
Never make irreversible semantic selection without attested sense-level evidence.
"""
import pathlib,json,collections,re
root=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
stats=collections.Counter();queue=[];duplicates=[]
for b in range(1,41):
 words=[json.loads(x) for x in (root/f"batch{b:03d}.jsonl").open(encoding="utf8")]
 decisions=[json.loads(x) for x in (root/f"sense_selection_v3_decisions_batch{b:03d}.jsonl").open(encoding="utf8")]
 byrank={w["rank"]:w for w in words}
 for d in decisions:
  action=d["recommended_action"]
  if action not in {"DEFER_REVIEW","MERGE_REVIEW"}:continue
  w=byrank[d["rank"]];sid=d["external_sense_id"]
  s=next(x for x in w["senses"] if x["external_sense_id"]==sid)
  links=[k for k in w["ku_drafts"] if k.get("linked_external_sense_id")==sid]
  record={"rank":d["rank"],"lemma":d["lemma"],"external_sense_id":sid,"definition_en":s["definition_en_source"],
   "source_pos":s.get("pos"),"source_synset":s.get("external_synset_id"),
   "other_senses_in_same_headword":len(w["senses"])-1,
   "linked_ku_ids":[x["draft_ku_id"] for x in links],
   "required_evidence":["sense_specific_usage_examples","independent_semantic_equivalence" if action=="MERGE_REVIEW" else "attested_sense_frequency_or_contextual_relevance"],
   "suggested_action":action,"final_decision":"PENDING_EVIDENCE",
   "retain_existing_kus":True,"production_ready":False}
  (duplicates if action=="MERGE_REVIEW" else queue).append(record)
  stats[action]+=1
assert stats["DEFER_REVIEW"]==5931 and stats["MERGE_REVIEW"]==26
for name,records in [("defer5931_evidence_queue.jsonl",queue),("merge26_evidence_queue.jsonl",duplicates)]:
 (root/name).write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in records),encoding="utf8")
manifest={"defer_candidates":len(queue),"exact_definition_merge_candidates":len(duplicates),
"evidence_backed_final_defer":0,"confirmed_semantic_merges":0,"ku_removed":0,
"warning":"These are source-evidence review packets; headword rank alone is NOT valid sense usage frequency."}
(root/"sense_selection_v4_review_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SENSE_SELECTION_V4_EVIDENCE_QUEUES_PASS",json.dumps(manifest))
