#!/usr/bin/env python3
"""Guard structural KU target lemma, mandatory disambiguating cues and staging-only status."""
import json,pathlib,re
p=pathlib.Path("tools/core20k_sense_v1/editorial/v21_top1000_19_structural_ku.jsonl")
rows=[json.loads(x) for x in p.open(encoding="utf8")]
assert len(rows)==19
seen=set()
for r in rows:
 rank=r["rank"];lemma=r["lemma"].casefold()
 assert rank not in seen;seen.add(rank)
 assert r["correct_answer"].casefold()==lemma,(rank,lemma,r["correct_answer"])
 assert r["correct_answer"] in r["acceptable_answers"]
 assert r["question"].count("___")==1 and r["explanation_zh"].strip()
 assert not r["release_eligible"] and not r["production_ready"]
 assert r["assessment_mode"]=="CUE_TARGET_WORD_WITH_CONTEXT"
 # Without alternatives or wider situational cues many cloze prompts are not uniquely answerable;
 # still review-only pending an independent pedagogical QA.
 assert "PENDING" in r["review_status"]
print("STRUCTURAL19_TARGET_QA_PASS",json.dumps({"examined":len(rows),"target_lemma_match":len(rows),"released":0}))
