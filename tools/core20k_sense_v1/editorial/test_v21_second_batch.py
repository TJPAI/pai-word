#!/usr/bin/env python3
import json,pathlib
p=pathlib.Path("tools/core20k_sense_v1/editorial")
s=[json.loads(x) for x in (p/"v21_next4_sense_content.jsonl").open()]
k=[json.loads(x) for x in (p/"v21_next6_ku_content.jsonl").open()]
assert len(s)==4 and {(x["rank"],x["lemma"]) for x in s}=={(1,"out"),(2,"would"),(4,"some"),(5,"will")}
assert len(k)==6 and len({x["ku_id"] for x in k})==6
for r in s:
 assert r["gloss_en"] and r["gloss_zh"] and r["example_en"] and r["example_zh"]
 assert r["production_ready"] is False and r["release_eligible"] is False
for r in k:
 assert r["question"].count("___")==1 and r["answer"] in r["acceptable_answers"]
 assert r["production_ready"] is False and r["release_eligible"] is False
 # Reject a known invalid teaching prompt: the target word is 'do', not 'make'.
 if r["rank"]==109 and r["ku_id"]=="w_0048_make_ku04":
  assert r["answer"]=="does"
  assert r["review_status"]=="BLOCKED_SENSE_BINDING_WRONG_LEMMA"
print("V21_SECOND_EDITORIAL_BATCH_QA",json.dumps({"senses":len(s),"ku_drafts":len(k),"semantic_binding_blockers":1,"production_ready":0}))
