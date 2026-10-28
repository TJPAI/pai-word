#!/usr/bin/env python3
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/editorial")
rows=[json.loads(x) for x in (p/"v21_collocation27_guided_teaching.jsonl").open(encoding="utf8")]
assert len(rows)==27 and len(set(r["ku_id"] for r in rows))==27
statuses=collections.Counter()
for r in rows:
 assert r["example_en"]==r["prompt"].replace("___",r["correct_answer"])
 assert r["correct_answer"] in r["choices"]
 assert r["teaching_expression"] and r["question_instruction_zh"]
 assert not r["release_eligible"] and not r["production_ready"]
 assert r["render_kind"] in ("multiple_choice","guided_cloze")
 if r["render_kind"]=="guided_cloze":assert r["review_status"]=="GUIDED_TARGET_WORD_AMBIGUITY_MITIGATED_NOT_CERTIFIED"
 statuses[r["render_kind"]]+=1
assert statuses=={"multiple_choice":23,"guided_cloze":4}
print("COLLOCATION27_GUIDED_QA_PASS",json.dumps(dict(statuses)))
