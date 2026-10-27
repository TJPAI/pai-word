#!/usr/bin/env python3
"""Stream Chinese Wiktionary extracted data and exact-match frozen English headwords."""
import gzip,json,pathlib,urllib.request,collections
root=pathlib.Path("tools/core20k_sense_v1/reports/online_sources");root.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f:w=json.load(f)["headwords"]
target={str(x[1]).casefold():x[0] for x in w};stats=collections.Counter();matched=set()
url="https://kaikki.org/zhwiktionary/raw-wiktextract-data.jsonl.gz"
req=urllib.request.Request(url,headers={"User-Agent":"PAIWord-SenseAudit/1.0"})
with urllib.request.urlopen(req,timeout=180) as response, gzip.GzipFile(fileobj=response) as stream, (root/"zhwiktionary_core20k.jsonl").open("w",encoding="utf-8") as out:
 for raw in stream:
  stats["scanned"]+=1
  try:record=json.loads(raw)
  except Exception:
   stats["invalid"]+=1;continue
  name=str(record.get("word",""))
  if name.casefold() not in target:continue
  language=str(record.get("lang_code",""))
  if language not in ("en","eng") and record.get("lang") not in ("English","英语","英語"):continue
  senses=record.get("senses") or []
  evidence=[{"glosses":s.get("glosses",[]),"raw_glosses":s.get("raw_glosses",[]),"tags":s.get("tags",[])} for s in senses if isinstance(s,dict)]
  out.write(json.dumps({"rank":target[name.casefold()],"lemma":name,"pos":record.get("pos"),"senses":evidence,"source":"zhwiktionary-2026-10","status":"UNVERIFIED_LEXICAL_EVIDENCE"},ensure_ascii=False)+"\n")
  matched.add(name.casefold());stats["matched_entries"]+=1;stats["sense_rows"]+=len(evidence)
stats["matched_unique_headwords"]=len(matched)
(root/"zhwiktionary_summary.json").write_text(json.dumps(dict(stats),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("ZHWIKTIONARY_SUMMARY",json.dumps(dict(stats),ensure_ascii=False))
