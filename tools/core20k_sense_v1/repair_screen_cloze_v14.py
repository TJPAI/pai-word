#!/usr/bin/env python3
"""V14 repair only harmless cloze formatting, isolate answer and context ambiguity.
No paraphrase of source sentences, semantic certification or promotion.
"""
import pathlib,json,re,time,collections,subprocess,sys
t=time.monotonic()
sources=list(pathlib.Path(".").rglob("semcor_cloze_v13_structural_pass.jsonl"))
# V13 QA is cheap (<1s); recover missing QA artifacts using existing V12 candidates,
# never re-download SemCor or regenerate its 14k candidate contexts.
if len(sources)!=1 or not sources[0].is_file():
 v12=list(pathlib.Path(".").rglob("semcor_context_cloze_staging_v12.jsonl"))
 assert len(v12)==1, f"Cannot recover V13: expected one V12 file, found {len(v12)}"
 subprocess.run([sys.executable,"tools/core20k_sense_v1/qa_semcor_cloze_v13.py"],check=True)
 sources=list(pathlib.Path(".").rglob("semcor_cloze_v13_structural_pass.jsonl"))
assert len(sources)==1, f"Expected one V13 output after recovery, found {len(sources)}"
base=sources[0].parent
# Read the discovered path directly, and fail with a useful diagnosis if outputs moved.
pass_path=sources[0]
quarantine_path=base/"semcor_cloze_v13_quarantine.jsonl"
assert pass_path.is_file() and quarantine_path.is_file(), (
 f"V13 outputs missing: pass={pass_path} exists={pass_path.exists()}; "
 f"quarantine={quarantine_path} exists={quarantine_path.exists()}")
passrows=[json.loads(x) for x in pass_path.open(encoding="utf8")]
quarantine=[json.loads(x) for x in quarantine_path.open(encoding="utf8")]
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
