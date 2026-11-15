#!/usr/bin/env python3
"""Export frozen Scene1341 FINAL Master to per-scene L1 test-only cards.

Usage: python tools/scene1341_master/build_v247_full1341_from_final.py \
  /path/to/PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv \
  /path/to/output_directory
The source is NOT stored in GitHub; original Drive file ID is pinned below.
This only proves source-row provenance, not unique global Sense IDs or CG-QA.
"""
import csv,hashlib,json,pathlib,sys,collections
SOURCE_SHA="62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986"
DRIVE_ID="1bT_STgfNsJQA5v5x-8bP4T4DH9_eLNaF"
assert len(sys.argv)==3,"expected: frozen_master.csv output_directory"
src=pathlib.Path(sys.argv[1]); dest=pathlib.Path(sys.argv[2])
assert src.is_file()
assert hashlib.file_digest(src.open("rb"),"sha256").hexdigest()==SOURCE_SHA,"wrong source version"
dest.mkdir(parents=True,exist_ok=True)
manifest={"schema":"cgmaster-v247-full1341-source-preview-manifest/v1","version":"V247_SOURCE_VERIFIED_L1_TEST","source_file_name":src.name,"source_drive_file_id":DRIVE_ID,"source_sha256":SOURCE_SHA,"scene_count":0,"source_records":0,"rows_with_missing_chinese_meaning":0,"canonical_sense_ids_assigned":0,"qa_stage":"待审","release_allowed":False,"formal_srs_allowed":False,"by_scene":{}}
def emit(sid,name,records):
 if not records:return
 item={"version":"V247_SOURCE_VERIFIED_L1_TEST","scene_id":sid,"scene_name":name,"record_count":len(records),"source_master_sha256":SOURCE_SHA,"qa_stage":"待审","release_allowed":False,"canonical_sense_ids_assigned":False,"records":records}
 filename=f"CGMASTER_V247_{sid}_L1_TEST_PAGES.json"
 (dest/filename).write_text(json.dumps(item,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
 manifest["by_scene"][sid]={"records":len(records),"first_source_row":records[0]["source_final_row"],"last_source_row":records[-1]["source_final_row"],"file":filename}
 manifest["scene_count"]+=1
sid=name=None; buf=[]
with src.open(encoding="utf-8-sig",newline="") as fp:
 for rownum,x in enumerate(csv.DictReader(fp),1):
  if sid and x["scene_id"]!=sid:
   emit(sid,name,buf);buf=[]
  sid=x["scene_id"];name=x["scene_name"]
  meaning=(x["sense_zh"] or "").strip()
  if not meaning:manifest["rows_with_missing_chinese_meaning"]+=1
  buf.append({"source_final_row":rownum,"record_id":None,"scene_id":sid,
   "question_page":{"expression":x["english_expression"],"ipa_candidate":None,"ipa_approved":False,"qa_label":"待审"},
   "answer_page":{"expression":x["english_expression"],"meaning_zh":meaning or None,"gloss_en":None,"examples":[],"collocations":[],"usage_note":None,"qa_label":"待审"},
   "source":{"source_line":x["source_line"],"source_filename":x["source_filename"],"source_drive_id":x["source_drive_id"],"source_version":x["source_version"],"source_row_number":x["source_row_number"],"verification_status":x["verification_status"],"entry_type_candidate":x["entry_type"] or None,"dimension_candidate":x["dimension"] or None,"rank_as_supplied":x["rank"] or None,"raw_source_metadata_json":x["raw_source_metadata_json"]},
   "coverage_level":"L1_FROZEN_FINAL_SOURCE_ONLY","complete":False,"release_allowed":False})
  manifest["source_records"]+=1
emit(sid,name,buf)
assert manifest["scene_count"]==1341,manifest["scene_count"]
assert manifest["source_records"]==230289,manifest["source_records"]
assert manifest["rows_with_missing_chinese_meaning"]==222
(dest/"CGMASTER_V247_MANIFEST.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({k:manifest[k] for k in ("version","scene_count","source_records","rows_with_missing_chinese_meaning","qa_stage","release_allowed")},ensure_ascii=False))
