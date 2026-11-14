#!/usr/bin/env python3
"""Non-destructive V190 evidence risk gate. No Sense certification or SRS write.
Usage: python tools/scene1341_master/audit_v191_source_risks.py /path/to/V190/shards
Outputs JSON to stdout; exits 2 for mismatching V190 immutable source identity.
"""
import pathlib, gzip, json, sys, hashlib, collections
SHARDS=[
 ("CGMASTER_V190_SOURCE00001_01000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz",1000,"12c4d4b088d670feb6d9ec7cd895c8cdfb8fc08c42100b529bb9966ed12ba60c"),
 ("CGMASTER_V190_SOURCE01001_02000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz",1000,"05786ca01ba101373a711254d490552b7654693252af3f1b039737eb1325e148"),
 ("CGMASTER_V190_SOURCE02001_03000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz",1000,"90afbdfb00536cd8c8840a7f88898c8b79e9bb14b884c604d0b32a6ba5bf703a")]
P0={200,305,348,506,580,821,1036,1758,2213,2220,2380,2409,2696}
P1={4,137,203,1611,2057,2083,2281,2282,2558}
POLLUTED_UP={"/daʊ̯n/","/dʌʊ̯n/","/dæʊ̯n/","/daːn/","/duːn/"}
def walk(x, path=()):
 if isinstance(x,dict):
  for k,v in x.items():
   yield from walk(v,path+(str(k),))
 elif isinstance(x,list):
  for i,v in enumerate(x):yield from walk(v,path+(str(i),))
 else:yield path,x
def run(folder):
 records=[]
 for name,count,sha in SHARDS:
  p=folder/name
  blob=p.read_bytes()
  assert hashlib.sha256(blob).hexdigest()==sha, "Source SHA mismatch: "+name
  rows=[json.loads(s) for s in gzip.decompress(blob).decode("utf-8").splitlines() if s]
  assert len(rows)==count, "Shard count mismatch: "+name
  records+=rows
 assert len(records)==3000
 assert [r["source_final_row"] for r in records]==list(range(1,3001))
 assert len({r["record_id"] for r in records})==3000
 assert all(r.get("global_sense_id") is None and not r.get("formal_ready",False) and not r.get("srs_eligible",False) for r in records)
 risk=[]
 up=[]
 for r in records:
  n=r["source_final_row"]
  if n in P0|P1:
   a=r.get("answer_page",{})
   risk.append({"source_final_row":n,"record_id":r["record_id"],"expression":r["question_page"].get("expression"),"candidate_pos":a.get("pos"),"priority":"P0" if n in P0 else "P1","action":"HOLD_UNTIL_KAIKKI_SOURCE_SENSE_RESELECTED"})
  # Screening signal only: detecting token='up' in a nested provenance path.
  findings=[]
  for path,val in walk(r):
   if isinstance(val,str) and val in POLLUTED_UP and any("up"==p.casefold() for p in path):
    findings.append({"path":".".join(path),"ipa":val})
  if findings: up.append({"source_final_row":n,"record_id":r["record_id"],"findings":findings})
 assert len(risk)==22
 return {"schema":"cgmaster-v191-risk-gate-v1","base_commit":"acda081836511707bc12d8360fa0472ff12401b8","associations_verified":3000,"critical_semantic_holds":risk,"semantic_holds":len(risk),"component_up_screening_hits":len(up),"component_up_screening_samples":up[:15],"known_independent_qa_up_evidence_risk_records":105,"note":"Nested-path screen is not a replication of CG-QA's 105-row diagnostic; absence of matches does not clear the concern. No candidate was modified or formally certified.","formal_ready":0,"release_allowed":False}
if __name__=="__main__":
 try: print(json.dumps(run(pathlib.Path(sys.argv[1])),ensure_ascii=False,indent=2))
 except (OSError,AssertionError,IndexError,ValueError,KeyError) as e:
  print(json.dumps({"status":"FAIL_CLOSED","error":str(e)}),file=sys.stderr);sys.exit(2)
