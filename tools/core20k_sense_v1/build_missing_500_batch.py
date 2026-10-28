#!/usr/bin/env python3
"""500-headword production-ready *review packet* from full gap evidence (not production-ready learning content).
Only conservative prompts with English sense definition; Chinese word-level translation explicitly not bound.
"""
import json,pathlib,collections,re
base=pathlib.Path("tools/core20k_sense_v1/release")
src=base/"v21-missing-batch-all/missing_lexical_sense_evidence.jsonl"
rows=[json.loads(x) for x in src.open(encoding="utf8")]
assert len(rows)==7003
batch=rows[:500]
assert len(batch)==500
out=base/"v21-missing-batch001-500";out.mkdir(parents=True,exist_ok=True)
counts=collections.Counter();seen=set();review=[]
for w in batch:
 rank=w["rank"];lemma=w["lemma"];senses=w["oewn_sense_candidates"]
 zh=w["ecdict_translation_zh_wordlevel"];frozen_pos=str(w["frozen_pos"] or "").lower()
 if not senses:state="NO_ENGLISH_SENSE"
 elif not zh:state="NO_CHINESE_REFERENCE"
 elif len(senses)!=1:state="POLYSEMY_NEEDS_SENSE_SELECTION"
 elif lemma.casefold() in ("an","eta"):state="KNOWN_HOMOGRAPH_BLOCK"
 else:state="SINGLE_EN_SENSE_WITH_WORDLEVEL_ZH_UNVERIFIED"
 counts[state]+=1
 for ss in senses:
  sid=ss["oewn_sense_id"];key=(rank,sid)
  if key in seen:raise AssertionError(key)
  seen.add(key)
  # Not a scored cloze: this is a recognition learning card with target definition.
  review.append({"rank":rank,"lemma":lemma,"frozen_pos":w["frozen_pos"],"external_sense_id":sid,
   "gloss_en":ss["gloss_en"],"oewn_pos":ss["pos"],"ecdict_zh_wordlevel_not_aligned":zh,
   "canonical_sense_id":None,"ku_id":None,"ku_render_candidate":"sense_definition_review_card",
   "question_candidate":{"headword":lemma,"english_sense_definition":ss["gloss_en"]},
   "review_priority":state,"needs_independent_semantic_signoff":True,
   "release_eligible":False,"production_ready":False})
with (out/"english_sense_review_cards.jsonl").open("w",encoding="utf8") as f:
 for r in review:f.write(json.dumps(r,ensure_ascii=False)+"\n")
(out/"headword_triage.jsonl").write_text("".join(json.dumps({"rank":w["rank"],"lemma":w["lemma"],"flags":w["flags"],"sense_candidates":len(w["oewn_sense_candidates"])},ensure_ascii=False)+"\n" for w in batch),encoding="utf8")
report={"batch":1,"headwords":len(batch),"english_sense_review_cards":len(review),"classification":dict(counts),"new_approved_sense":0,"new_approved_ku":0,"note":"No ECDICT word-level Chinese translation is assigned to OEWN sense."}
(out/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("MISSING500_REVIEW_BATCH_PASS",json.dumps(report,ensure_ascii=False))
