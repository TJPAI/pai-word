#!/usr/bin/env python3
"""Deliver contextual teaching evidence for six source-checked L2 Sense/KU examples.
Do not turn L2 AI editorial review into independent sign-off.
"""
import json,pathlib,collections
source=pathlib.Path("tools/core20k_lexicon/runtime/v1/batch92_l2_ai_certified_six_senses.jsonl")
assert source.exists()
records=[json.loads(line) for line in source.open(encoding="utf8")]
assert len(records)==6
out=pathlib.Path("tools/core20k_sense_v1/release/v2.1-top1000");out.mkdir(parents=True,exist_ok=True)
rows=[]
for x in records:
 assert x["certificate"]["human_editor_reviewed"] is False
 assert x["content_certified"] is True and x["production_ready"] is False
 assert x["rank"] <=1000 and x["example_en"] and x["correct_answer"] and x["source_attribution"]
 q={"rank":x["rank"],"lemma":x["headword"],"headword_id":x["headword_id"],
 "sense_id":x["sense_id"],"ku_id":x["ku_id"],"ku_type":"sense","render_kind":"contextual_sense_recognition",
 "question":x["prompt"],"answer":x["correct_answer"],"gloss_en":x["gloss_en"],"gloss_zh":x["gloss_zh"],
 "example_en":x["example_en"],"example_zh":x["example_zh"],"us_ipa":x["us_ipa"],
 "source_attribution":x["source_attribution"],"evidence_status":x["evidence_status"],
 "editorial_review_status":"L2_AI_REVIEWED","independent_bilingual_signoff":False,
 "assessment_alternates_verified":False,"old_sense_full_record_alignment_verified":False,
 "release_eligible":False,"production_ready":False}
 rows.append(q)
assert len({x["ku_id"] for x in rows})==6
(out/"top1000_six_contextual_l2_reviewed_ku.jsonl").write_text(
 "".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows),encoding="utf8")
report={"source_checked_contextual_ku":6,"independent_signed_off":0,"production_ready":0,
"gates":["INDEPENDENT_BILINGUAL_SIGNOFF","ASSESSMENT_ACCEPTABLE_ALTERNATES","OLD_SENSE_FULL_RECORD_ALIGNMENT"]}
(out/"top1000_contextual_l2_qa_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("L2_CONTEXTUAL_6_PASS",json.dumps(report))
