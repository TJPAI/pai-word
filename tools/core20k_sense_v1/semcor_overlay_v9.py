#!/usr/bin/env python3
"""V9 independent corpus evidence overlay. SemCor absence is never used to reject.
Produce sense-level prioritized educational KEEP recommendations, with actual counts.
"""
import pathlib,json,time,collections
t=time.monotonic();files=list(pathlib.Path(".").rglob("semcor_exact_sense_evidence_v8.jsonl"));assert len(files)==1
base=files[0].parent
evidence={(x["rank"],x["external_sense_id"]):x["semcor_exact_gloss_match_count"] for line in files[0].open() if (x:=json.loads(line))}
counts=collections.Counter();recs=[]
for b in range(1,41):
 for line in (base/f"sense_selection_v3_decisions_batch{b:03d}.jsonl").open():
  x=json.loads(line);n=evidence.get((x["rank"],x["external_sense_id"]),0)
  if not n:continue
  if n>=10:tier="STRONG_CORPUS_ATTESTATION"
  elif n>=3:tier="REPEATED_CORPUS_ATTESTATION"
  else:tier="SINGLE_OR_DOUBLE_ATTESTATION"
  original=x["recommended_action"]
  proposal=("PRIORITIZE_KEEP_REVIEW" if original=="DEFER_REVIEW" else "CORPUS_EVIDENCE_ENRICHED")
  recs.append({"rank":x["rank"],"lemma":x["lemma"],"external_sense_id":x["external_sense_id"],"semcor_count":n,
   "corpus_evidence_tier":tier,"previous":original,"next_proposal":proposal,
   "final_certified":False,"reject_due_to_absence":False})
  counts[tier]+=1
  if original=="DEFER_REVIEW":counts["defer_promoted_to_keep_review"]+=1
assert len(recs)==len(evidence)
(base/"sense_selection_v9_corpus_evidence_overlay.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in recs))
manifest={"source_senses_with_semcor_evidence":len(recs),"evidence_tiers":dict(counts),
"defer_review_candidates_reprioritized":counts["defer_promoted_to_keep_review"],
"verified_deletions":0,"certified_keeps":0,"script_seconds":round(time.monotonic()-t,3),
"warning":"SemCor is limited and sampled. Positive counts are useful; zero is never evidence of rarity."}
(base/"sense_selection_v9_manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
print("SENSE_V9_SEMCOR_OVERLAY_PASS",json.dumps(manifest))
