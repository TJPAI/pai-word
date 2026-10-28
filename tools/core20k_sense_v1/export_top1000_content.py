#!/usr/bin/env python3
"""First 1000 ranks: actual bilingual Sense inventory and reusable recognition KU pack.
Preserves frozen IDs; rejects blanks and duplicate KU IDs; no false certification.
"""
import gzip,json,pathlib,collections,hashlib
out=pathlib.Path("tools/core20k_sense_v1/release/v2.1-top1000");out.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: data=json.load(f)
words=data["headwords"];assert len(words)==20000
subset=[w for w in words if 1<=w[0]<=1000]
assert len(subset)==1000 and [w[0] for w in subset]==list(range(1,1001))
seen=set();stats=collections.Counter()
with (out/"top1000_sense_lexicon_staging.jsonl").open("w",encoding="utf8") as sf, (out/"top1000_sense_recognition_ku_staging.jsonl").open("w",encoding="utf8") as kf:
 for rank,lemma,pos,ipa,kus,*_ in subset:
  stats["words"]+=1
  for ku in kus:
   if not isinstance(ku,list) or len(ku)<4 or str(ku[1]).lower()!="sense":continue
   ku_id,kind,zh,en=ku[:4];ku_id=str(ku_id)
   if not isinstance(zh,str) or not zh.strip() or not isinstance(en,str) or not en.strip():
    stats["missing_bilingual_evidence"]+=1;continue
   if ku_id in seen:
    stats["duplicate_ku_ids"]+=1;continue
   seen.add(ku_id)
   draft_id="v21:legacy:"+ku_id
   record={"rank":rank,"headword_id":f"core20k:rank:{rank}","lemma":lemma,"pos":pos,"us_ipa_candidate":ipa,
    "draft_sense_key":draft_id,"canonical_sense_id":None,"legacy_ku_id":ku_id,
    "gloss_en":en,"gloss_zh":zh,"source_attribution":{"kind":"FROZEN_V206_RUNTIME","legacy_ku_id":ku_id},
    "review_status":"INHERITED_CONTENT_PENDING_SEMANTIC_QA","release_eligible":False}
   sf.write(json.dumps(record,ensure_ascii=False)+"\n")
   ku_record={"ku_id":ku_id,"rank":rank,"headword_id":record["headword_id"],"lemma":lemma,
    "draft_sense_key":draft_id,"canonical_sense_id":None,"ku_type":"sense",
    "render_kind":"sense_recognition","question":{"word":lemma,"context":None},
    "response":{"gloss_zh":zh,"gloss_en":en},
    "source_attribution":record["source_attribution"],"review_status":"INHERITED_TEACHING_QA_REQUIRED",
    "release_eligible":False,"production_ready":False}
   kf.write(json.dumps(ku_record,ensure_ascii=False)+"\n")
   stats["bilingual_sense_candidates"]+=1;stats["reusable_sense_ku_candidates"]+=1
assert stats["words"]==1000
assert stats["bilingual_sense_candidates"]>0
manifest={"version":"Core20K-V2.1-TOP1000-STAGING","baseline":"Core20K_LongTerm_V2.0.6_FINAL_FROZEN",
"metrics":dict(stats),"certified_senses":0,"new_production_ku":0,
"file_descriptions":{"top1000_sense_lexicon_staging.jsonl":"Legacy bilingual Sense evidence, stable draft identity",
"top1000_sense_recognition_ku_staging.jsonl":"Existing recognition KU identity and bilingual answer for teaching QA"},
"restrictions":"All candidates require independently confirmed semantics, alignment, and assessment QA before activation."}
(out/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_TOP1000_STAGING_OK",json.dumps(manifest,ensure_ascii=False))
