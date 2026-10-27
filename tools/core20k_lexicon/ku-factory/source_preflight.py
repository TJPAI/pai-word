#!/usr/bin/env python3
"""Export rank-scoped KU source from a verified runtime; fail closed if schema ambiguous."""
import argparse, gzip, hashlib, json, pathlib, sys
ap=argparse.ArgumentParser()
ap.add_argument("--runtime",default="data/core20k-runtime.json.gz")
ap.add_argument("--start",type=int,default=1001)
ap.add_argument("--end",type=int,default=1500)
ap.add_argument("--out",default="tools/core20k_lexicon/ku-factory/500/003/source_1001_1500.json")
a=ap.parse_args()
raw=pathlib.Path(a.runtime).read_bytes()
digest=hashlib.sha256(raw).hexdigest()
expected="e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"
if digest!=expected: sys.exit("RUNTIME_SHA256_MISMATCH "+digest)
data=json.loads(gzip.decompress(raw))
def shape(v):
 if isinstance(v,dict):return {"kind":"dict","size":len(v),"sample_keys":list(v)[:25]}
 if isinstance(v,list):return {"kind":"list","size":len(v),"item_keys":list(v[0])[:25] if v and isinstance(v[0],dict) else []}
 return {"kind":type(v).__name__}
root={k:shape(v) for k,v in data.items()} if isinstance(data,dict) else {"root":shape(data)}
out=pathlib.Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
diag=out.with_name("source_schema_diagnostic.json")
diag.write_text(json.dumps({"runtime_sha256":digest,"root_shape":root},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
arrays=[(k,v) for k,v in data.items() if isinstance(v,list) and len(v)==20000 and all(isinstance(t,dict) for t in v[:10])] if isinstance(data,dict) else []
if len(arrays)!=1:sys.exit("SCHEMA_NOT_UNAMBIGUOUS: inspect "+str(diag))
name,words=arrays[0]
def extract(x):
 rank=x.get("core20k_rank_final",x.get("rank",x.get("frequency_rank")))
 lemma=x.get("lemma",x.get("headword",x.get("word")))
 hid=x.get("headword_id",x.get("word_id",x.get("id")))
 return rank,lemma,hid
entries=[]
for x in words:
 rank,lemma,hid=extract(x)
 if not isinstance(rank,int) or not isinstance(lemma,str) or not lemma or not hid:sys.exit("MISSING_STABLE_ID_OR_RANK: inspect diagnostic")
 if a.start<=rank<=a.end:entries.append({"rank":rank,"lemma":lemma,"headword_id":hid,"source_record":x})
ranks=[x["rank"] for x in entries]
if len(entries)!=a.end-a.start+1 or sorted(ranks)!=list(range(a.start,a.end+1)):sys.exit("RANK_CONTIGUITY_FAIL")
sense_fields=("senses","sense_records","meanings","definitions")
sense_count=sum(len(v) for e in entries for k,v in e["source_record"].items() if k in sense_fields and isinstance(v,list))
payload={"schema":"enlex-source-export-v2","source_runtime_sha256":digest,"runtime_array":name,"rank_range":[a.start,a.end],"count":len(entries),"sense_count_detected":sense_count,"sense_source_ready":sense_count>0,"words":sorted(entries,key=lambda x:x["rank"])}
out.write_text(json.dumps(payload,ensure_ascii=False)+"\\n",encoding="utf8")
if sense_count==0:
 print("HEADWORDS_EXPORTED_BUT_SENSE_SOURCE_NOT_VERIFIED",file=sys.stderr)
 sys.exit(4)
print("EXPORTED",len(entries),out)
