#!/usr/bin/env python3
"""Source-pinned lexical candidate retrieval from CG-MASTER original FINAL + existing audited Kaikki evidence.
No semantic adjudication, no automatic global Sense IDs, no certified page release.
"""
from __future__ import annotations
import csv,gzip,hashlib,json,re,unicodedata,collections,glob,os
from pathlib import Path

HOME=Path('/mnt/data'); OUT=HOME/'v83';OUT.mkdir(exist_ok=True)
FINAL=HOME/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv'
EXPECTED_MASTER_SHA='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986'
sha=lambda f: hashlib.sha256(f.read_bytes()).hexdigest()
assert sha(FINAL)==EXPECTED_MASTER_SHA,'FINAL source changed'
def norm(v):return ' '.join(unicodedata.normalize('NFKC',str(v or '')).casefold().strip().split())
def safe_examples(v):
 if not isinstance(v,list):return []
 return [str(x)[:600] for x in v[:2] if isinstance(x,str) and x.strip()]
source_files={}; full={}; c=collections.Counter(); schemas=collections.Counter(); overlap=collections.Counter()
# Group full dictionary candidates by actual word+POS+native sense index+gloss, without normalizing semantic sense identity.
paths=sorted(HOME.glob('PAI_Word_Scene1341_Kaikki_Batch*_FullSenseDictionary_*.jsonl.gz'))
assert len(paths)==18,f'Only {len(paths)} FullSenseDictionary packages; expected 18'
for p in paths:
 filehash=sha(p);source_files[p.name]={'sha256':filehash,'bytes':p.stat().st_size,'kind':'KAIKKI_FULL_SENSE_DICTIONARY'}
 with gzip.open(p,'rt',encoding='utf-8') as f:
  for line_no,line in enumerate(f,1):
   row=json.loads(line)
   key=norm(row.get('lookup_key') or row.get('evidence_key'))
   if not key:continue
   schemas['lookup_key' if row.get('lookup_key') else 'evidence_key']+=1
   if key not in full:full[key]={'items':{},'source_packs':set(),'headword_forms':set()}
   v=full[key];v['source_packs'].add(p.name)
   for e in row.get('entries') or []:
    w=e.get('word') or ''
    if norm(w)!=key: # Some lookups retrieve inflected headword; do not treat it as exact headword.
     c['nonexact_entry_word']+=1
     continue
    v['headword_forms'].add(w)
    pos=e.get('pos')
    for i,s in enumerate(e.get('senses') or [],1):
     gl=s.get('glosses') or []; raw=s.get('raw_glosses') or []
     if not gl and not raw:continue
     sense_index=s.get('sense_no',s.get('sense_number',i))
     identity=(norm(w),str(pos or ''),str(sense_index),tuple(gl))
     if identity in v['items']:
      overlap['duplicate_evidence_sense_in_multiple_packs']+=1
      continue
     v['items'][identity]={'word':w,'pos':pos,'native_entry_sense_index_as_extracted':sense_index,'glosses':gl,'raw_glosses':raw,'tags':s.get('tags') or [],'examples':safe_examples(s.get('examples')),'native_example_count_in_package':len(s.get('examples') or []),'source_pack':p.name,'source_line':line_no,'source_pack_sha256':filehash,'source_status':'EXACT_WORD_NATIVE_KAIKKI_CANDIDATES_NOT_SEMANTICALLY_SELECTED'}
   c['full_lookup_rows']+=1
# First 3 legacy exact lexical evidence packs contain truncated samples; use only for keys without full evidence.
partial={}
for p in sorted(HOME.glob('PAI_Word_Scene1341_Kaikki_Batch*_ExactLexicalEvidence_*.csv')):
 filehash=sha(p);source_files[p.name]={'sha256':filehash,'bytes':p.stat().st_size,'kind':'PARTIAL_EXACT_LEXICAL_EVIDENCE_SAMPLES'}
 with p.open('r',encoding='utf-8-sig',newline='') as f:
  for line_no,row in enumerate(csv.DictReader(f),2):
   key=norm(row.get('english_expression'))
   if not key or row.get('kaikki_exact_headword','').lower()!='true':continue
   if key in full:continue
   try:samples=json.loads(row.get('kaikki_gloss_samples') or '[]')
   except json.JSONDecodeError:samples=[]
   if key not in partial:partial[key]={'items':{},'source_packs':set()}
   v=partial[key];v['source_packs'].add(p.name)
   for i,s in enumerate(samples):
    gloss=s.get('gloss') or ''
    if not gloss:continue
    ident=(s.get('pos'),gloss)
    if ident in v['items']:continue
    v['items'][ident]={'pos':s.get('pos'),'gloss_sample_truncated_possible':gloss,'example_sample_truncated_possible':s.get('example') or None,'source_pack':p.name,'source_line':line_no,'source_pack_sha256':filehash,'source_status':'PARTIAL_EXACT_HEADWORD_SAMPLE_NOT_FULL_NATIVE_SENSE'}
   c['partial_matched_rows']+=1
# Build crosswalk on precisely ALL raw FINAL rows (not 200144 Reviewed Master candidate ordinals).
lexkeys=set();sceneids=set(); expression_keys=set();orig_groups=set(); count=collections.Counter();by_scene=collections.defaultdict(collections.Counter)
rowpath=OUT/'CGMASTER_V83_FINAL230289_KAIKKI_EVIDENCE_CROSSWALK.jsonl.gz'
with gzip.open(rowpath,'wt',encoding='utf8',compresslevel=6) as wf, FINAL.open('r',encoding='utf-8-sig',newline='') as ff:
 for rownum,row in enumerate(csv.DictReader(ff),1):
  en=norm(row['english_expression']); zh=norm(row['sense_zh']);scene=row['scene_id']; sceneids.add(scene);expression_keys.add(en);orig_groups.add((en,zh))
  key='SC1341-LEXC-'+hashlib.sha256((en+'\x00'+zh).encode()).hexdigest()[:32]
  lexkeys.add(en)
  if en in full and full[en]['items']:
   status='EXACT_HEADWORD_FULL_SENSE_CANDIDATES_UNSELECTED';v=full[en];num=len(v['items']);count['full_evidence_rows']+=1
  elif en in partial and partial[en]['items']:
   status='EXACT_HEADWORD_PARTIAL_SAMPLE_UNSELECTED';v=partial[en];num=len(v['items']);count['partial_evidence_rows']+=1
  else:status='NO_USABLE_SENSE_EVIDENCE_IN_21_PACKS';num=0;count['missing_evidence_rows']+=1
  if status.startswith('EXACT_HEADWORD_FULL') and num==1:count['single_full_candidate_rows']+=1
  if status.startswith('EXACT_HEADWORD_FULL') and num>1:count['multi_full_candidate_rows']+=1
  o={'final_source_row':rownum,'scene_id':scene,'expression':row['english_expression'],'original_sense_zh':row['sense_zh'],'lexical_candidate_key_NOT_SENSE_ID':key,'kaikki_lookup_key':en,'kaikki_evidence_status':status,'kaikki_candidate_sense_count':num,'source_record_locator':{'source_filename':row['source_filename'],'source_row_number':row['source_row_number']},'canonical_scene1341_sense_id':None,'selected_kaikki_sense_index':None,'question_page_certified':False,'answer_page_certified':False,'release_allowed':False}
  wf.write(json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n')
  by_scene[scene][status]+=1
  count['final_rows']+=1
assert count['final_rows']==230289
assert len(sceneids)==1341
assert len(expression_keys)==127609
assert len(orig_groups)==176006
# For all English expression keys actually used in FINAL, package all REAL Kaikki sense candidates, never choose one without semantic adjudication.
lexpath=OUT/'CGMASTER_V83_KAIKKI_EXACT_HEADWORD_CANDIDATE_SENSE_LIBRARY.jsonl.gz'
with gzip.open(lexpath,'wt',encoding='utf8',compresslevel=6) as f:
 for key in sorted(lexkeys):
  if key in full and full[key]['items']:
   v=full[key];sources=sorted(v['source_packs']);candidates=list(v['items'].values());status='FULL_EXACT_HEADWORD'
  elif key in partial and partial[key]['items']:
   v=partial[key];sources=sorted(v['source_packs']);candidates=list(v['items'].values());status='PARTIAL_TRUNCATED_SAMPLES_ONLY'
  else:continue
  o={'lookup_key':key,'status':status,'evidence_pack_names':sources,'candidate_sense_count':len(candidates),'candidate_senses':candidates,'scene1341_authorized_sense_ids':[],'not_semantically_adjudicated':True}
  f.write(json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n')
  count['expression_keys_with_evidence']+=1
  count['native_full_sense_candidates']+=len(candidates) if status=='FULL_EXACT_HEADWORD' else 0
  count['partial_sample_candidates']+=len(candidates) if status!='FULL_EXACT_HEADWORD' else 0
# Produce compact machine-readable source inventory and coverage report.
report={'version':'V83','date':'2026-11-14','data_type':'SOURCE_GROUNDED_KAIKKI_FULL_SENSE_RETRIEVAL_NOT_SEMANTIC_SENSE_SELECTION','master':{'sha256':EXPECTED_MASTER_SHA,'raw_rows':230289,'scenes':1341,'expression_keys':127609,'expression_plus_gloss_candidate_keys':176006},'source_pack_count':len(source_files),'full_dictionary_pack_count':len(paths),'partial_evidence_pack_count':sum('ExactLexicalEvidence' in x for x in source_files),'source_files':source_files,'counts':dict(count),'note':'Exact English headword matching is NOT semantic Sense alignment. Full dictionary bundles may be incomplete (no single 531 MB original source version verified), first three batch CSV contain partial/truncated gloss samples. All 230289 FINAL rows covered; NOT a crosswalk to 200144 Reviewed V13 rows. No native IPA strings in these bundled evidence formats; no automatic Chinese translation or valid scene-specific example approval; zero formal Sense IDs/QA certification.', 'file_sha256':{'row_crosswalk':sha(rowpath),'candidate_sense_library':sha(lexpath)},'output_bytes':{'row_crosswalk':rowpath.stat().st_size,'candidate_sense_library':lexpath.stat().st_size},'semantic_sense_ids_authorized':0,'question_full_certified':0,'answer_full_certified':0,'release_allowed':False}
reportpath=OUT/'CGMASTER_V83_FULL1341_KAIKKI_EVIDENCE_REPORT.json';reportpath.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'version':'V83','counts':report['counts'],'file_sha256':report['file_sha256'],'output_bytes':report['output_bytes'],'pack_counts':(len(paths),report['partial_evidence_pack_count']),'report_sha256':sha(reportpath),'overlap':dict(overlap)},ensure_ascii=False,indent=2))
