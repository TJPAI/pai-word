#!/usr/bin/env python3
"""Editorial triage for 117 identical-definition competing answers.
This is a preliminary review; not final semantic certification.
Source KU, Sense, and runtime files remain untouched.
"""
import collections,json,pathlib
BASE=pathlib.Path(__file__).resolve().parent
DIR=BASE/"teaching_qa/full_recognition_audit"
DATA=[json.loads(x) for x in (DIR/"semantic_conflicts_all.jsonl").read_text(encoding="utf-8").splitlines() if x.strip()]
if len(DATA)!=117: raise ValueError("Review set changed; stop rather than misalign curated indices.")
# Human editorial classifications by the numbered entries in the frozen audit review list.
# HIGH: both answers can plausibly satisfy the *same unqualified definition*.
# CONTEXT: distinction could be resolved by rewriting clue with usage, POS, register, or sense.
# CHECK: suspected mismatch or inflected form, requires source and lexical verification.
context={2,3,5,6,7,9,10,11,15,17,22,24,27,28,30,43,44,45,46,48,51,54,56,57,59,61,62,63,64,67,72,73,74,77,83,86,88,93,95,100,105,106,107,109,110,111,112,116}
check={31,35,58,60,64,67,72,78,83,93,100,107,109,111,112}
# In case of overlap, CHECK takes precedence.
def assess(i,x):
    if i in check:
        return "lexical_or_form_verification","Check part of speech, inflection, lexical sense and source alignment before selecting a fix"
    if i in context:
        return "contextual_disambiguation","Rewrite the clue with distinctive usage, register or semantic features; verify alternatives against the complete option list"
    return "high_confidence_multiple_answer","Replace the competing distractor with a meaningfully different option, or rewrite clue to distinguish the intended sense"
out=[]
for i,row in enumerate(DATA,1):
    category,action=assess(i,row)
    out.append({**row,"review_number":i,"triage_category":category,"editorial_assessment":"PRELIMINARY","recommended_action":action,"source_edit_permitted":False})
counts=dict(collections.Counter(x["triage_category"] for x in out))
def write_jsonl(name,items):
    (DIR/name).write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in items),encoding="utf-8")
write_jsonl("semantic_triage_117.jsonl",out)
for category in sorted(set(x["triage_category"] for x in out)):
    write_jsonl("semantic_triage_"+category+".jsonl",[x for x in out if x["triage_category"]==category])
summary={"source_conflict_records":len(DATA),"triaged_records":len(out),"categories":counts,"review_stage":"preliminary_editorial","source_ku_modified":False,"sense_modified":False,"runtime_modified":False,"verified_semantic_fixes":0,"guidance":"Recommendations are proposals only; confirm each against actual source options and intended sense before editing."}
(DIR/"semantic_triage_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(summary,ensure_ascii=False))
