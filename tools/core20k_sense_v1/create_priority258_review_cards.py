#!/usr/bin/env python3
"""Produce 258 bilingual editorial review cards, with complete OEWN English and ECDICT Chinese evidence.
Unverified bilingual pairing is NEVER automatically promoted to accepted.
"""
import json,pathlib,collections,re
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
data=[json.loads(l) for l in (root/"oewn_english_sense_production_candidates.jsonl").open(encoding="utf8")]
cards=[];stats=collections.Counter()
for r in data:
 senses=r["candidate_senses"];zh=r.get("word_level_zh_evidence") or ""
 tokens=[t.strip() for t in re.split(r"[；;\n]",zh) if t.strip()]
 if len(senses)!=1 or len(tokens)!=1:continue
 s=senses[0]
 # Non-semantic format and POS cues require editor attention, not automatic approval.
 flags=[]
 if len(tokens[0])>60:flags.append("ZH_GLOSS_LONG")
 if any(x in tokens[0] for x in ("[","(", "（")):flags.append("ZH_HAS_USAGE_QUALIFIER")
 if len(s["gloss_en"])<12:flags.append("EN_DEFINITION_SHORT")
 card={"rank":r["rank"],"lemma":r["lemma"],"frozen_pos":r["frozen_pos"],
  "oewn_sense_id":s["external_sense_id"],"oewn_pos":s["pos"],"gloss_en":s["gloss_en"],
  "ecdict_wordlevel_zh":tokens[0],"candidate_gloss_zh":None,
  "flags":flags,"editorial_decision":"PENDING_BILINGUAL_SEMANTIC_ADJUDICATION",
  "decision_reason":None,"approved_ku_id":None,"release_eligible":False,
  "source_urls":["https://en-word.net/","https://github.com/skywind3000/ECDICT"]}
 cards.append(card)
 stats["review_cards"]+=1
 for f in flags:stats["flag:"+f]+=1
assert len(cards)>0
print('CORRECTED_SINGLE_SENSE_SINGLE_ZH_COUNT',len(cards))
cards.sort(key=lambda x:x["rank"])
with (root/"priority258_bilingual_editorial_cards.jsonl").open("w",encoding="utf8") as out:
 for card in cards:out.write(json.dumps(card,ensure_ascii=False)+"\n")
(root/"priority258_bilingual_editorial_manifest.json").write_text(json.dumps({"stats":dict(stats),"decision_type":"REVIEW_ONLY","auto_approved":0,"priority":"rank ascending"},ensure_ascii=False,indent=2)+"\n")
print("PRIORITY258_REVIEW_CARDS_PASS",json.dumps(dict(stats),ensure_ascii=False))
print("FIRST_20_REVIEW_CARDS",json.dumps([{k:r[k] for k in ("rank","lemma","frozen_pos","oewn_pos","gloss_en","ecdict_wordlevel_zh")} for r in cards[:20]],ensure_ascii=False))
