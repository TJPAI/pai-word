#!/usr/bin/env python3
"""Recover OEWN 2025 English sense candidates for first 1000 formerly empty lexical headwords.
ECDICT word-level bilingual descriptions remain evidence, never per-Sense translations.
"""
import gzip,json,pathlib,collections
import wn
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
items=[json.loads(l) for l in (root/"new_sense_source_candidates.jsonl").open(encoding="utf8")]
assert len(items)==1000
lex=wn.Wordnet(lexicon="oewn:2025")
counts=collections.Counter()
with (root/"oewn_english_sense_production_candidates.jsonl").open("w",encoding="utf8") as out:
 for r in items:
  senses=[];seen=set()
  for word in lex.words(r["lemma"]):
   for s in word.senses():
    if s.id in seen:continue
    seen.add(s.id);syn=s.synset()
    if not syn.definition():continue
    senses.append({"external_sense_id":s.id,"external_synset_id":syn.id,"pos":syn.pos,"gloss_en":syn.definition(),"candidate_sense_id":None,"gloss_zh":None,"quality_gate":"NEEDS_POS_FILTER_AND_INDEPENDENT_EN_ZH_ALIGNMENT"})
  counts["headwords"]+=1;counts["matched"]+=bool(senses);counts["unmatched"]+=not bool(senses);counts["external_senses"]+=len(senses)
  out.write(json.dumps({"rank":r["rank"],"lemma":r["lemma"],"frozen_pos":r["pos_frozen"],"word_level_zh_evidence":r["translation_zh_word_level"],"candidate_senses":senses,"release_eligible":False},ensure_ascii=False)+"\n")
assert counts["headwords"]==1000
report={"counts":dict(counts),"independently_certified_senses":0,"generated_ku":0,"source":"Open English WordNet 2025 + ECDICT","status":"EVIDENCE_ONLY"}
(root/"oewn_evidence_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("MISSING1000_OEWN_SENSE_DISCOVERY_PASS",json.dumps(report,ensure_ascii=False))
