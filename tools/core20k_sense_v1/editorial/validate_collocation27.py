#!/usr/bin/env python3
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/editorial")
source=[json.loads(x) for x in pathlib.Path("tools/core20k_lexicon/runtime/v1/batch72_27_revised_staging.jsonl").open()]
rows=[json.loads(x) for x in (p/"v21_collocation27_revised.jsonl").open()]
assert len(source)==len(rows)==27
old={x["ku_id"]:x for x in source}
risk={
 "w_0008_have_ku03":"hold a meeting also acceptable",
 "w_0048_make_ku03":"reach a decision also acceptable",
 "w_0194_run_ku07":"build a company also acceptable",
 "w_0517_regard_ku04":"consider ... as also possible in some contexts",
}
stats=collections.Counter()
with (p/"v21_collocation27_validated_review.jsonl").open("w",encoding="utf8") as out:
 for r in rows:
  a=old[r["ku_id"]]
  assert r["prompt"]==a["prompt"]
  assert r["correct_answer"]==a["correct_answer"]
  assert r["prompt"].count("___")==1
  assert len(r["choices"])==4 and len(set(r["choices"]))==4
  assert r["choices"].count(r["correct_answer"])==1
  assert r["production_ready"] is False and r["release_eligible"] is False
  r["review_status"]="BLOCKED_AMBIGUOUS_DISTRACTOR" if r["ku_id"] in risk else "EDITORIAL_REVISED_PENDING_INDEPENDENT_SEMANTIC_REVIEW"
  r["review_note"]=risk.get(r["ku_id"],"Lexical, distractor and sense-level independent QA still required")
  stats[r["review_status"]]+=1
  out.write(json.dumps(r,ensure_ascii=False)+"\n")
assert sum(stats.values())==27 and stats["BLOCKED_AMBIGUOUS_DISTRACTOR"]==4
print("COLLOCATION27_EDITORIAL_QA",json.dumps(dict(stats),ensure_ascii=False))
