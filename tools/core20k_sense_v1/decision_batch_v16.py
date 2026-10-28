#!/usr/bin/env python3
"""Evidence-backed initial Sense decisions. Provisional decisions are NOT semantic certification.
Uses existing V9 inclusion mask, V11 safety gate and immutable source ids.
"""
import collections,json,pathlib,time
t=time.monotonic()
files=list(pathlib.Path(".").rglob("teaching_sense_v1_provisional_selection.jsonl"))
assert len(files)==1, f"Expected unique V9 selection, got {len(files)}"
base=files[0].parent
rows=[json.loads(ln) for ln in files[0].open(encoding="utf8")]
assert len(rows)==60204
decisions=[];ctr=collections.Counter()
for row in rows:
 proposal=row["teaching_v1_inclusion_proposal"]
 corpus=row["semcor_occurrences"]
 if proposal=="INCLUDE_REPEATED_CORPUS_ATTESTED":
  state="KEEP_CORE";basis="REPEATED_INDEPENDENT_SEMCOR_ATTESTATION"
 elif proposal in ("INCLUDE_CORPUS_ATTESTED","INCLUDE_EDITORIAL_CONTEXT_ATTESTED"):
  state="KEEP_EXTENDED";basis="ATTESTED_USAGE_OR_PRIOR_EDITORIAL_CONTEXT"
 elif proposal=="PENDING_UNOBSERVED_NOT_REJECTED":
  state="REVIEW";basis="NO_POSITIVE_USAGE_EVIDENCE;NOT_EVIDENCE_OF_RARITY"
 else:
  state="REVIEW";basis="COVERAGE_OR_SINGLE_SENSE_PROTECTION_ONLY"
 rec={"rank":row["rank"],"lemma":row["lemma"],"external_sense_id":row["source_sense_id"],
      "decision":state,"decision_basis":basis,"semcor_occurrences":corpus,
      "decision_level":"EVIDENCE_BASED_INITIAL_RECOMMENDATION",
      "semantic_certified":False,"production_ready":False,
      "original_source_preserved":True}
 decisions.append(rec);ctr[state]+=1
assert len({(r["rank"],r["external_sense_id"]) for r in decisions})==len(rows)
assert sum(ctr.values())==60204
out=base/"sense_decisions_v16_initial.jsonl"
out.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in decisions),encoding="utf8")
manifest={"input_senses":len(rows),"decisions":dict(ctr),"final_certified_keep":0,
 "final_certified_defer":0,"final_certified_merge":0,"source_deleted":0,
 "elapsed_seconds":round(time.monotonic()-t,3),
 "next_gate":"Independent semantic review and bilingual gloss checks before FINAL KEEP/DEFER/MERGE"}
(base/"sense_decisions_v16_manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
print("SENSE_DECISIONS_V16",json.dumps(manifest))
