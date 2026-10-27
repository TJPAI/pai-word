#!/usr/bin/env python3
"""Read actual Core20K Runtime and inventory existing KU without inventing new senses."""
import argparse, gzip, json, pathlib, hashlib, collections, sys
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--runtime",required=True)
 p.add_argument("--out",required=True)
 p.add_argument("--expected-sha256",required=True)
 a=p.parse_args()
 raw=pathlib.Path(a.runtime).read_bytes()
 sha=hashlib.sha256(raw).hexdigest()
 if sha!=a.expected_sha256: raise SystemExit("Runtime SHA256 mismatch: "+sha)
 data=json.loads(gzip.decompress(raw))
 print("ROOT_TYPES",json.dumps({k:type(v).__name__ for k,v in data.items()},ensure_ascii=False) if isinstance(data,dict) else type(data).__name__)
 print("ROOT_LENGTHS",json.dumps({k:len(v) for k,v in data.items() if isinstance(v,(list,dict))},ensure_ascii=False) if isinstance(data,dict) else len(data))
 out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
 (out/"runtime_shape.json").write_text(json.dumps({"root_type":type(data).__name__,"keys":list(data) if isinstance(data,dict) else [],"list_sample_shapes":{k:(list(v[0]) if isinstance(v,list) and v and isinstance(v[0],dict) else None) for k,v in data.items() if isinstance(v,list)} if isinstance(data,dict) else {}},ensure_ascii=False,indent=2),encoding="utf-8")
 # Inspect nested dictionary layouts as well as top-level lists; do not guess unknown identities.
 candidates=[]
 if isinstance(data,dict):
  for key,value in data.items():
   if isinstance(value,list) and len(value)>=19000 and all(isinstance(z,dict) for z in value[:10]):
    candidates.append((key,value))
 if len(candidates)!=1:
  shape={"root_type":type(data).__name__,"root_keys":list(data.keys()) if isinstance(data,dict) else [],"candidate_arrays":[{"key":k,"length":len(v),"sample_keys":list(v[0].keys()) if v and isinstance(v[0],dict) else []} for k,v in candidates]}
  (out/"schema_diagnostic.json").write_text(json.dumps(shape,ensure_ascii=False,indent=2),encoding="utf-8")
  print("NEEDS_SCHEMA_MAPPING: expected exactly one 20k word array; inspect schema_diagnostic.json",file=sys.stderr)
  return 3
 key,source=candidates[0]
 inventory=[]
 for n,row in enumerate(source):
  hid=row.get("headword_id") or row.get("word_id") or row.get("id")
  lemma=row.get("lemma") or row.get("headword") or row.get("word")
  rank=row.get("rank") if row.get("rank") is not None else row.get("frequency_rank")
  if not isinstance(hid,(str,int)) or not isinstance(lemma,str) or not lemma.strip() or rank is None:
   print("NEEDS_SCHEMA_MAPPING: invalid identity at source index "+str(n),file=sys.stderr)
   return 3
  inventory.append({"headword_id":hid,"lemma":lemma,"rank":rank,"existing_record":row,"status":"INVENTORY_ONLY_NOT_NEW_GENERATION","activation_allowed":False})
 seen=[str(x["headword_id"]) for x in inventory]
 if len(inventory)!=20000 or len(set(seen))!=20000:
  print("NEEDS_SCHEMA_MAPPING: incorrect 20k cardinality/identity uniqueness",file=sys.stderr)
  return 3
 for start in range(0,20000,250):
  group=inventory[start:start+250]
  (out/("inventory_%05d_%05d.json"%(start+1,start+len(group)))).write_text(json.dumps({"schema":"enlex-v4-source-inventory-v1","source_runtime_sha256":sha,"source_field":key,"status":"INVENTORY_ONLY","words":group},ensure_ascii=False),encoding="utf-8")
 (out/"manifest.json").write_text(json.dumps({"schema":"enlex-v4-inventory-manifest-v1","runtime_sha256":sha,"source_field":key,"headwords":len(inventory),"shards":80,"ku_generated":0,"semantic_certified":0,"production_ready":False},ensure_ascii=False,indent=2),encoding="utf-8")
 print("SUCCESS_INVENTORY",len(inventory),"shards",80)
 return 0
if __name__=="__main__":sys.exit(main())
