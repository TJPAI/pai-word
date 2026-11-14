#!/usr/bin/env python3
"""V89: fully evidence-pin V13-only/renamed English expressions and duplicate FINAL sources.
No source identity or Sense approval from cross-scene matching. No original mutation.
"""
import collections,csv,gzip,hashlib,json,unicodedata
from pathlib import Path
R=Path('/mnt/data');O=R/'v89';O.mkdir(exist_ok=True)
FINAL=R/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv';REC=R/'v87/CGMASTER_V87_8523_V13_UNRESOLVED_SOURCE_RECOVERY.jsonl.gz';LEX=R/'v83/CGMASTER_V83_KAIKKI_EXACT_HEADWORD_CANDIDATE_SENSE_LIBRARY.jsonl.gz'
EX={'final':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','v87':'0ec18ede7faec2c1d2627c84bdf1f227e9a3456db34340b12949e6c563b3b8a0','v83':'49043dfa36729ab9d3aad68fee0cdca99729c5b202a2ad563e2c3e93cb1cc869'}
def sha(path):
 with open(path,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
assert sha(FINAL)==EX['final'] and sha(REC)==EX['v87'] and sha(LEX)==EX['v83']
N=lambda s:' '.join(unicodedata.normalize('NFKC',s or '').casefold().split())
orig={};G=collections.defaultdict(list)
with FINAL.open(encoding='utf-8-sig',newline='') as f:
 for n,x in enumerate(csv.DictReader(f),1):
  orig[n]=x;G[N(x['english_expression'])].append(n)
assert len(orig)==230289
lex={}
with gzip.open(LEX,'rt',encoding='utf-8') as f:
 for l in f:
  x=json.loads(l);lex[x['lookup_key']]=x
missing=[];ambig=[]
with gzip.open(REC,'rt',encoding='utf-8') as f:
 for l in f:
  x=json.loads(l)
  if x['recovery_class']=='V13_ONLY_OR_RENAMED_EXPRESSION_VERIFY_LINEAGE':missing.append(x)
  elif x['recovery_class']=='MULTIPLE_ORIGINAL_SOURCE_ROWS_NEED_IDENTITY_REVIEW':ambig.append(x)
assert len(missing)==3140 and len(ambig)==324
status=collections.Counter(); evid=collections.Counter();multi=collections.Counter();samples=collections.defaultdict(list)
missingpath=O/'CGMASTER_V89_3140_V13_ONLY_GLOBAL_LINEAGE_AND_KAIKKI_CANDIDATES.jsonl.gz'
with gzip.open(missingpath,'wt',encoding='utf-8',compresslevel=6) as out:
 for x in missing:
  key=N(x['v13_expression']); all_ids=G.get(key,[]);other=[i for i in all_ids if orig[i]['scene_id']!=x['scene_id']]
  assert len(other)==len(all_ids), 'not V13-only if same-scene expression exists'
  samegl=[i for i in other if N(orig[i]['sense_zh'])==N(x['v13_original_zh'])]
  if samegl:lineage='EXISTS_IN_OTHER_SCENES_WITH_SAME_ZH_NOT_PROVEN_SAME_SOURCE'
  elif other:lineage='EXISTS_IN_OTHER_SCENES_DIFFERENT_ZH_NO_SOURCE_MATCH'
  else:lineage='NOT_IN_ORIGINAL_FINAL_ENGLISH_EXPRESSION_INDEX'
  e=lex.get(key);kind=e['status'] if e else 'NO_EVIDENCE_IN_21_PACKS';candidates=e['candidate_senses'] if e else []
  assert kind in ('FULL_EXACT_HEADWORD','PARTIAL_TRUNCATED_SAMPLES_ONLY','NO_EVIDENCE_IN_21_PACKS')
  status[lineage]+=1;evid[kind]+=1;multi['other_scene_master_rows']+=len(other);multi['other_scene_exact_zh_rows']+=len(samegl)
  if len(samples[lineage])<5:samples[lineage].append({'v13_row':x['v13_row'],'expression':x['v13_expression'],'zh':x['v13_original_zh'],'other_scene_count':len({orig[i]['scene_id'] for i in other})})
  y={'v13_audit_row':x['v13_row'],'v13_candidate_id_NOT_SENSE_ID':x['candidate_id_NOT_CANONICAL_SENSE'],'scene_id':x['scene_id'],'expression':x['v13_expression'],'v13_original_zh':x['v13_original_zh'],'v13_working_zh':x['v13_working_zh'],'v13_source_version':x['v13_source_version'],'v13_original_file':x['v13_original_file'],'v13_original_file_row':x['v13_original_file_row'],'source_lineage_class':lineage,'source_evidence_other_scene_count':len({orig[i]['scene_id'] for i in other}),'other_scene_original_rows_first_15':[{'final_row':i,'scene_id':orig[i]['scene_id'],'original_zh':orig[i]['sense_zh'],'same_normalized_chinese_gloss':i in samegl,'source_filename':orig[i]['source_filename'],'source_row':orig[i]['source_row_number']} for i in other[:15]],'global_same_zh_rows_count':len(samegl),'kaikki_evidence_status':kind,'kaikki_candidate_count':len(candidates),'kaikki_candidates':[{'local_index_NOT_SENSE_ID':j,'pos':s.get('pos'),'english_glosses':s.get('glosses') or ([s['gloss_sample_truncated_possible']] if s.get('gloss_sample_truncated_possible') else []),'source_pack_sha256':s.get('source_pack_sha256'),'source_line':s.get('source_line'),'native_sense_index':s.get('native_entry_sense_index_as_extracted')} for j,s in enumerate(candidates)],'candidate_from_other_scene_source_identity':None,'sense_selection':None,'canonical_scene1341_sense_id':None,'qa_cg':None,'qa_mu':None,'release_allowed':False}
  out.write(json.dumps(y,ensure_ascii=False,separators=(',',':'))+'\n')
ambigpath=O/'CGMASTER_V89_324_DUPLICATE_ORIGINAL_FINAL_SOURCE_IDENTITY_CASES.jsonl.gz';A=collections.Counter()
with gzip.open(ambigpath,'wt',encoding='utf-8',compresslevel=6) as out:
 for x in ambig:
  ids=[c['final_source_row'] for c in x['candidate_source_rows']];zh=set(N(orig[i]['sense_zh']) for i in ids)
  exact=[i for i in ids if N(orig[i]['sense_zh'])==N(x['v13_original_zh'])]
  typ='SAME_ZH_DUPLICATE_FINAL_ROWS' if len(zh)==1 else 'DIFFERENT_ZH_COMPETING_FINAL_ROWS'
  A[typ]+=1
  y={'v13_audit_row':x['v13_row'],'candidate_id_NOT_SENSE_ID':x['candidate_id_NOT_CANONICAL_SENSE'],'scene_id':x['scene_id'],'expression':x['v13_expression'],'v13_original_zh':x['v13_original_zh'],'identity_ambiguity':typ,'exact_zh_candidate_count':len(exact),'original_final_candidates':x['candidate_source_rows'],'selected_final_row':None,'editorial_identity_decision':None,'qa_cg':None,'qa_mu':None,'canonical_sense_id':None,'release_allowed':False}
  out.write(json.dumps(y,ensure_ascii=False,separators=(',',':'))+'\n')
report={'version':'V89','date':'2026-11-14','purpose':'Actual FULL 3140 V13-only cross-scene lineage + Kaikki source evidence and 324 competing original identities; no automatic source or semantic Sense merge','source_sha256':EX,'counts':{'v13_only_records':len(missing),'v13_only_lineage':dict(status),'v13_only_kaikki_evidence':dict(evid),'other_scene_master_record_references':multi['other_scene_master_rows'],'other_scene_exact_zh_references':multi['other_scene_exact_zh_rows'],'multiple_original_identity_records':len(ambig),'multiple_original_identity_class':dict(A)},'examples':dict(samples),'files':{p.name:{'sha256':sha(p),'bytes':p.stat().st_size} for p in [missingpath,ambigpath]},'authority_note':'Same normalized English expression or Chinese gloss in another scene is NOT source lineage or semantic identity. V13-only rows may be new authored additions; do not delete. Candidate POS/gloss is not approved scene Sense.','new_source_lineages_authorized':0,'canonical_sense_ids_approved':0,'release_allowed':False}
(O/'CGMASTER_V89_V13_ONLY_AND_IDENTITY_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report['counts'],ensure_ascii=False,indent=2))
