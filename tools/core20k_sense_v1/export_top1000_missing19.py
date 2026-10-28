#!/usr/bin/env python3
import gzip,json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/release/v2.1-top1000");p.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: d=json.load(f)
rows=[w for w in d["headwords"] if 1<=w[0]<=1000]
missing=[]
for w in rows:
 rank,lemma,pos,ipa,kus,*_=w
 senses=[k for k in kus if isinstance(k,list) and len(k)>=4 and str(k[1]).lower()=="sense" and isinstance(k[2],str) and k[2].strip() and isinstance(k[3],str) and k[3].strip()]
 if not senses:
  missing.append({"rank":rank,"lemma":lemma,"pos":pos,"ipa":ipa,
    "legacy_kus":kus,"state":"NO_VALID_BILINGUAL_SENSE_IN_V206_RUNTIME","do_not_invent_sense_id":True})
assert len(missing)==19,(len(missing),missing)
(p/"top1000_missing19_frozen_records.json").write_text(json.dumps(missing,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("MISSING19",json.dumps([{"rank":x["rank"],"lemma":x["lemma"],"pos":x["pos"],"legacy_ku_count":len(x["legacy_kus"])} for x in missing],ensure_ascii=False))
