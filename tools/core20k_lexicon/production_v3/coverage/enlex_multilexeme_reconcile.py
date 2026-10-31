#!/usr/bin/env python3
"""Reconcile multilexeme first-pass editorial candidates; never auto-certify.
Usage: python enlex_multilexeme_reconcile.py input.jsonl outdir
"""
import json,sys,pathlib,collections,hashlib
src=pathlib.Path(sys.argv[1]);dst=pathlib.Path(sys.argv[2]);dst.mkdir(parents=True,exist_ok=True)
a=[json.loads(s) for s in src.read_text(encoding="utf8").splitlines() if s.strip()]
assert len(a)==201 and len(set(r["teaching_sense_id"] for r in a))==201
result=[];stats=collections.Counter()
for r in a:
 y=r.copy();flags=[]
 if r["editorial_reason_zh"].startswith("按当前英文定义逐义项选择或修订"):flags.append("GENERIC_REASON")
 if r["editorial_disposition"]=="KEEP_CANDIDATE" and r["gloss_zh_revised_candidate"] not in r["original_chinese_lexicalizations"]:
  flags.append("KEEP_NOT_IN_SOURCE");y["editorial_disposition"]="REVISE_CANDIDATE_UNVERIFIED"
 if not r["gloss_zh_revised_candidate"]:flags.append("MISSING_SELECTED_GLOSS")
 y["original_editorial_disposition"]=r["editorial_disposition"]
 y["qa_flags"]=flags
 y["review_gate"]="HOLD_FOR_SENSE_SPECIFIC_EVIDENCE" if flags else "PENDING_INDEPENDENT_QA"
 y["independent_certified"]=False;y["production_ready"]=False
 stats.update(flags);stats[y["review_gate"]]+=1;result.append(y)
out=dst/"reconciled_201.jsonl"
out.write_text("".join(json.dumps(r,ensure_ascii=False)+chr(10) for r in result),encoding="utf8")
m={"rows":201,"source_sha256":hashlib.sha256(src.read_bytes()).hexdigest(),"output_sha256":hashlib.sha256(out.read_bytes()).hexdigest(),"flags":dict(stats),"certified":0,"production_ready":0}
(dst/"manifest.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+chr(10),encoding="utf8")
print(json.dumps(m,ensure_ascii=False))
