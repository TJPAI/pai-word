#!/usr/bin/env python3
"""Independent V90 cardinality, identity, source and release-state verification."""
from pathlib import Path
import gzip,json,hashlib,csv,collections
P=Path('/mnt/data');O=P/'v90';rep=json.loads((O/'CGMASTER_V90_V13_ONLY_PAGE_PRODUCTION_REPORT.json').read_text())
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
V=P/'PAI_Word_Scene1341_ReviewedMaster_WORKING_V13_20261112.csv.gz.csv';assert sha(V)==rep['input_sha256']['v13']
v={}
with gzip.open(V,'rt',encoding='utf-8-sig',newline='') as f:
 for r in csv.DictReader(f):v[int(r['audit_row_no'])]=r
ids=set();classes=collections.Counter();evid=collections.Counter();error=[]
with gzip.open(O/'CGMASTER_V90_3140_V13_ONLY_SOURCE_PRESERVING_PAGE_FOUNDATIONS.jsonl.gz','rt',encoding='utf8') as f:
 for line in f:
  r=json.loads(line);i=r['v13_audit_row'];assert i not in ids;ids.add(i);a=v[i]
  assert (r['expression'],r['scene_id'],r['answer_page_draft']['meaning_zh_original_V13_unverified'])==(a['english_expression'],a['scene_id'],a['master_original_zh'])
  assert r['question_page_draft']['ipa'] is None and r['question_page_draft']['audio_url'] is None
  assert r['semantic_sense_selection'] is None and r['cg_qa'] is None and r['mu_qa'] is None
  assert not r['release_allowed'] and not r['complete_question_page'] and not r['complete_answer_page']
  for k in ['example_en','example_zh','collocations','usage_note','contrast_note']:assert r['answer_page_draft'][k] is None
  classes[r['lineage_class']]+=1;evid[r['source_evidence_level']]+=1
assert len(ids)==3140 and dict(classes)==rep['counts']['lineage'] and dict(evid)==rep['counts']['kaikki_evidence']
ids55=set()
with (O/'CGMASTER_V90_55_KAIKKI_FULL_CANDIDATE_TEACHING_EVIDENCE.jsonl').open(encoding='utf8') as f:
 for line in f:
  r=json.loads(line);i=r['v13_audit_row'];assert i in ids and i not in ids55 and r['candidate_senses'] and not r['release_allowed'];ids55.add(i)
assert len(ids55)==55
qids=set();first2799=0
with (O/'CGMASTER_V90_PRIORITY_3000_NEW_TEACHING_CONTENT_AUTHOR_TASKS.jsonl').open(encoding='utf8') as f:
 for line in f:
  r=json.loads(line);i=r['v13_audit_row'];assert i in ids and i not in qids and not r['release_allowed'];qids.add(i)
  first2799+=r['lineage_class']=='NOT_IN_ORIGINAL_FINAL_ENGLISH_EXPRESSION_INDEX'
assert len(qids)==3000 and first2799==2799
for n,info in rep['files'].items():assert sha(O/n)==info['sha256']
qa={'version':'V90-QA','status':'PASS_STRUCTURAL_ONLY','v13_source_sha_verified':True,'3140_unique_v13_rows_exactly_match_source':True,'all_2799_new_expression_rows_in_priority_3000':True,'55_full_kaikki_candidate_evidence_rows':55,'complete_cards':0,'canonical_sense_ids':0,'release_allowed':False,'errors':error}
(O/'CGMASTER_V90_INDEPENDENT_STRUCTURAL_QA.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(qa,ensure_ascii=False,indent=2))
