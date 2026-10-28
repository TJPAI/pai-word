#!/usr/bin/env python3
"""V14 repair only harmless cloze formatting, isolate answer and context ambiguity.
No paraphrase of source sentences, semantic certification or promotion.
"""
import pathlib,json,re,time,collections
t=time.monotonic();sources=list(pathlib.Path(".").rglob("semcor_cloze_v13_structural_pass.jsonl"))
assert len(sources)==1, f"Expected one V13 output, found {len(sources)}"
base=sources[0].parent
passrows=[json.loads(x) for x in (base/"semcor_cloze_v13_structural_pass.jsonl").open()]
quarantine=[json.loads(x) for x in (base/"semcor_cloze_v13_quarantine.jsonl").open()]
assert len(passrows)==13982 and len(quarantine)==78
repaired=[];unfixed=[];counts=collections.Counter()
for row in quarantine:
 issues=set(row["qa_issue_codes"])
 if issues=={"NO_SENTENCE_TERMINATOR_REVIEW"}:
  row["question"]=row["question"].rstrip()+"."
  row["repair_note"]="PUNCTUATION_ONLY";row["qa_status"]="STRUCTURAL_REPAIRED_NOT_SEMANTIC_CERTIFIED"
  repaired.append(row);counts["punctuation_repaired"]+=1
 else:
  unfixed.append(row);counts["unresolved"]+=1
safe=[];ambiguous=[]
for row in passrows+repaired:
 q=row["question"];answer=row["response"]
 flags=[]
 if re.search(r"(?i)(?<![A-Za-z])"+re.escape(answer)+r"(?![A-Za-z])",q):flags.append("ANSWER_VISIBLE_OUTSIDE_BLANK")
 if q.count("____")!=1:flags.append("MULTIPLE_OR_MISSING_BLANK")
 if len(q.split())<5:flags.append("INSUFFICIENT_CONTEXT")
 if flags:
  row["v14_risk_flags"]=flags;ambiguous.append(row)
 else:safe.append(row)
for name,data in (("cloze_v14_structural_candidates.jsonl",safe),("cloze_v14_ambiguity_review.jsonl",ambiguous),("cloze_v14_unresolved.jsonl",unfixed)):
 (base/name).write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in data))
report={"v13_pass":len(passrows),"v13_quarantined":78,"punctuation_only_repaired":len(repaired),
"unresolved_from_quarantine":len(unfixed),"v14_screened_candidates":len(safe),
"v14_ambiguity_review":len(ambiguous),"semantic_certified":0,"production_ready":0,
"elapsed_seconds":round(time.monotonic()-t,3)}
(base/"cloze_v14_manifest.json").write_text(json.dumps(report,indent=2)+"\n")
print("CLOZE_V14_REPAIR_AND_RISK_PASS",json.dumps(report))
