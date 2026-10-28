#!/usr/bin/env python3
"""Review coverage placeholders against other sourced senses using transparent, limited evidence.
No ungrounded sense ordering claim. Generate actionable unresolved priority instead of fake certification.
"""
import pathlib,json,collections,time
start=time.monotonic();fs=list(pathlib.Path(".").rglob("teaching_sense_v1_provisional_selection.jsonl"));assert len(fs)==1
base=fs[0].parent
rows=[json.loads(s) for s in fs[0].open()]
byrank=collections.defaultdict(list)
for r in rows:byrank[r["rank"]].append(r)
stats=collections.Counter();queue=[]
for rank,group in byrank.items():
 placeholders=[r for r in group if r["teaching_v1_inclusion_proposal"]=="INCLUDE_COVERAGE_PLACEHOLDER_REVIEW"]
 if not placeholders:continue
 assert len(placeholders)==1
 chosen=placeholders[0]
 # No independent usage or edited contextual KU: multiple sources mean the arbitrary first item is not a valid selection.
 stats["placeholder_reviewed"]+=1
 status="MULTIPLE_SENSES_NO_USAGE_EVIDENCE" if len(group)>1 else "ONLY_SENSE_WITHOUT_USAGE_EVIDENCE"
 stats[status]+=1
 queue.append({"rank":rank,"lemma":chosen["lemma"],"placeholder_sense_id":chosen["source_sense_id"],
 "candidate_sense_ids":[r["source_sense_id"] for r in group],
 "candidate_semcor_counts":[r["semcor_occurrences"] for r in group],
 "selection_status":"REVIEW_REQUIRED_NO_RANKING_EVIDENCE",
 "action":"DO_NOT_CERTIFY_PLACEHOLDER_AS_PREFERRED_MEANING",
 "source_ku_preserved":True})
assert stats["placeholder_reviewed"]==4176
(base/"placeholder4176_semantic_review_queue.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in queue))
report={"placeholder_wordheads":len(queue),"categories":dict(stats),"confirmed_preferred_meanings":0,
 "meaningful_risk_identified":stats["MULTIPLE_SENSES_NO_USAGE_EVIDENCE"],
 "elapsed_seconds":round(time.monotonic()-start,3),
 "next_required_evidence":"Independent example/context ranking for headword-specific senses. Do not treat first OEWN sense as best by default."}
(base/"placeholder4176_audit_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("PLACEHOLDER4176_RISK_AUDIT_PASS",json.dumps(report))
