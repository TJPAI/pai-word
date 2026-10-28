#!/usr/bin/env python3
"""Structural QA of SemCor-derived cloze; quarantine malformed, repetitive, ambiguous answer contexts."""
import pathlib,json,re,collections,time
t=time.monotonic();fs=list(pathlib.Path(".").rglob("semcor_context_cloze_staging_v12.jsonl"));assert len(fs)==1
base=fs[0].parent;seen=set();good=[];bad=[];stats=collections.Counter()
for ln in fs[0].open():
 r=json.loads(ln);key=(r["rank"],r["external_sense_id"])
 errs=[]
 if key in seen:errs.append("DUPLICATE_SENSE")
 seen.add(key)
 q=r["question"];ans=r["response"]
 if q.count("____")!=1:errs.append("CLOZE_PLACEHOLDER_COUNT")
 if not 1<len(ans)<45:errs.append("INVALID_RESPONSE_LENGTH")
 if len(q)<20 or len(q)>260:errs.append("CONTEXT_LENGTH_OUT_OF_RANGE")
 if not q.rstrip().endswith((".", "!", "?")):errs.append("NO_SENTENCE_TERMINATOR_REVIEW")
 if ans.casefold()!=r["lemma"].casefold():errs.append("ANSWER_VARIANT_REVIEW")
 if errs:
  r["qa_status"]="QUARANTINE";r["qa_issue_codes"]=errs;bad.append(r)
  for e in errs:stats[e]+=1
 else:
  r["qa_status"]="STRUCTURAL_PASS_NOT_SEMANTIC_CERTIFIED";good.append(r)
for name,rows in (("semcor_cloze_v13_structural_pass.jsonl",good),("semcor_cloze_v13_quarantine.jsonl",bad)):
 (base/name).write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf8")
assert len(good)+len(bad)==14060
report={"input":len(good)+len(bad),"structural_pass":len(good),"quarantine":len(bad),
"issue_counts":dict(stats),"semantic_certified":0,"release_eligible":0,
"elapsed_seconds":round(time.monotonic()-t,3),"warning":"Structure-only QA, not correctness of Sense alignment, pedagogy or source licensing."}
(base/"semcor_cloze_v13_qa_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("SEMCOR_CLOZE_V13_QA_PASS",json.dumps(report,ensure_ascii=False))
