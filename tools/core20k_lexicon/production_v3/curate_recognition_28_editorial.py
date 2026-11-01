#!/usr/bin/env python3
"""Curated editorial proposals for the 28 previously rejected automatic KU suggestions.
All are explicitly provisional; no source edits or release eligibility.
"""
import json,pathlib,collections
B=pathlib.Path(__file__).resolve().parent
D=B/"teaching_qa/full_recognition_audit"
cases=[json.loads(x) for x in (D/"editorial_gate_high_priority_64.jsonl").read_text(encoding="utf8").splitlines() if x.strip() and json.loads(x)["status"]=="REWRITE_NEEDED"]
choices={int(k):v for k,v in json.loads('''{"12":["sedan","limousine","hatchback","minivan"],"13":["limo","sedan","minivan","hatchback"],"18":["grandeur","arrogance","modesty","poverty"],"20":["arrogance","modesty","poverty","splendor"],"32":["remembrance","imagination","observation","prediction"],"34":["interpretation","characterization","argumentation","enumeration"],"37":["patience","stubbornness","optimism","tenacity"],"41":["fad","custom","routine","tradition"],"42":["recollection","imagination","observation","prediction"],"47":["calmness","indifference","fatigue","excitement"],"52":["refuge","hideout","warehouse","checkpoint"],"53":["warehouse","hideaway","checkpoint","marketplace"],"55":["rustle","clank","whisper","squeak"],"65":["amuse","annoy","provoke","pacify"],"66":["tsar","duke","bishop","senator"],"71":["merchant","scoundrel","bystander","scholar"],"75":["bewilderment","certainty","anticipation","disappointment"],"80":["obsolete","trite","innovative","ambiguous"],"81":["everlasting","sporadic","temporary","intermittent"],"82":["fleeting","unending","intermittent","temporary"],"85":["strategy","artifice","accident","confession"],"94":["scholar","actor","booby","expert"],"96":["chapel","rectory","cathedral","sanctuary"],"99":["chapel","parsonage","cathedral","monastery"],"108":["sheikh","mayor","governor","bishop"],"113":["swamp","plateau","morass","canyon"],"115":["connect","decouple","combine","fasten"],"117":["inspector","mender","designer","supervisor"]}''').items()}
assert len(cases)==len(choices)==28 and {x["review_number"] for x in cases}==set(choices)
out=[]
for x in cases:
 opts=choices[x["review_number"]]
 answer=x["lemma"]
 assert len(opts)==4 and len(set(z.casefold() for z in opts))==4
 assert opts.count(answer)==1 and opts.index(answer)==x["original_options"].index(answer)
 assert all(c not in opts for c in (x["original_options"][i] for i in range(4) if x["original_options"][i]!=answer and x["original_options"][i] in x.get("additional_potential_competitors",[])))
 out.append({"review_number":x["review_number"],"ku_id":x["ku_id"],"source":x["source"],"source_line":x["source_line"],"correct_answer":answer,"original_options":x["original_options"],"editorially_proposed_options":opts,"status":"MANUAL_EDITORIAL_PROPOSAL_NOT_CERTIFIED","instruction":"Verify full definition, each distractor's POS/meaning, plausible difficulty and exact source mapping. No source edit authorized.","source_modified":False})
path=D/"curated_editorial_rewrites_28.jsonl"
path.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
summary={"cases":len(out),"valid_four_option_sets":len(out),"manually_authored_proposals":len(out),"certified":0,"source_ku_modified":0,"runtime_modified":0}
(D/"curated_editorial_rewrites_28_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(summary))
