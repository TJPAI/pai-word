#!/usr/bin/env python3
"""Streaming match of Kaikki English JSONL to immutable Core20K words."""
import gzip,json,urllib.request,pathlib,collections
outdir=pathlib.Path("tools/core20k_sense_v1/reports/online_sources");outdir.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f:words=json.load(f)["headwords"]
wanted={w[1].casefold():w[0] for w in words}
url="https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl"
req=urllib.request.Request(url,headers={"User-Agent":"PAIWord-SenseAudit/1.0"})
stats=collections.Counter();unique=set()
with urllib.request.urlopen(req,timeout=180) as response, (outdir/"kaikki_en_core20k.jsonl").open("w",encoding="utf-8") as dest:
 for line in response:
  stats["scanned_entries"]+=1
  try:r=json.loads(line)
  except Exception:stats["parse_errors"]+=1;continue
  lemma=r.get("word","")
  if not isinstance(lemma,str) or lemma.casefold() not in wanted:continue
  if r.get("lang_code","en")!="en":continue
  senses=[]
  for s in r.get("senses",[]):
   if not isinstance(s,dict):continue
   senses.append({"glosses":s.get("glosses",[]),"tags":s.get("tags",[]),"topics":s.get("topics",[]),"examples":s.get("examples",[])[:2]})
  dest.write(json.dumps({"rank":wanted[lemma.casefold()],"lemma":lemma,"pos":r.get("pos"),"senses":senses,"source":"Kaikki English Wiktionary","status":"UNVERIFIED_LEXICAL_EVIDENCE"},ensure_ascii=False)+"\n")
  unique.add(lemma.casefold());stats["matched_records"]+=1;stats["sense_candidates"]+=len(senses)
stats["distinct_headwords"]=len(unique)
(outdir/"kaikki_en_summary.json").write_text(json.dumps(dict(stats),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("KAIKKI_EN_SUMMARY",json.dumps(dict(stats),ensure_ascii=False))
