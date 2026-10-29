#!/usr/bin/env python3
import json,time,pathlib,hashlib,sys
from transformers import MarianTokenizer,MarianMTModel
import torch
input_path=pathlib.Path("tools/core20k_lexicon/v58_smoke/real200.jsonl")
rows=[json.loads(l) for l in input_path.read_text().splitlines() if l.strip()]
assert len(rows)==200 and len(rows)==len({r["teaching_sense_id"] for r in rows})
model_id="Helsinki-NLP/opus-mt-en-zh"
start=time.monotonic()
tok=MarianTokenizer.from_pretrained(model_id)
model=MarianMTModel.from_pretrained(model_id)
texts=[r["definition_en"] for r in rows]
translations=[]
for offset in range(0,len(texts),8):
    with torch.no_grad():
        inputs=tok(texts[offset:offset+8],return_tensors="pt",padding=True,truncation=True,max_length=192)
        ys=model.generate(**inputs,max_new_tokens=128,num_beams=3)
        translations.extend(tok.batch_decode(ys,skip_special_tokens=True))
    print("PROGRESS",min(offset+8,len(texts)),len(texts),flush=True)
results=[]
assert len(translations)==len(rows)
for r,zh in zip(rows,translations):
    assert zh.strip()
    results.append({**r,"gloss_zh_machine_candidate":zh.strip(),"source_model":model_id,"quality_status":"MACHINE_UNVERIFIED","semantic_certified":False,"production_ready":False})
path=pathlib.Path("v59_results");path.mkdir(exist_ok=True)
data="".join(json.dumps(r,ensure_ascii=False)+"\n" for r in results)
(path/"candidates.jsonl").write_text(data,encoding="utf8")
report={"count":len(results),"runtime_seconds":round(time.monotonic()-start,2),"sha256":hashlib.sha256(data.encode()).hexdigest(),"semantic_certified":False}
(path/"report.json").write_text(json.dumps(report,indent=2))
print(json.dumps(report))
