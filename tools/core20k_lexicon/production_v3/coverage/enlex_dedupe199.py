#!/usr/bin/env python3
import json,pathlib,collections
root=pathlib.Path("tools/core20k_lexicon/production_v3/coverage")
old=set()
for f in sorted(root.glob("omw_single_lexeme_editorial_[0-9][0-9][0-9].jsonl")):
 for s in f.read_text(encoding="utf8").splitlines():
  ident=json.loads(s)["teaching_sense_id"]
  assert ident not in old,(f,ident)
  old.add(ident)
src=pathlib.Path("/tmp/firstpass/editorial_firstpass_199.jsonl")
rows=[json.loads(s) for s in src.read_text(encoding="utf8").splitlines()]
assert len(rows)==199 and len(set(x["teaching_sense_id"] for x in rows))==199
fresh=[x for x in rows if x["teaching_sense_id"] not in old]
out=root/"omw_editorial_007_output"
out.mkdir(parents=True,exist_ok=True)
(out/"new_unique_decisions.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+chr(10) for x in fresh),encoding="utf8")
report={"source_decisions":199,"previous_unique":len(old),"overlap":199-len(fresh),"genuinely_new":len(fresh),"certified":0,"production_ready":0,"status":"ARTIFACT_ONLY_PENDING_COMMIT"}
(out/"manifest.json").write_text(json.dumps(report,indent=2),encoding="utf8")
print(report)
