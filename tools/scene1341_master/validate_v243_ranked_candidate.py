#!/usr/bin/env python3
"""V243 V242 candidate integrity gate. Does not certify original FINAL Master lineage."""
import json, pathlib, collections, sys
ROOT=pathlib.Path(__file__).resolve().parent
D=ROOT/"qa_reports/v242_ranked_l1_candidate"
m=json.loads((D/"CGMASTER_V242_MANIFEST.json").read_text(encoding="utf-8"))
assert m["version"]=="V242_CANDIDATE" and m["scene_count"]==10
assert m["record_count"]==1730
assert m["canonical_record_id_verified"]==0 and m["release_allowed"] is False
seen_ids=set(); seen_source_rows=set(); original=editorial=0
by_scene={}
for num in range(101,111):
 sid=f"SC50-{num:04d}"
 p=D/f"CGMASTER_V242_{sid}_RANKED_L1_CANDIDATES.json"
 x=json.loads(p.read_text(encoding="utf-8"))
 a=x["records"]
 assert x["scene_id"]==sid and x["record_count"]==len(a)
 assert x["release_allowed"] is False and x["qa_stage"]=="待审"
 assert x["canonical_master_record_id_verified"] is False
 ranks=set()
 for r in a:
  q=r["question_page"];ans=r["answer_page"]
  assert r["scene_id"]==sid and r["record_id"] is None
  assert r["release_allowed"] is False and r["complete"] is False
  assert q["qa_label"]=="待审" and ans["qa_label"]=="待审"
  assert q["ipa_approved"] is False and q["ipa_candidate"] is None
  assert q["expression"] and ans["meaning_zh"]
  assert r["rank"] not in ranks
  ranks.add(r["rank"])
  rid=r["ranked_sense_id"]
  assert rid and rid not in seen_ids
  seen_ids.add(rid)
  if r["source_final_row"] is not None:
   assert r["source_identity_status"]=="ROW_POINTER_NEEDS_CANONICAL_ID_RELINK"
   assert r["source"]["type"]=="original_master"
   assert type(r["source_final_row"]) is int and r["source_final_row"]>0
   assert r["source_final_row"] not in seen_source_rows
   seen_source_rows.add(r["source_final_row"])
   original+=1
  else:
   assert r["source_identity_status"]=="EDITORIAL_ADDITION_NO_MASTER_ROW"
   assert r["source"]["type"]!="original_master"
   editorial+=1
 by_scene[sid]=len(a)
assert by_scene==m["by_scene"]
assert len(seen_ids)==1730 and original==1693 and editorial==37
assert original==m["source_original_master_row_pointers"]
assert editorial==m["editorial_additions_without_master_row"]
print(json.dumps({"status":"PASS_CANDIDATE_STRUCTURE_ONLY","scenes":len(by_scene),"records":len(seen_ids),"master_row_pointers_not_verified":original,"editorial_no_master_row":editorial,"canonical_verified":0,"qa":"待审","release_allowed":False},ensure_ascii=False))
