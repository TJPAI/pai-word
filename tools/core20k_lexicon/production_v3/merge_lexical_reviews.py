#!/usr/bin/env python3
"""Merge 12 editorial draft batches without modifying any source or Runtime Pack."""
import json,pathlib
B=pathlib.Path(__file__).resolve().parent
tri={}
for line in (B/"ku_gloss_triage.jsonl").read_text(encoding="utf8").splitlines():
 if not line.strip():continue
 x=json.loads(line)
 if x.get("category")=="meaning_review":tri[x["teaching_sense_id"]]=x
out={};count=0;resolved=0
for i in range(1,13):
 p=B/f"lexical_review_{i:03d}.jsonl"
 for line in p.read_text(encoding="utf8").splitlines():
  if not line.strip():continue
  row=json.loads(line);count+=1
  sid=row["teaching_sense_id"]
  if sid not in tri or sid in out:raise ValueError(f"Missing/duplicate or out-of-scope Sense ID: {sid}")
  en=row.get("definition_en")
  if not en:
   vals=tri[sid].get("english_values",[])
   if len(vals)!=1:raise ValueError(f"Ambiguous English definition: {sid}")
   en=vals[0];resolved+=1
  elif en not in tri[sid].get("english_values",[]):raise ValueError(f"Source English definition mismatch {sid}")
  if not row.get("recommended_gloss_zh") or row.get("apply_to_runtime") is not False:raise ValueError(f"Invalid draft {sid}")
  out[sid]={"teaching_sense_id":sid,"lemma":row["lemma"],"definition_en":en,"recommended_gloss_zh":row["recommended_gloss_zh"],"review_status":"editorial_proposal","release_eligible":False,"source_review_batch":i}
if count!=539 or len(out)!=539 or set(out)!=set(tri):raise ValueError("Incomplete review set")
(B/"lexical_review_overlay_v1.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False,separators=(",",":"))+"\n" for x in out.values()),encoding="utf8")
summary={"reviewed_records":count,"unique_sense_ids":len(out),"unreviewed_ids":len(set(tri)-set(out)),"legacy_missing_english_recovered":resolved,"release_eligible":False}
(B/"lexical_review_overlay_v1_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(summary))
