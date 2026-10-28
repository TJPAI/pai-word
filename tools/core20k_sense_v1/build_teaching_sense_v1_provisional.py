#!/usr/bin/env python3
"""Create an evidence-backed, NON-FINAL executable teaching Sense inclusion mask.
Provisional rules never claim low frequency from SemCor absence, never purge source or KU.
"""
import json,pathlib,time,collections
t=time.monotonic();roots=list(pathlib.Path(".").rglob("sense_selection_v3_decisions_batch001.jsonl"));assert len(roots)==1
base=roots[0].parent;evs=list(pathlib.Path(".").rglob("semcor_exact_sense_evidence_v8.jsonl"));assert len(evs)==1
semcor={(r["rank"],r["external_sense_id"]):r["semcor_exact_gloss_match_count"] for ln in evs[0].open() if (r:=json.loads(ln))}
stats=collections.Counter();recs=[]
for i in range(1,41):
 ds=[json.loads(x) for x in (base/f"sense_selection_v3_decisions_batch{i:03d}.jsonl").open()]
 groups=collections.defaultdict(list)
 for d in ds:groups[d["rank"]].append(d)
 for rank,group in groups.items():
  for d in group:
   sid=d["external_sense_id"];n=semcor.get((rank,sid),0)
   if d["original_contextual_ku"]:action="INCLUDE_EDITORIAL_CONTEXT_ATTESTED"
   elif n>=3:action="INCLUDE_REPEATED_CORPUS_ATTESTED"
   elif n>=1:action="INCLUDE_CORPUS_ATTESTED"
   elif len(group)==1:action="INCLUDE_SINGLE_SENSE_PROTECTED"
   else:action="PENDING_UNOBSERVED_NOT_REJECTED"
   recs.append({"rank":rank,"lemma":d["lemma"],"source_sense_id":sid,
    "teaching_v1_inclusion_proposal":action,"semcor_occurrences":n,
    "source_kept":True,"source_ku_kept":True,"final_certified":False,"production_ready":False})
   stats[action]+=1
assert len(recs)==60204
# Every source-matched wordhead must retain at least one teaching candidate:
byrank=collections.defaultdict(list)
for row in recs:byrank[row["rank"]].append(row)
rescued=0
for rank,group in byrank.items():
 if all(x["teaching_v1_inclusion_proposal"]=="PENDING_UNOBSERVED_NOT_REJECTED" for x in group):
  # Selection here is purely a provisional coverage placeholder, not a claim that it is the best Sense.
  group[0]["teaching_v1_inclusion_proposal"]="INCLUDE_COVERAGE_PLACEHOLDER_REVIEW"
  stats["PENDING_UNOBSERVED_NOT_REJECTED"]-=1;stats["INCLUDE_COVERAGE_PLACEHOLDER_REVIEW"]+=1;rescued+=1
assert len(byrank)==19513
out=base/"teaching_sense_v1_provisional_selection.jsonl"
out.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in recs))
included=sum(n for k,n in stats.items() if k.startswith("INCLUDE_"))
manifest={"source_senses":len(recs),"source_matched_headwords":len(byrank),
"provisional_inclusion":included,"pending_not_rejected":stats["PENDING_UNOBSERVED_NOT_REJECTED"],
"headword_coverage_placeholders":rescued,"source_gap_headwords":487,
"counts":dict(stats),"finalized_rejections":0,"confirmed_semantic_merges":0,"elapsed_seconds":round(time.monotonic()-t,3),
"disclaimer":"Provisional inclusion mask only; no claims of exhaustive sense-frequency, final value adjudication, or certified content."}
(base/"teaching_sense_v1_provisional_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
print("TEACHING_SENSE_V1_PROVISIONAL_MASK_PASS",json.dumps(manifest))
