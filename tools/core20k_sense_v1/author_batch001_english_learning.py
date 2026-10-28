#!/usr/bin/env python3
"""First batch: produce actual English Sense-specific learning prompts from authoritative OEWN glosses.
The Chinese reference remains word-level and is NOT given as a scored answer.
"""
import json,pathlib,collections,re
base=pathlib.Path("tools/core20k_sense_v1/release")
src=base/"v21-missing-batch001-500/english_sense_review_cards.jsonl"
rows=[json.loads(s) for s in src.open(encoding="utf8")]
outdir=base/"v21-missing-batch001-content";outdir.mkdir(parents=True,exist_ok=True)
draft=[];seen=set();counts=collections.Counter()
for r in rows:
 if r["review_priority"]!="SINGLE_EN_SENSE_WITH_WORDLEVEL_ZH_UNVERIFIED":continue
 en=r["gloss_en"].strip();lemma=r["lemma"]
 if len(en)<16 or len(en)>350 or any(z in lemma for z in (" ","/")):
  counts["filtered_weak_prompt"]+=1;continue
 rank=r["rank"]
 assert rank not in seen;seen.add(rank)
 draft.append({"draft_ku_id":f"staging:v21:missing500:{rank}:engdef01",
 "rank":rank,"lemma":lemma,"headword_id":f"core20k:rank:{rank}",
 "source_sense_id":r["external_sense_id"],"canonical_sense_id":None,
 "ku_type":"sense","render_kind":"source_definition_recognition",
 "question":{"prompt":f"Read the dictionary definition of '{lemma}' and explain its meaning.", "source_definition_en":en},
 "response":{"gloss_en":en,"gloss_zh":None},
 "unverified_wordlevel_zh_reference":r["ecdict_zh_wordlevel_not_aligned"],
 "source_attribution":"Open English WordNet 2025",
 "review_status":"ENGLISH_SENSE_CONTENT_DRAFT_NEEDS_ZH_AND_PEDAGOGICAL_QA",
 "production_ready":False,"release_eligible":False})
counts["english_sense_drafts"]=len(draft)
assert len(draft)>100
(outdir/"english_definition_learning_drafts.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in draft),encoding="utf8")
(outdir/"manifest.json").write_text(json.dumps({"counts":dict(counts),"certified_ku":0,"bilingual_sense_certified":0},ensure_ascii=False,indent=2)+"\n")
print("MISSING500_ACTUAL_EN_LEARNING_DRAFTS_PASS",json.dumps(dict(counts),ensure_ascii=False))
