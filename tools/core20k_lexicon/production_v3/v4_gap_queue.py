#!/usr/bin/env python3
import json,pathlib,hashlib
b=pathlib.Path("tools/core20k_lexicon/production_v3")
out=b/"v4_gap_queue";out.mkdir(exist_ok=True)
data=[]
for p in sorted((b/"v4_output").glob("rank_*/sense_batch.jsonl")):
 for line in p.open():
  x=json.loads(line)
  if not x["gloss_zh"]:
   data.append({k:x[k] for k in ("teaching_sense_id","rank","lemma","pos","definition_en","synset_id")})
data.sort(key=lambda x:(x["rank"],x["teaching_sense_id"]))
for k in range(0,min(len(data),500),100):
 p=out/f"first500_{k//100+1:03d}.jsonl"
 p.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in data[k:k+100]),encoding="utf8")
for k in range(0,min(len(data),500),100):
 p=out/f"next500_{k//100+1:03d}.jsonl"
 p.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in data[k:k+100]),encoding="utf8")
m={"total_missing":len(data),"first500":min(len(data),500),"first1000_unique":len(set(x["teaching_sense_id"] for x in data[:1000]))}
(out/"manifest.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n")
print(m)
