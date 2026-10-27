#!/usr/bin/env python3
"""Identity and pedagogical structure QA for hand-edited six bilingual Sense/KU records."""
import json,pathlib
root=pathlib.Path("tools/core20k_sense_v1/editorial")
p=root/"v21_first6_sense_ku_semantic_edits.jsonl"
rows=[json.loads(x) for x in p.open(encoding="utf8")]
source=pathlib.Path("tools/core20k_lexicon/runtime/v1/batch90_six_complete_source_checked_sense.jsonl")
auth={r["rank"]:r for r in map(json.loads,source.open(encoding="utf8"))}
assert len(rows)==6 and len({r["rank"] for r in rows})==6
for r in rows:
 old=auth[r["rank"]]
 assert (r["lemma"],r["sense_id"],r["legacy_ku_id"])==(old["headword"],old["sense_id"],old["ku_id"])
 assert r["gloss_en"].strip() and r["gloss_zh"].strip()
 assert r["example_en"]==old["example_en"] and r["example_zh"]==old["example_zh"]
 assert r["answer_variants"] and all(isinstance(x,str) and x.strip() for x in r["answer_variants"])
 assert not r["production_ready"] and not r["release_eligible"]
 assert r["review_status"]=="EDITORIAL_DRAFT_NEEDS_INDEPENDENT_QA"
print("FIRST6_SEMANTIC_QA_PASS",json.dumps({"headwords":len(rows),"preserved_legacy_ids":len(rows),"editorial_revisions":len(rows),"production_ready":0}))
