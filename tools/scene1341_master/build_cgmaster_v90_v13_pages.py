#!/usr/bin/env python3
"""V90: Source-preserving Reviewed V13-only teaching-page foundations. No invented bilingual examples, IPA or semantic decisions."""
from pathlib import Path
from collections import Counter,defaultdict
import gzip,json,hashlib,csv,unicodedata
P=Path('/mnt/data');O=P/'v90';O.mkdir(exist_ok=True)
I=P/'v89/CGMASTER_V89_3140_V13_ONLY_GLOBAL_LINEAGE_AND_KAIKKI_CANDIDATES.jsonl.gz'
V=P/'PAI_Word_Scene1341_ReviewedMaster_WORKING_V13_20261112.csv.gz.csv'
expected={'v89':'d7e47b0371d22a783e886ecd37df39d3aae62a75b18ffcb37cf6be5bfa49e947','v13':'568455645ff4d0ee6fba8177c45cf89d5f7f892ff8ecd7ad1897a9458c03aba6'}
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
for n,p in [('v89',I),('v13',V)]:assert sha(p)==expected[n]
v13={}
with gzip.open(V,'rt',encoding='utf-8-sig',newline='') as f:
 for row in csv.DictReader(f): v13[int(row['audit_row_no'])]=row
assert len(v13)==200144
counts=Counter();scenes=set();candidate_counts=Counter();missing_fields=Counter();packs=set();out=O/'CGMASTER_V90_3140_V13_ONLY_SOURCE_PRESERVING_PAGE_FOUNDATIONS.jsonl.gz';rows=[]
with gzip.open(I,'rt',encoding='utf8') as f,gzip.open(out,'wt',encoding='utf8',compresslevel=6) as w:
 for line in f:
  src=json.loads(line);r=v13[src['v13_audit_row']]
  assert r['candidate_id']==src['v13_candidate_id_NOT_SENSE_ID'] and r['scene_id']==src['scene_id'] and r['english_expression']==src['expression'] and r['master_original_zh']==src['v13_original_zh']
  ev=src['kaikki_candidates'];status=src['kaikki_evidence_status']; counts[status]+=1;counts[src['source_lineage_class']]+=1;scenes.add(r['scene_id']);candidate_counts[len(ev)]+=1
  answer={'meaning_zh_original_V13_unverified':r['master_original_zh'],'meaning_zh_working_V13_unverified':r['working_zh'],'kaikki_english_gloss_candidates_unselected':[{'pos':a['pos'],'glosses_en':a['english_glosses'],'native_index':a['native_sense_index'],'local_index_NOT_SENSE_ID':a['local_index_NOT_SENSE_ID'],'source_pack_sha256':a['source_pack_sha256'],'source_line':a['source_line']} for a in ev], 'example_en':None,'example_zh':None,'collocations':None,'usage_note':None,'contrast_note':None}
  o={'v13_audit_row':src['v13_audit_row'],'v13_candidate_id_NOT_SENSE_ID':r['candidate_id'],'scene_id':r['scene_id'],'scene_name':r['scene_name'],'source_version':r['source_version'],'source_original_file':r['original_file'],'source_original_row':r['original_file_row'],'source_v13_sha256':expected['v13'],'v89_source_evidence_sha256':expected['v89'],'expression':r['english_expression'],'lineage_class':src['source_lineage_class'],'same_headword_other_scene_count':src['source_evidence_other_scene_count'],'source_evidence_level':status,'kaikki_candidate_sense_count':len(ev),'question_page_draft':{'expression':r['english_expression'],'ipa':None,'ipa_status':'NOT_VERIFIED_FROM_EXACT_KAIKKI_PRONUNCIATION','audio_url':None,'canonical_sense_id':None},'answer_page_draft':answer,'author_content_status':'SOURCE_MASTER_GLOSS_ONLY_NOT_AUTHOR_ENRICHED','semantic_sense_selection':None,'sense_scene_alignment_qa':None,'cg_qa':None,'mu_qa':None,'complete_question_page':False,'complete_answer_page':False,'release_allowed':False}
  w.write(json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n');rows.append(o)
  for k in ['example_en','example_zh','collocations','usage_note','contrast_note']:missing_fields[k]+=o['answer_page_draft'][k] is None
assert len(rows)==3140 and len({x['v13_audit_row'] for x in rows})==3140
# 55 source-bundled Kaikki exact headword candidates: expose as editorial work packet, never select sense.
lex=O/'CGMASTER_V90_55_KAIKKI_FULL_CANDIDATE_TEACHING_EVIDENCE.jsonl'
with lex.open('w',encoding='utf8') as w:
 for r in rows:
  if r['source_evidence_level']!='FULL_EXACT_HEADWORD':continue
  w.write(json.dumps({'v13_audit_row':r['v13_audit_row'],'scene_id':r['scene_id'],'expression':r['expression'],'master_zh':r['answer_page_draft']['meaning_zh_original_V13_unverified'],'candidate_senses':r['answer_page_draft']['kaikki_english_gloss_candidates_unselected'],'teaching_author_task':'AUTHOR_EN_EXAMPLE_ZH_TRANSLATION_COLLOCATION_USAGE_CONTRAST_CONTEXT_AND_IPA_AFTER_SEMANTIC_QA','selected_native_sense':None,'release_allowed':False},ensure_ascii=False,separators=(',',':'))+'\n')
# 3k priority production cards: all 2799 unseen expressions, + 201 other-scene expressions; preserve V13 authority.
priority=sorted(rows,key=lambda x:(0 if x['lineage_class']=='NOT_IN_ORIGINAL_FINAL_ENGLISH_EXPRESSION_INDEX' else 1,0 if x['source_evidence_level']=='FULL_EXACT_HEADWORD' else 1,x['v13_audit_row']))[:3000]
queue=O/'CGMASTER_V90_PRIORITY_3000_NEW_TEACHING_CONTENT_AUTHOR_TASKS.jsonl'
with queue.open('w',encoding='utf8') as w:
 for i,r in enumerate(priority,1):
  w.write(json.dumps({'batch_rank':i,'v13_audit_row':r['v13_audit_row'],'scene_id':r['scene_id'],'scene_name':r['scene_name'],'expression':r['expression'],'v13_zh':r['answer_page_draft']['meaning_zh_original_V13_unverified'],'lineage_class':r['lineage_class'],'kaikki_evidence_status':r['source_evidence_level'],'required_fields':['semantic_scene_sense_decision','ipa_exact_kaikki_source','example_en','example_zh','collocations','usage_note','contrast_note','independent_CG_QA','independent_MU_QA'],'release_allowed':False},ensure_ascii=False,separators=(',',':'))+'\n')
rep={'version':'V90','data_type':'V13_SOURCE_PRESERVING_PAGE_FOUNDATIONS_AND_AUTHOR_HANDOFF','input_sha256':expected,'counts':{'v13_only_rows':len(rows),'scenes':len(scenes),'lineage':{k:v for k,v in counts.items() if k.startswith(('NOT_IN_ORIGINAL','EXISTS_IN_OTHER'))},'kaikki_evidence':{k:v for k,v in counts.items() if k.startswith(('FULL_EXACT','PARTIAL','NO_EVIDENCE'))},'source_only_page_drafts':len(rows),'complete_question_page':0,'complete_answer_page':0,'full_kaikki_candidate_evidence_records':sum(x['source_evidence_level']=='FULL_EXACT_HEADWORD' for x in rows),'priority_author_tasks':len(priority)},'missing_answer_fields':dict(missing_fields),'files':{x.name:{'sha256':sha(x),'bytes':x.stat().st_size} for x in [out,lex,queue]},'caution':'No verified literal IPA, audio, native V51 author example, bilingual translation, collocations or usage note joined. These are truthful source-only work foundations, not completed cards or new semantic Sense approvals. V13 identity independent from original FINAL.', 'canonical_sense_ids':0,'release_allowed':False}
(O/'CGMASTER_V90_V13_ONLY_PAGE_PRODUCTION_REPORT.json').write_text(json.dumps(rep,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(rep,ensure_ascii=False,indent=2))
