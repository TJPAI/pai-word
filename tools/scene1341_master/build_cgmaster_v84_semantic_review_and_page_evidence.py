#!/usr/bin/env python3
"""Build reproducible, non-authorizing Kaikki->Master candidate semantic dossiers.

A single dictionary candidate is an unselected candidate, NEVER verified Chinese Sense.
Kaikki examples are citations/examples, NOT verified teaching examples/translations.
No mutation to source Master, 1341 pages or learning runtime.
"""
from collections import Counter, defaultdict
from pathlib import Path
import csv, gzip, hashlib, json

P=Path('/mnt/data'); OUT=P/'v84';OUT.mkdir(exist_ok=True)
V83=P/'v83'; FINAL=P/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv'
EXPECTED='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for buf in iter(lambda:f.read(1<<20),b''):h.update(buf)
 return h.hexdigest()
assert sha(FINAL)==EXPECTED
inpaths={
 'crosswalk':V83/'CGMASTER_V83_FINAL230289_KAIKKI_EVIDENCE_CROSSWALK.jsonl.gz',
 'library':V83/'CGMASTER_V83_KAIKKI_EXACT_HEADWORD_CANDIDATE_SENSE_LIBRARY.jsonl.gz',
 'p0poly':V83/'CGMASTER_V83_PRIORITY_3000_POLYSEMY_SENSE_REVIEW.jsonl',
}
v83report=json.loads((V83/'CGMASTER_V83_FULL1341_KAIKKI_EVIDENCE_REPORT.json').read_text())
assert sha(inpaths['crosswalk'])==v83report['file_sha256']['row_crosswalk']
assert sha(inpaths['library'])==v83report['file_sha256']['candidate_sense_library']
assert sha(inpaths['p0poly'])==json.loads((V83/'CGMASTER_V83_PRIORITY_QUEUES_REPORT.json').read_text())['files'][inpaths['p0poly'].name]['sha256']
lex={}
with gzip.open(inpaths['library'],'rt',encoding='utf8') as f:
 for line in f:
  x=json.loads(line);lex[x['lookup_key']]=x
with inpaths['p0poly'].open(encoding='utf8') as f:priority={json.loads(line)['lookup_key'] for line in f}
assert len(priority)==3000
# Preserve source row record and all distinct contextual Chinese glosses; no global Sense collapse.
P0=defaultdict(list); single_rows=0; source_example_rows=0; example_count=0; full_candidates=0; hits=[]
single_out=OUT/'CGMASTER_V84_SINGLE_FULL_CANDIDATE_SOURCE_BACKED_PAGE_EVIDENCE.jsonl.gz'
with gzip.open(inpaths['crosswalk'],'rt',encoding='utf8') as f, gzip.open(single_out,'wt',encoding='utf8',compresslevel=6) as wf:
 for line in f:
  x=json.loads(line);key=x['kaikki_lookup_key']; q=lex.get(key)
  if key in priority:P0[key].append({'source_row':x['final_source_row'],'scene_id':x['scene_id'],'expression':x['expression'],'original_sense_zh':x['original_sense_zh'],'candidate_lexical_key_NOT_SENSE_ID':x['lexical_candidate_key_NOT_SENSE_ID']})
  if x['kaikki_evidence_status']!='EXACT_HEADWORD_FULL_SENSE_CANDIDATES_UNSELECTED' or x['kaikki_candidate_sense_count']!=1:continue
  assert q and q['status']=='FULL_EXACT_HEADWORD' and len(q['candidate_senses'])==1
  s=q['candidate_senses'][0];single_rows+=1
  examples=s['examples'];source_example_rows+=bool(examples);example_count+=len(examples)
  # Do not assert semantic alignment from headword or a sole dictionary candidate.
  o={
   'final_source_row':x['final_source_row'],'scene_id':x['scene_id'],'original_expression':x['expression'],
   'original_master_sense_zh_unverified':x['original_sense_zh'],'lexical_candidate_key_NOT_SENSE_ID':x['lexical_candidate_key_NOT_SENSE_ID'],
   'candidate_sense_count':1,'candidate_selection_status':'SINGLE_KAIKKI_HEADWORD_CANDIDATE_SEMANTIC_ALIGNMENT_PENDING',
   'question_page':{'expression':x['expression'],'ipa':None,'ipa_status':'SOURCE_BUNDLES_HAVE_NO_NATIVE_IPA','audio_url':None,'canonical_sense_id':None},
   'answer_page_evidence_only':{'original_master_zh_unverified':x['original_sense_zh'],'kaikki_candidate_pos':s['pos'],'kaikki_english_glosses':s['glosses'],'kaikki_example_candidates_en':examples,'example_zh':None,'collocations':[],'usage_note':None},
   'sense_source':{'source_pack_sha256':s['source_pack_sha256'],'source_pack':s['source_pack'],'source_line':s['source_line'],'native_entry_sense_index_as_extracted':s['native_entry_sense_index_as_extracted']},
   'is_author_content':False,'independent_semantic_qa':'NOT_REVIEWED','formal_sense_id':None,'release_allowed':False}
  wf.write(json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n')
assert single_rows==11596
poly_out=OUT/'CGMASTER_V84_POLYSEMY_P0_3000_FULL_SENSE_ADJUDICATION_DOSSIERS.jsonl.gz'
poly_stats=Counter();multi_rows=0;different_original_zh=0;with_kexample=0;all_candidates=0
with gzip.open(poly_out,'wt',encoding='utf8',compresslevel=6) as wf:
 for key in sorted(priority):
  q=lex.get(key);assert q and q['status']=='FULL_EXACT_HEADWORD' and len(q['candidate_senses'])>1,key
  rows=P0.get(key,[]);assert rows,key
  glosses=sorted({x['original_sense_zh'] for x in rows});multi_rows+=len(rows);different_original_zh+=len(glosses)>1
  candidates=q['candidate_senses'];all_candidates+=len(candidates);with_kexample+=any(x['examples'] for x in candidates)
  choices=[]
  for idx,s in enumerate(candidates):
   choices.append({'review_candidate_local_index_NOT_SENSE_ID':idx,'pos':s['pos'],'english_glosses':s['glosses'],'raw_glosses':s['raw_glosses'],'tags':s['tags'],'english_examples_source_candidates':s['examples'], 'source_pack':s['source_pack'],'source_pack_sha256':s['source_pack_sha256'],'source_line':s['source_line'],'native_entry_sense_index_as_extracted':s['native_entry_sense_index_as_extracted']})
  o={'lookup_key':key,'original_master_rows':rows,'master_original_zh_variants':glosses,'scene_count':len({x['scene_id'] for x in rows}),'candidate_senses':choices,
     'review_slots':{'selected_local_candidate_indices':None,'target_master_zh_variant':None,'meaning_alignment_notes':None,'expression_is_compositional_no_single_kaikki_sense':None,'reviewer':None,'reviewed_version':None},
     'candidate_status':'POLYSEMY_SOURCE_DOSSIER_AWAITING_MEANING_ADJUDICATION','authorized_scene1341_sense_id':None,'release_allowed':False}
  wf.write(json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n')
report={'version':'CGMASTER-V84-20261114','authority':{'master_final_sha256':EXPECTED,'source_v83_sha256':{k:sha(p) for k,p in inpaths.items()}},
 'scope':{'all_master_source_records_reused':230289,'p0_polysemy_unique_expressions':3000,'p0_polysemy_original_records':multi_rows,'p0_polysemy_native_candidate_senses':all_candidates,'p0_expressions_multi_master_original_zh':different_original_zh,'p0_expressions_with_kexample_candidates':with_kexample,
 'single_full_candidate_master_rows':single_rows,'single_full_candidate_rows_with_kaikki_example_candidates':source_example_rows,'single_full_candidate_source_example_snippets':example_count},
 'interpretation':'All evidence sourced and pinned from 21 V83 snapshots. Single headword candidate is NOT semantic approval. The candidate English example is NOT an approved bilingual teaching example; example_zh is absent. Polysemy dossiers provide all native candidate senses for the first 3000 priority expressions. No auto-selected Sense IDs/IPA/QAs.','output_files':{},'canonical_sense_ids_authorized':0,'qa_pass':0,'release_allowed':False}
for p in [single_out,poly_out]:report['output_files'][p.name]={'sha256':sha(p),'bytes':p.stat().st_size}
(OUT/'CGMASTER_V84_SOURCE_BACKED_PAGES_AND_POLYSEMY_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False,indent=2))
