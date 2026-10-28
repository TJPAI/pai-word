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

# Keep structural/function exercises separate from lexical Sense records.
source=pathlib.Path("tools/core20k_sense_v1/editorial/v21_top1000_19_structural_ku.jsonl")
drafts=[json.loads(line) for line in source.open(encoding="utf8")]
assert len(drafts)==19
known={x["rank"]:x for x in missing}
assert {x["rank"] for x in drafts}==set(known)
assert len({x["draft_ku_id"] for x in drafts})==19
for q in drafts:
 assert q["lemma"]==known[q["rank"]]["lemma"]
 assert q["headword_id"]==f"core20k:rank:{q['rank']}"
 assert q["canonical_sense_id"] is None
 assert q["question"].count("___")==1
 assert q["correct_answer"] in q["acceptable_answers"]
 assert q["production_ready"] is False and q["release_eligible"] is False
(p/"top1000_structural_ku_staging.jsonl").write_text(
 "".join(json.dumps(q,ensure_ascii=False)+"\\n" for q in drafts),encoding="utf8")
print("TOP1000_STRUCTURAL_KU_STAGING_OK",len(drafts))
