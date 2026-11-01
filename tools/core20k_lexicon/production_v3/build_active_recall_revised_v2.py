#!/usr/bin/env python3
"""Apply approved mechanical gloss fixes into an isolated V2 overlay, never change V1 or runtime."""
import pathlib,json,hashlib,collections
B=pathlib.Path(__file__).resolve().parent
D=B/"ku_drafts"/"v3_active_recall"
P=B/"qa_reports"/"active_recall_patch_v1"
O=B/"qa_reports"/"active_recall_revised_v2";O.mkdir(parents=True,exist_ok=True)
patch_file=P/"safe_format_patches.jsonl"
assert hashlib.sha256(patch_file.read_bytes()).hexdigest()=="8e576ae04141f228ceadcc59fe872b6255694698de15956fd0eb0c05ddd2076f"
patches={}
for line in patch_file.open(encoding="utf8"):
 x=json.loads(line);k=x["ku_id"];assert k not in patches;patches[k]=x
assert len(patches)==862
seen=set();modified=[];total=0
for f in sorted(D.glob("active_recall_*.jsonl")):
 for line in f.open(encoding="utf8"):
  x=json.loads(line);total+=1;k=x["ku_id"]
  if k not in patches:continue
  p=patches[k];assert x["gloss_zh"]==p["old_gloss_zh"]
  y=dict(x);y.update(p["field_updates"])
  assert "+" not in y["gloss_zh"] and y["gloss_zh"] in y["question"]
  assert y["response"]==x["response"] and y["teaching_sense_id"]==x["teaching_sense_id"]
  assert y["answer_variants"]==x["answer_variants"] and y["ku_id"]==k
  assert y["production_ready"] is False and y["release_eligible"] is False
  assert k not in seen;seen.add(k);modified.append(y)
assert total==27471 and len(modified)==862 and seen==set(patches)
with (O/"revised_records.jsonl").open("w",encoding="utf8") as out:
 for x in modified:out.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"baseline_total":27471,"revised_overlay_records":862,"unchanged_records":26609,"revised_effective_total":27471,"unique_revised_ku_ids":len(seen),"corrected_gloss_plus":862,"remaining_plus_in_revised":0,"answer_identity_preserved":True,"missing_pos_pending":203,"ambiguous_gloss_pos_groups_pending":2238,"overlay_only":True,"runtime_modified":False,"source_modified":False,"overlay_sha256":hashlib.sha256((O/"revised_records.jsonl").read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("REVISED_OVERLAY_OK",json.dumps(summary,ensure_ascii=False))
