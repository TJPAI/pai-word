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

supplemental=[json.loads(x) for x in (root/"v21_first6_supplemental_ku.jsonl").open(encoding="utf8")]
assert len(supplemental)==6
assert {q["rank"] for q in supplemental}=={x["rank"] for x in rows}
assert len({q["ku_id"] for q in supplemental})==6
for q in supplemental:
 source=auth[q["rank"]]
 assert q["sense_id"]==source["sense_id"]
 assert q["headword_id"]==source["headword_id"]
 assert q["ku_id"].startswith("staging:v21:")
 assert q["ku_type"] in ("grammar","collocation","usage")
 assert q["render_kind"]=="cloze" and q["question"].count("___")==1
 assert q["correct_answer"] in q["acceptable_answers"]
 assert q["question"].strip() and q["explanation_zh"].strip()
 assert q["source_attribution"] and q["evidence_status"]=="EDITORIAL_DRAFT"
 assert q["qa_status"]=="PENDING_INDEPENDENT_LINGUISTIC_QA"
 assert q["release_eligible"] is False and q["production_ready"] is False
print("FIRST6_SUPPLEMENTAL_KU_QA_PASS",json.dumps({"new_draft_ku":len(supplemental),"sense_binding_checked":len(supplemental),"released":0}))
