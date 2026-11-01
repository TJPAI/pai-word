import json,pathlib
P=pathlib.Path(__file__).resolve().parent/"teaching_qa/full_recognition_audit"
def load(path):
 return [json.loads(line) for line in (P/path).read_text().splitlines() if line.strip()]
base=load("isolated_patch_v1/recognition_patch_candidates_117.jsonl")
updates=load("isolated_patch_v3/targeted_29.jsonl")
by_id={x["ku_id"]:x for x in updates}
assert len(base)==117 and len(by_id)==29
output=[]
for item in base:
 update=by_id.get(item["ku_id"])
 choice=dict(item["candidate_changes"])
 if update:
  assert (update["source"],update["source_line"],update["answer"])==(item["source"],item["source_line"],item["original"]["response"])
  choice={"options":update["candidate_options"],"gloss_en":update["candidate_definition"]}
 opts=choice["options"]
 if opts:
  assert len(opts)==len({v.lower() for v in opts})==4
  assert opts.index(item["original"]["response"])==item["original"]["options"].index(item["original"]["response"])
 hold=item["review_number"] in (31,64)
 if hold:assert opts is None and choice["gloss_en"] is None
 output.append({"review_number":item["review_number"],"ku_id":item["ku_id"],"source":item["source"],"source_line":item["source_line"],"original":item["original"],"candidate":choice,"review_state":"SOURCE_HOLD" if hold else "SEMANTIC_REVIEW_PENDING","updated_in_v3":bool(update),"approved":False})
assert len({v["ku_id"] for v in output})==117
dest=P/"isolated_patch_latest";dest.mkdir(exist_ok=True)
(dest/"latest_117.jsonl").write_text("".join(json.dumps(v,ensure_ascii=False)+"\n" for v in output))
summary={"records":117,"v3_records":29,"v3_substantive_rewrites":27,"source_holds":2,"approved":0,"source_changed":False,"runtime_changed":False}
(dest/"summary.json").write_text(json.dumps(summary,indent=2)+"\n")
print(json.dumps(summary))
