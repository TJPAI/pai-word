#!/usr/bin/env python3
"""Create newly sourced Sense-entry candidates for the first 1000 actually missing headwords.
ECDICT's word-level translations are NOT sense-certified bilingual equivalents.
"""
import csv,gzip,json,pathlib,urllib.request,collections,io,hashlib
dest=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
dest.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: words=json.load(f)["headwords"]
gaps=[]
for w in words:
 rank,lemma,pos,ipa,kus,*_=w
 if not any(isinstance(k,list) and len(k)>=4 and str(k[1]).lower()=="sense" and isinstance(k[2],str) and k[2].strip() and isinstance(k[3],str) and k[3].strip() for k in kus):
  if not any(s in str(pos).lower() for s in ("pron.","det.","conj.","prep.","aux.","modal","interj.")):
   gaps.append(w)
target=gaps[:1000];assert len(target)==1000
lookup={w[1].casefold():w for w in target}
source="https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
request=urllib.request.Request(source,headers={"User-Agent":"PAI-Word-Lexicon-Evidence/1.0"})
stats=collections.Counter();found={}
with urllib.request.urlopen(request,timeout=180) as response:
 reader=csv.DictReader(io.TextIOWrapper(response,encoding="utf-8-sig",errors="replace",newline=""))
 for row in reader:
  lemma=str(row.get("word","")).casefold()
  if lemma in lookup and lemma not in found:
   found[lemma]=row
with (dest/"new_sense_source_candidates.jsonl").open("w",encoding="utf8") as out:
 for w in target:
  rank,lemma,pos,ipa,kus,*_=w
  source_row=found.get(lemma.casefold(),{})
  en=str(source_row.get("definition") or "").strip()
  zh=str(source_row.get("translation") or "").strip()
  evidence=bool(en and zh)
  status="ECDICT_WORD_LEVEL_BILINGUAL_EVIDENCE" if evidence else ("ECDICT_PARTIAL_EVIDENCE" if en or zh else "ECDICT_NO_EVIDENCE")
  item={"rank":rank,"lemma":lemma,"pos_frozen":pos,"headword_id":f"core20k:rank:{rank}",
   "source":"skywind3000/ECDICT","source_url":source,"definition_en_word_level":en,"translation_zh_word_level":zh,
   "source_pos":source_row.get("pos"),"candidate_sense_id":None,"candidate_ku_id":None,
   "status":status,"word_level_not_sense_aligned":True,
   "new_lexical_content_source_recovered":evidence,"independent_semantic_qa":False,
   "release_eligible":False,"production_ready":False}
  out.write(json.dumps(item,ensure_ascii=False)+"\n")
  stats[status]+=1
assert sum(stats.values())==1000
report={"target_lexical_gap_headwords":1000,"stats":dict(stats),"new_source_evidence_items":stats["ECDICT_WORD_LEVEL_BILINGUAL_EVIDENCE"],
 "formal_sense_created":0,"production_ready_ku":0,
 "limitation":"Word-level ECDICT gloss is NOT a trustworthy specific Sense mapping; needs English Sense segmentation and bilingual QA."}
(dest/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("MISSING_FIRST1000_ECDICT_EVIDENCE_PASS",json.dumps(report,ensure_ascii=False))
