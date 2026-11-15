#!/usr/bin/env python3
"""Reproduce CG-MASTER V196 from authoritative V180 ZIP + V147 SC0014 author JSON.
Non-destructive, source-identity gated, never marks an entry Ready or SRS-eligible.
Requires local downloaded source archives and Python 3; outputs four deterministic gzip shards.
"""
import argparse, gzip, hashlib, io, json, pathlib, zipfile

V180_SHA256 = (
 "739dfe385e2da4215c7a5096c5afa09873161ab683c45819d898c6e903448169",
 "12a638cbfa6ec88b89f07c8e10c200be7a54763f8fb1f5dcd861e3b122b3e7ca",
 "5f87c64238814e4ab155530b4549424609a1c3950cb602cb179c11510662888a",
 "4fb8eb26d9c9aa023ce92c7273605553ce76d6fa27628516f5d18b08ee30e44e",
)
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--v180-zip",required=True,type=pathlib.Path)
 p.add_argument("--v147-json",required=True,type=pathlib.Path)
 p.add_argument("--output",required=True,type=pathlib.Path)
 a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
 rows=[]
 with zipfile.ZipFile(a.v180_zip) as z:
  names=sorted(n for n in z.namelist() if n.endswith(".jsonl.gz"))
  assert len(names)==4
  for name,digest in zip(names,V180_SHA256):
   raw=z.read(name)
   assert hashlib.sha256(raw).hexdigest()==digest,(name,"SHA256 source mismatch")
   rows.extend(json.loads(t) for t in gzip.decompress(raw).splitlines())
 author=json.loads(a.v147_json.read_text(encoding="utf-8"))["records"]
 source={r["source_final_row"]:r for r in author}
 assert len(source)==243 and set(source)==set(range(3133,3376))
 assert [r["source_final_row"] for r in rows]==list(range(3001,6001))
 assert len({r["record_id"] for r in rows})==3000
 merge=0
 for r in rows:
  arow=source.get(r["source_final_row"])
  if arow is None:continue
  assert arow["record_id"]==r["record_id"] and arow["scene_id"]==r["scene_id"]
  assert arow["question_page"]["english_expression"]==r["expression"]==r["question_page"]["english_expression"]
  assert arow["question_page"]["cue_zh"]==r["question_page"]["cue_zh"]
  assert arow["answer_page"]["meaning_zh"]==r["meaning_zh"]==r["answer_page"]["meaning_zh"]
  for key in ("example_en","example_zh","collocations","usage_note"):
   assert not r["answer_page"].get(key),(r["source_final_row"],key)
   assert arow["answer_page"][key]
   r["answer_page"][key]=arow["answer_page"][key]
  r["answer_page"]["content_complete"]=bool(arow["answer_page"]["content_complete"])
  r["answer_page"]["author_provenance"]={"source_version":"V147","source_record_id":r["record_id"],"source_final_row":r["source_final_row"],"status":"AUTHOR_DRAFT_NOT_INDEPENDENTLY_CERTIFIED"}
  r["answer_page"]["examples"]=[{"example_en":arow["answer_page"]["example_en"],"example_zh":arow["answer_page"]["example_zh"],"source":"V147_AUTHOR_DRAFT","status":"UNVERIFIED"}]
  r["qa_status"]="PENDING_INDEPENDENT_QA";r["release_allowed"]=False;r["srs_eligible"]=False
  merge+=1
 assert merge==243 and sum(bool(r["answer_page"].get("example_en")) for r in rows)==243
 assert sum(bool(r["pronunciation"].get("selected_ipa_test_only")) for r in rows)==1162
 for k in range(4):
  part=rows[k*750:(k+1)*750]
  text="".join(json.dumps(r,ensure_ascii=False,separators=(",",":"))+"\n" for r in part).encode()
  out=io.BytesIO()
  with gzip.GzipFile(filename="",fileobj=out,mode="wb",mtime=0,compresslevel=9) as w:w.write(text)
  name=f'CGMASTER_V196_SOURCE{part[0]["source_final_row"]:05d}_{part[-1]["source_final_row"]:05d}_SC0014_AUTHOR_OVERLAY.jsonl.gz'
  data=out.getvalue();(a.output/name).write_bytes(data)
  print(name,len(data),hashlib.sha256(data).hexdigest(),hashlib.sha1(f"blob {len(data)}\0".encode()+data).hexdigest())
 print("PASS: 3000 associations, 243 author merges, 0 identity or content clobbers; test-only, SRS disabled")
if __name__=="__main__":main()
