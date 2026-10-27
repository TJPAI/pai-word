#!/usr/bin/env python3
"""Create safe, versioned Sense/KU staging adapter from existing frozen V2.0.6 Runtime.
Existing KU IDs are reused, not minted. Staging does not certify or activate content.
"""
import gzip,json,pathlib,collections,hashlib
root=pathlib.Path("tools/core20k_sense_v1/reports/enlex_enteach_handoff")
root.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: runtime=json.load(f)
words=runtime["headwords"]
assert len(words)==20000 and [w[0] for w in words]==list(range(1,20001))
stats=collections.Counter(); seen=set()
with (root/"v206_sense_ku_staging_20k.jsonl").open("w",encoding="utf8") as out:
 for rank,lemma,pos,ipa,kus,*_ in words:
  senses=[]; teaching=[]
  for item in kus:
   if not isinstance(item,list) or len(item)<4:continue
   ku_id,kind,gloss_zh,gloss_en=item[:4]
   if str(kind).casefold()!="sense":continue
   identity=str(ku_id)
   # A stable existing KU record is evidence, not an automatically certified Sense.
   if identity in seen:stats["duplicate_legacy_ku_ids"]+=1
   seen.add(identity)
   draft={"legacy_ku_id":identity,"draft_sense_key":"legacy-sense-ku:"+identity,
     "pos":pos,"gloss_zh":gloss_zh,"gloss_en":gloss_en,
     "canonical_sense_id":None,"review_status":"LEGACY_SOURCE_AND_SEMANTIC_QA_REQUIRED",
     "release_eligible":False}
   senses.append(draft);stats["existing_sense_ku_records"]+=1
   if isinstance(gloss_zh,str) and gloss_zh.strip() and isinstance(gloss_en,str) and gloss_en.strip():
    teaching.append({"ku_id":identity,"source":"REUSE_EXISTING_RUNTIME_KU","ku_type":"sense",
      "question":{"render_kind":"sense_recognition","prompt":lemma},
      "response":{"gloss_zh":gloss_zh,"gloss_en":gloss_en},
      "learning_activation":"BLOCKED_PENDING_INDEPENDENT_QA","verified":False})
    stats["ready_for_teaching_review"]+=1
  stats["headwords"]+=1;stats["headwords_with_legacy_sense"]+=bool(senses)
  out.write(json.dumps({"rank":rank,"lemma":lemma,"pos":pos,"ipa":ipa,
    "sense_candidates":senses,"teaching_ku_candidates":teaching,
    "frozen_membership_unchanged":True,"production_release_allowed":False},ensure_ascii=False)+"\n")
assert stats["headwords"]==20000
summary={"baseline":"Core20K_LongTerm_V2.0.6","stats":dict(stats),
"schema":"ENLEX SENSE -> ENTEACH KU staging, only legacy IDs reused",
"production_ready_ku":0,"canonical_sense_certified":0,"frozen_changed":False}
(root/"staging_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("ENLEX_ENTEACH_STAGING",json.dumps(summary,ensure_ascii=False))
