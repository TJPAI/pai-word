#!/usr/bin/env python3
"""Collect first-party-accessible lexical evidence for Core20K pilot; never certify automatically."""
import csv,gzip,json,urllib.request,urllib.parse,pathlib,collections,time
ROOT=pathlib.Path("tools/core20k_sense_v1/reports/online_sources")
ROOT.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f: words=json.load(f)["headwords"]
wordmap={w[1].casefold():w for w in words}
pilot=[w for w in words if w[0]<=500]
stats=collections.Counter()
# Exact full ECDICT CSV download; stream to avoid RAM growth.
url="https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
req=urllib.request.Request(url,headers={"User-Agent":"PAIWord-PersonalSenseAudit/1.0"})
from tempfile import NamedTemporaryFile
with urllib.request.urlopen(req,timeout=120) as response, NamedTemporaryFile(mode="w+b") as temp:
 while True:
  block=response.read(1024*1024)
  if not block:break
  temp.write(block)
 temp.seek(0)
 import io
 stream=io.TextIOWrapper(temp,encoding="utf-8-sig",errors="replace",newline="")
 reader=csv.DictReader(stream)
 with (ROOT/"ecdict_core20k.jsonl").open("w",encoding="utf-8") as out:
  for row in reader:
   term=str(row.get("word","")).casefold()
   if term in wordmap:
    w=wordmap[term]
    record={"rank":w[0],"lemma":w[1],"definition_en":row.get("definition"),"translation_zh":row.get("translation"),"pos":row.get("pos"),"bnc":row.get("bnc"),"frq":row.get("frq"),"source":"skywind3000/ECDICT","status":"SOURCE_IMPORTED_NOT_SENSE_CERTIFIED"}
    out.write(json.dumps(record,ensure_ascii=False)+"\n")
    stats["ecdict_rows"]+=1
# Free API pilot only, safe bounded set with transparent HTTP status
with (ROOT/"dictionaryapi_top50.jsonl").open("w",encoding="utf-8") as out:
 for w in pilot[:50]:
  rank,lemma=w[:2]
  try:
   u="https://api.dictionaryapi.dev/api/v2/entries/en/"+urllib.parse.quote(lemma,safe="")
   request=urllib.request.Request(u,headers={"User-Agent":"PAIWord-PersonalSenseAudit/1.0"})
   with urllib.request.urlopen(request,timeout=15) as response: entries=json.load(response)
   defs=[]
   if isinstance(entries,list):
    for entry in entries:
     for meaning in entry.get("meanings",[]):
      for definition in meaning.get("definitions",[]):
       defs.append({"pos":meaning.get("partOfSpeech"),"gloss_en":definition.get("definition"),"example":definition.get("example")})
   out.write(json.dumps({"rank":rank,"lemma":lemma,"definitions":defs,"source":"dictionaryapi.dev","status":"SOURCE_IMPORTED_NOT_SENSE_CERTIFIED"},ensure_ascii=False)+"\n")
   stats["dictionaryapi_matched"]+=1
   stats["dictionaryapi_definitions"]+=len(defs)
  except Exception as e:
   stats["dictionaryapi_errors"]+=1
   out.write(json.dumps({"rank":rank,"lemma":lemma,"error":type(e).__name__,"status":"FETCH_FAILED"},ensure_ascii=False)+"\n")
  time.sleep(0.25)
(ROOT/"collection_summary.json").write_text(json.dumps({"stats":dict(stats),"frozen_headwords":20000,"scope":"ECDICT full 20K exact join; DictionaryAPI bounded top50 pilot","quality_gate":"EVIDENCE_ONLY_NOT_SEMANTIC_CERTIFIED"},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("SOURCE_COLLECTION",json.dumps(dict(stats),ensure_ascii=False))
