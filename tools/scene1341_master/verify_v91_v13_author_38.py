#!/usr/bin/env python3
"""Independent V13/V90 source-identity and coverage validation for V91's 38 V82 author records.
This does not independently read the GitHub V91 content payload; the author fields have been
verified by the V82 Github connector. Independent V13 to V90 row values are verified here.
"""
import csv,gzip,hashlib,json
from pathlib import Path
P=Path('/mnt/data'); OUT=P/'v91'
ids=[231,232,233,234,406,407,408,609,610,611,612,636,818,819,820,821,853,1043,1044,1045,1065,1066,1234,1235,1449,1450,1451,1452,1472,1639,1640,1837,1838,1839,1856,2036,2037,2038]
v13=P/'PAI_Word_Scene1341_ReviewedMaster_WORKING_V13_20261112.csv.gz.csv';v90=P/'v90/CGMASTER_V90_3140_V13_ONLY_SOURCE_PRESERVING_PAGE_FOUNDATIONS.jsonl.gz'
sha=lambda p:hashlib.file_digest(p.open('rb'),'sha256').hexdigest()
assert sha(v13)=='568455645ff4d0ee6fba8177c45cf89d5f7f892ff8ecd7ad1897a9458c03aba6'
assert sha(v90)=='c50ae818460e8449414ceb500ddb21a3c4afafed1816ab7423c696a2ece5bce9'
a={}
with gzip.open(v13,'rt',encoding='utf-8-sig',newline='') as f:
 for row in csv.DictReader(f):
  n=int(row['audit_row_no'])
  if n<=2038:assert row['source_version']=='V51'
  if n in ids:a[n]=row
b={}
with gzip.open(v90,'rt',encoding='utf-8') as f:
 for line in f:
  row=json.loads(line);n=row['v13_audit_row']
  if n in ids:b[n]=row
assert len(set(ids))==len(ids)==38 and set(a)==set(b)==set(ids)
scenes={}
for n in ids:
 r=a[n];x=b[n]
 assert x['v13_candidate_id_NOT_SENSE_ID']==r['candidate_id']
 assert x['scene_id']==r['scene_id'] and x['expression']==r['english_expression']
 assert x['answer_page_draft']['meaning_zh_original_V13_unverified']==r['master_original_zh']
 assert not x['release_allowed'] and not x['complete_answer_page']
 scenes[r['scene_id']]=scenes.get(r['scene_id'],0)+1
report={'version':'V91','test':'V13_V90_INDEPENDENT_IDENTITY_CROSSCHECK_FOR_38_AUTHOR_KU','v13_sha256':sha(v13),'v90_sha256':sha(v90),'matched_38_ids':True,'v13_first2038_are_V51':True,'matched_exact_candidate_id_scene_english_zh':38,'distinct_scenes':len(scenes),'per_scene':scenes,'v82_author_fields_verified_via_GitHub_connector':True,'v82_author_fields_independently_checked_against_v13_by_this_script':False,'independent_semantic_qa':'NOT_REVIEWED','literal_ipa_verified':0,'release_allowed':False,'errors':[]}
p=OUT/'CGMASTER_V91_V13_V90_IDENTITY_38_INDEPENDENT_QA.json';p.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report,ensure_ascii=False,indent=2))
