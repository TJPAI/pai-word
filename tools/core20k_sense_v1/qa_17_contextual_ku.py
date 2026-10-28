#!/usr/bin/env python3
"""Harder QA for 17 original contextual KU draft records."""
import json,pathlib,collections,re
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
senses=[json.loads(s) for s in (root/"bilingual_editorial_pilot.jsonl").open(encoding="utf8")]
kus=[json.loads(s) for s in (root/"bilingual_editorial_17_contextual_ku.jsonl").open(encoding="utf8")]
assert len(senses)==len(kus)==17
m={s["rank"]:s for s in senses}
for k in kus:
 s=m[k["rank"]]
 assert k["lemma"]==s["lemma"] and k["external_sense_id"]==s["oewn_sense_id"]
 assert k["gloss_en"]==s["gloss_en"] and k["gloss_zh"]==s["gloss_zh_editorial"]
 assert k["prompt"].count("___")==1 and k["correct_answer"]==k["lemma"]
 assert k["context_en"]==k["prompt"].replace("___",k["lemma"])
 assert k["answer_mode"]=="CUE_CONSTRAINED_CLOZE"
 assert "英文" in k["question_instruction_zh"]
 assert k["canonical_sense_id"] is None and k["release_eligible"] is False and k["production_ready"] is False
 assert k["review_status"]=="NEW_EDITORIAL_EXAMPLE_PENDING_INDEPENDENT_QA"
 assert re.search(r"\b"+re.escape(k["lemma"])+r"\b",k["context_en"],re.I)
print("CONTEXTUAL17_CUE_AND_SENSE_QA_PASS",json.dumps({"checked":17,"semantic_independent_certified":0,"production_ready":0}))
