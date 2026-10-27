#!/usr/bin/env python3
"""Print complete flagged pairs and source context for human/AI review. Never auto-merge."""
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
triage={r["rank"]:r for r in map(json.loads,(p/"first500_provisional_decisions.jsonl").open(encoding="utf8"))}
review=[]
for row in map(json.loads,(p/"first500_semantic_neighbor_suggestions.jsonl").open(encoding="utf8")):
 if not row["merge_review_pairs"]:continue
 d={x["draft_key"]:x for x in triage[row["rank"]]["sense_decisions"]}
 for pair in row["merge_review_pairs"]:
  a,b=d[pair["left"]],d[pair["right"]]
  review.append({"rank":row["rank"],"lemma":row["lemma"],"score":pair["similarity"],
    "left":{"draft_key":a["draft_key"],"gloss_en":a["gloss_en"],"sources":a["sources"],"pos":a["part_of_speech"]},
    "right":{"draft_key":b["draft_key"],"gloss_en":b["gloss_en"],"sources":b["sources"],"pos":b["part_of_speech"]},
    "decision":"REQUIRES_MEANING_LEVEL_ADJUDICATION","auto_merge":False})
assert len(review)==8
target=p/"first500_merge_review_8_pairs.json"
target.write_text(json.dumps(review,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
for r in review:print("MERGE_PAIR",json.dumps(r,ensure_ascii=False))
print("MERGE_REVIEW_SUMMARY",json.dumps({"pairs":len(review),"headwords":len(set(x["rank"] for x in review)),"auto_merged":0}))
