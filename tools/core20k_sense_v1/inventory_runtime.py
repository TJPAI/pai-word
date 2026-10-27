#!/usr/bin/env python3
"""Inventory frozen Core20K runtime without modifying it. Stdlib only."""
import gzip, json, hashlib, pathlib, collections, sys
src=pathlib.Path("data/core20k-runtime.json.gz")
dst=pathlib.Path("tools/core20k_sense_v1/reports/runtime_inventory.json")
def items(obj):
    if isinstance(obj,list):return obj
    if isinstance(obj,dict):
        for k in ("words","headwords","entries","items","data","lexicon"):
            if k in obj:
                v=obj[k]
                if isinstance(v,list):return v
                if isinstance(v,dict):return list(v.values())
    return []
with src.open("rb") as f: digest=hashlib.sha256(f.read()).hexdigest()
with gzip.open(src,"rt",encoding="utf-8") as f:root=json.load(f)
rows=items(root)
keys=collections.Counter(); sense_keys=collections.Counter(); sense_sizes=collections.Counter()
examples=[]; ranked=[]; senses=0; words_with_senses=0
for i,w in enumerate(rows):
    if not isinstance(w,dict):continue
    keys.update(w.keys())
    sk=next((k for k in ("senses","sense","meanings","definitions") if isinstance(w.get(k),list)),None)
    sv=w.get(sk,[]) if sk else []
    senses+=len(sv);words_with_senses+=bool(sv)
    sense_sizes[len(sv)]+=1
    for s in sv:
        if isinstance(s,dict):sense_keys.update(s.keys())
    if i<3:examples.append({"word_keys":list(w.keys()),"sense_key":sk,"sense_sample_keys":list(sv[0]) if sv and isinstance(sv[0],dict) else [],"rank":w.get("rank"),"headword":w.get("headword",w.get("lemma",w.get("word")))})
    if w.get("rank") is not None:ranked.append(w.get("rank"))
result={"source":str(src),"source_sha256":digest,"root_type":type(root).__name__,"root_keys":list(root)[:35] if isinstance(root,dict) else [],"row_count":len(rows),"rank_present_count":len(ranked),"words_with_list_senses":words_with_senses,"list_sense_records":senses,"words_without_list_senses":len(rows)-words_with_senses,"word_keys":keys.most_common(),"sense_keys":sense_keys.most_common(),"sense_count_distribution":sense_sizes.most_common(25),"samples":examples,"note":"Automatic structure inventory only: zero claims of semantic certification."}
dst.parent.mkdir(parents=True,exist_ok=True)
dst.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:result[k] for k in ("row_count","words_with_list_senses","list_sense_records","words_without_list_senses")},ensure_ascii=False))
if len(rows)!=20000:
 print("BLOCKED: runtime may not expose 20K entries with detected schema. Inspect samples.",file=sys.stderr)
