#!/usr/bin/env python3
"""Whole-runtime Sense-KU evidence extraction and risk routing; no auto-certification."""
import gzip,json,pathlib,collections,hashlib,re
base=pathlib.Path("tools/core20k_sense_v1/reports");base.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f:root=json.load(f)
rows=root["headwords"]; assert len(rows)==20000
seen_rank=set();seen_word=set();stats=collections.Counter(); types=collections.Counter()
with (base/"sense_ku_inventory.jsonl").open("w",encoding="utf-8") as out, (base/"sense_risk_queue.jsonl").open("w",encoding="utf-8") as queue:
 for w in rows:
  assert isinstance(w,list) and len(w)>=5,(str(w)[:100])
  rank,lemma,pos,ipa,kus=w[:5]
  assert rank not in seen_rank and isinstance(rank,int) and 1<=rank<=20000
  assert lemma.casefold() not in seen_word
  seen_rank.add(rank);seen_word.add(lemma.casefold())
  assert isinstance(kus,list)
  sense=[];by_type=collections.Counter()
  for ku in kus:
   if not isinstance(ku,list) or len(ku)<4:stats["malformed_ku"]+=1;continue
   kid,typ,zh,en=ku[:4];typ=str(typ).lower();types[typ]+=1;by_type[typ]+=1
   if typ=="sense":
    sense.append({"source_ku_id":kid,"zh":zh,"en":en})
    if not str(zh).strip() or not str(en).strip():stats["empty_sense_gloss"]+=1
  normalized={(re.sub(r"\\s+","",str(s["zh"])).casefold(),re.sub(r"\\s+","",str(s["en"])).casefold()) for s in sense}
  flags=[]
  if not sense:flags.append("NO_SENSE_TYPE_KU")
  if len(normalized)<len(sense):flags.append("EXACT_DUPLICATE_GLOSS")
  if len(sense)>=5:flags.append("POLYSEMY_REVIEW")
  if len(kus)==0:flags.append("NO_KU")
  if not str(pos).strip():flags.append("MISSING_POS")
  if not str(ipa).strip():flags.append("MISSING_IPA")
  stats["headwords"]+=1;stats["sense_ku"]+=len(sense);stats["with_sense"]+=bool(sense)
  for flag in flags:stats["flag_"+flag]+=1
  row={"rank":rank,"lemma":lemma,"pos":pos,"sense_ku_count":len(sense),"ku_type_counts":dict(by_type),"source_sense_kus":sense,"flags":flags,"certification":"UNREVIEWED_SOURCE_EXTRACT"}
  out.write(json.dumps(row,ensure_ascii=False)+"\n")
  if flags:queue.write(json.dumps({"rank":rank,"lemma":lemma,"flags":flags,"sense_ku_count":len(sense),"review_status":"PENDING_EVIDENCE"},ensure_ascii=False)+"\n")
assert seen_rank==set(range(1,20001))
summary={"source":"data/core20k-runtime.json.gz","frozen_headword_count":len(rows),"statistics":dict(stats),"ku_type_counts":dict(types),"quality_notice":"Extracted KU kind=sense is not a canonical independently certified Sense. Flags are routing heuristics only.","certified_by_this_job":0,"release_eligible":False}
(base/"full_batch_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("BATCH_SUMMARY",json.dumps(summary,ensure_ascii=False))
