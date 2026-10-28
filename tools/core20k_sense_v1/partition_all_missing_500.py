#!/usr/bin/env python3
"""Partition all 7003 missing-KU headwords into deterministic <=500-headword review batches."""
import json,pathlib,collections,math,hashlib
base=pathlib.Path("tools/core20k_sense_v1/release")
source=base/"v21-missing-batch-all/missing_lexical_sense_evidence.jsonl"
words=[json.loads(l) for l in source.open(encoding="utf8")]
assert len(words)==7003
root=base/"v21-missing-batch500-all";root.mkdir(parents=True,exist_ok=True)
index=[];seen=set()
for offset in range(0,len(words),500):
 group=words[offset:offset+500];n=offset//500+1
 folder=root/("batch%03d"%n);folder.mkdir(exist_ok=True)
 cards=[];counts=collections.Counter()
 for word in group:
  rank=word["rank"]
  assert rank not in seen;seen.add(rank)
  ss=word["oewn_sense_candidates"]
  if not ss:state="NO_ENGLISH_SENSE"
  elif not word["ecdict_translation_zh_wordlevel"]:state="NO_ZH_REFERENCE"
  elif len(ss)>1:state="POLYSEMOUS_SOURCE_REVIEW"
  elif word["lemma"].casefold() in ("an","eta"):state="KNOWN_FALSE_FRIEND_BLOCK"
  else:state="SINGLE_SENSE_BILINGUAL_REVIEW"
  counts[state]+=1
  for s in ss:
   cards.append({"rank":rank,"lemma":word["lemma"],"headword_id":word["headword_id"],
   "oewn_sense_id":s["oewn_sense_id"],"oewn_pos":s["pos"],"gloss_en":s["gloss_en"],
   "ecdict_wordlevel_zh_unaligned":word["ecdict_translation_zh_wordlevel"],
   "review_state":state,"canonical_sense_id":None,"formal_ku_id":None,
   "release_eligible":False,"production_ready":False})
 with (folder/"review.jsonl").open("w",encoding="utf8") as output:
  for card in cards:output.write(json.dumps(card,ensure_ascii=False)+"\n")
 manifest={"batch":n,"rank_range":[group[0]["rank"],group[-1]["rank"]],
 "headwords":len(group),"candidate_senses":len(cards),"states":dict(counts),
 "certified_senses":0,"certified_kus":0}
 (folder/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
 index.append(manifest)
assert len(index)==15 and len(seen)==7003
assert sum(x["headwords"] for x in index)==7003
assert sum(x["candidate_senses"] for x in index)==12541
(root/"index.json").write_text(json.dumps({"total_batches":len(index),"total_headwords":7003,
 "total_sense_candidates":12541,"batches":index,"certified_sense":0,"certified_ku":0},ensure_ascii=False,indent=2)+"\n")
print("MISSING_ALL_15_BATCHES_PASS",json.dumps({"batches":len(index),"headwords":len(seen),"candidate_senses":12541,"last_batch_headwords":index[-1]["headwords"]}))
