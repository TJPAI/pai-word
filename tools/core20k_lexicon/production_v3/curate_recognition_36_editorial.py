#!/usr/bin/env python3
"""Hand-authored distractor redesign proposals for 36 Recognition KU cases.
Preserve original answer position; no edits to original KU.
"""
import json,pathlib
B=pathlib.Path(__file__).resolve().parent
D=B/"teaching_qa/full_recognition_audit"
cases=[json.loads(x) for x in (D/"editorial_gate_high_priority_64.jsonl").read_text(encoding="utf8").splitlines() if x.strip()]
cases=[x for x in cases if x["status"]=="MANUAL_QUALITY_REVIEW_REQUIRED"]
lines='''1|arrive,depart,leave
4|rarely,seldom,never
8|roughly,approximately,vaguely
14|surplus,abundance,excess
16|external,temporary,optional
19|peripheral,optional,incidental
21|briefly,temporarily,occasionally
23|directive,coercive,descriptive
25|wagon,carriage,snowmobile
26|accidentally,spontaneously,randomly
29|unintentionally,accidentally,randomly
33|predecessor,successor,subordinate
36|headlight,rearview,bumper
38|coldly,indifferently,resentfully
39|normally,typically,ordinarily
40|predecessor,successor,subordinate
49|mediocre,poor,ordinary
50|mediocre,poor,ordinary
68|sedate,tranquilize,anesthetize
69|crossroads,junction,roundabout
70|truth,accuracy,authenticity
76|reserved,reticent,silent
79|obscurely,ambiguously,doubtfully
84|confession,disclosure,admission
87|forgiving,merciful,benevolent
89|courteous,patient,considerate
90|compensate,reimburse,repay
91|compensate,reimburse,repay
92|austere,modest,plain
97|release,unsettle,rouse
98|bore,distract,disinterest
101|proven,verified,established
102|proven,verified,established
103|vulnerable,exposed,fragile
104|vulnerable,exposed,fragile
114|previously,hereinbefore,above'''.splitlines()
suggestions={int(x.split("|")[0]):x.split("|")[1].split(",") for x in lines}
assert len(cases)==len(suggestions)==36
result=[]
for x in cases:
 n=x["review_number"];old=x["original_options"];answer=x["lemma"];new=suggestions[n]
 assert len(new)==3 and len({t.casefold() for t in new+[answer]})==4
 assert answer in old
 j=old.index(answer)
 options=iter(new)
 proposed=[answer if k==j else next(options) for k in range(4)]
 result.append({"review_number":n,"ku_id":x["ku_id"],"source":x["source"],"source_line":x["source_line"],"answer":answer,"original_options":old,"proposed_options":proposed,"review_stage":"HAND_AUTHORED_PENDING_SEMANTIC_QA","source_modified":False,"note":"Contrastive vocabulary proposals; check grammatical fit, polysemy, difficulty, contextual plausibility and options before use."})
(D/"curated_editorial_rewrites_36.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in result),encoding="utf8")
summary={"curated_cases":36,"unique_ku_ids":len({x["ku_id"] for x in result}),"option_sets":len(result),"semantically_certified":0,"source_modified":False}
(D/"curated_editorial_rewrites_36_summary.json").write_text(json.dumps(summary,indent=2)+"\n")
print(summary)
