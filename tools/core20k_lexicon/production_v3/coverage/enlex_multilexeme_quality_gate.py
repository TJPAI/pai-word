#!/usr/bin/env python3
"""Fail-closed gate for multilexeme editorial first-pass records.
Explicitly separate traceable proposed glosses from unsupported KEEP dispositions.
Input: user-provided multilexeme first-pass JSONL, never Runtime.
"""
import argparse,collections,hashlib,json,pathlib
def main():
 p=argparse.ArgumentParser();p.add_argument("--input",required=True);p.add_argument("--out",required=True);a=p.parse_args()
 b=pathlib.Path(a.input).read_bytes()
 rows=[json.loads(x) for x in b.splitlines() if x.strip()]
 ids=[r["teaching_sense_id"] for r in rows]
 assert len(ids)==len(set(ids)) and len(rows)==201
 stats=collections.Counter();qa=[]
 for r in rows:
  flags=[]
  if r["editorial_reason_zh"].startswith("按当前英文定义逐义项选择或修订"):flags.append("GENERIC_REASON")
  if r["editorial_disposition"]=="KEEP_CANDIDATE" and r["gloss_zh_revised_candidate"] not in r["original_chinese_lexicalizations"]:flags.append("KEEP_WITHOUT_SOURCE_EXACT_MATCH")
  if not r["gloss_zh_revised_candidate"]:flags.append("NO_GLOSS")
  stats.update(flags)
  qa.append({"teaching_sense_id":r["teaching_sense_id"],"flags":flags,"publish_gate":"HOLD","certified":False})
 out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
 q=out/"quality_flags.jsonl"
 q.write_text("".join(json.dumps(r,ensure_ascii=False)+chr(10) for r in qa),encoding="utf8")
 report={"rows":len(rows),"unique_ids":len(set(ids)),"source_sha256":hashlib.sha256(b).hexdigest(),"flag_counts":dict(stats),"qa_sha256":hashlib.sha256(q.read_bytes()).hexdigest(),"production_ready":0}
 (out/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
 print(json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()
