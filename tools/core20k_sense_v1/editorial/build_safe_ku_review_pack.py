#!/usr/bin/env python3
"""Build actual, safe CG-ENTEACH review pack. Exclude quarantined misbound KUs."""
import json,pathlib,collections
root=pathlib.Path("tools/core20k_sense_v1/editorial")
files=["v21_first6_supplemental_ku.jsonl","v21_next6_ku_content.jsonl"]
rows=[json.loads(line) for f in files for line in (root/f).open(encoding="utf8")]
valid=[];blocked=[]
for item in rows:
 reasons=[]
 if item.get("review_status","").startswith("BLOCKED"):reasons.append("explicit_binding_block")
 if item.get("lemma")=="make" and item.get("correct_answer",item.get("answer",""))=="does":
  reasons.append("target_lemma_not_answer")
 if not item.get("sense_id") or not item.get("headword_id"):reasons.append("missing_identity")
 if item.get("release_eligible") is not False or item.get("production_ready") is not False:
  reasons.append("unsafe_release_status")
 if reasons:blocked.append({"ku_id":item["ku_id"],"reasons":reasons})
 else:
  assert item["question"].count("___")==1
  item["release_eligible"]=False;item["production_ready"]=False
  item["review_status"]="LINGUISTIC_AND_ASSESSMENT_QA_PENDING"
  valid.append(item)
assert len(rows)==12 and len(valid)==11 and len(blocked)==1
assert len({i["ku_id"] for i in valid})==len(valid)
out=root/"v21_enteach_valid_review_pack.jsonl"
out.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in valid),encoding="utf8")
report={"source_drafts":len(rows),"safe_review_pack_drafts":len(valid),"quarantined":blocked,"certified_ku":0,"released_ku":0,"note":"Schema/semantic-rule gating only; no independent linguistic certification."}
(root/"v21_enteach_valid_review_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("V21_ENTEACH_REVIEW_PACK_PASS",json.dumps(report,ensure_ascii=False))
