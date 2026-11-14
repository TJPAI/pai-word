#!/usr/bin/env python3
"""V86 conservative evidence bridge: V13 -> FINAL -> V85, never merges lexical Senses.
Source identity may be linked only with unique scene+expression+original gloss;
source row ordinals cannot be interpreted as equivalent. Read-only, no certification.
"""
import csv,gzip,json,hashlib,unicodedata,collections
from pathlib import Path
R=Path('/mnt/data');O=R/'v86';O.mkdir(exist_ok=True)
FINAL=R/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv'
V13=R/'PAI_Word_Scene1341_ReviewedMaster_WORKING_V13_20261112.csv.gz.csv'
V85=R/'v85/CGMASTER_V85_P0_63690_MASTER_SENSE_SCENE_ADJUDICATION_ROWS.jsonl.gz'
EXPECTED={'final':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','v13':'568455645ff4d0ee6fba8177c45cf89d5f7f892ff8ecd7ad1897a9458c03aba6','v85':'38482e31ae622d8f2f2bed1962bb38e2ec57844655934f306b5e5078af80e5c6'}
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
for k,p in [('final',FINAL),('v13',V13),('v85',V85)]:assert sha(p)==EXPECTED[k],f'{k} SHA mismatch'
norm=lambda s:' '.join(unicodedata.normalize('NFKC',s or '').casefold().split())
def key(s,e,z):return (s,norm(e),norm(z))
F=collections.defaultdict(list);FE=collections.defaultdict(list);final_rows={};scenes=set()
with FINAL.open(encoding='utf-8-sig',newline='') as f:
 for n,r in enumerate(csv.DictReader(f),1):
  k=key(r['scene_id'],r['english_expression'],r['sense_zh']);F[k].append(n);FE[k[:2]].append(n);final_rows[n]=(k,r['source_filename'],r['source_row_number']);scenes.add(r['scene_id'])
assert len(final_rows)==230289 and len(scenes)==1341
V=collections.defaultdict(list);vrows=[];ves=set();vscene=set()
with gzip.open(V13,'rt',encoding='utf-8-sig',newline='') as f:
 for n,r in enumerate(csv.DictReader(f),1):
  assert int(r['audit_row_no'])==n
  k=key(r['scene_id'],r['english_expression'],r['master_original_zh']);V[k].append(n);vrows.append(r);ves.add(k[:2]);vscene.add(r['scene_id'])
assert len(vrows)==200144
V85_IDS=set()
with gzip.open(V85,'rt',encoding='utf-8') as f:
 for line in f:
  r=json.loads(line);n=r['source_final_row'];assert n not in V85_IDS;V85_IDS.add(n)
assert len(V85_IDS)==63690
report=collections.Counter();v85_report=collections.Counter()
work=O/'CGMASTER_V86_V13_TO_FINAL_AND_V85_SAFE_IDENTITY_BRIDGE.jsonl.gz'
with gzip.open(work,'wt',encoding='utf-8',compresslevel=6) as f:
 for n,r in enumerate(vrows,1):
  k=key(r['scene_id'],r['english_expression'],r['master_original_zh']);a=F.get(k,[]);b=V[k];same_scene_expr=FE.get(k[:2],[])
  if len(a)==1 and len(b)==1:status='ONE_TO_ONE_SCENE_EXPRESSION_ORIGINAL_ZH'
  elif not a and same_scene_expr:status='GLOSS_MISMATCH_OR_ALTERNATE_SOURCE_GLOSS'
  elif not a:status='NO_SCENE_EXPRESSION_IN_FINAL'
  elif len(a)>1 or len(b)>1:status='NONUNIQUE_DO_NOT_AUTOLINK'
  else:raise AssertionError('impossible')
  report[status]+=1
  nsrc=a[0] if status.startswith('ONE_TO_ONE') else None
  if nsrc is not None and nsrc in V85_IDS:v85_report['V85_P0_ROW_EXACT_SAME_SOURCE']+=1
  elif nsrc is not None:v85_report['EXACT_SOURCE_NOT_IN_V85_P0']+=1
  else:v85_report['NOT_UNAMBIGUOUS_SOURCE_LINK']+=1
  x={'v13_audit_row_no':n,'v13_candidate_id':r['candidate_id'],'v13_scene_id':r['scene_id'],'v13_expression':r['english_expression'],'v13_original_zh':r['master_original_zh'],'v13_working_zh':r['working_zh'],'v13_editorial_decision':r['editorial_decision'],'v13_qa_status':r['qa_status'],'v13_review_decision':r['v13_review_decision'],'v13_review_qa_status':r['v13_qa_status'],'final_match_status':status,'final_original_row_safe_link':nsrc,'final_candidate_rows_exact_gloss_first_10':a[:10],'final_same_scene_expression_first_10':same_scene_expr[:10],'original_final_row_in_v85_p0':nsrc in V85_IDS if nsrc else None,'global_sense_id':None,'independent_cg_qa_pass':False,'independent_mu_qa_pass':False,'release_allowed':False}
  f.write(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
# Independently validate bijection, no duplicate safe final rows and V85 references true original rows.
linked=set();qa=collections.Counter();size=0
with gzip.open(work,'rt',encoding='utf-8') as f:
 for line in f:
  r=json.loads(line);size+=1;k=r['final_original_row_safe_link']
  if k is not None:
   assert k not in linked;linked.add(k)
   true=final_rows[k][0]
   assert true==key(r['v13_scene_id'],r['v13_expression'],r['v13_original_zh'])
   qa['safe_linked']+=1
  assert not r['release_allowed'] and r['global_sense_id'] is None
assert size==200144 and qa['safe_linked']==report['ONE_TO_ONE_SCENE_EXPRESSION_ORIGINAL_ZH']
summary={'version':'V86','date':'2026-11-14','purpose':'V13 to original FINAL exact source identity crosswalk and V85 P0 inclusion, NOT semantic Sense adjudication','authority_sha256':EXPECTED,'counts':{'v13_rows':len(vrows),'original_final_rows':len(final_rows),'v85_p0_rows':len(V85_IDS),'reviewed_master_scenes':len(vscene),'original_final_scenes':len(scenes),'match_status':dict(report),'v85_overlap':dict(v85_report),'safe_linked_unique_final_rows':len(linked)},'output':{'file':work.name,'sha256':sha(work),'bytes':work.stat().st_size},'limitations':['Only exact unique (scene, normalized English expression, original Chinese gloss) qualifies; no original ordinal equivalence implied','V13 editorial status is evidence, not independent QA or lexical Sense approval','No candidate Kaikki Sense selected; preserve original FINAL and Reviewed V13','Unmatched/ambiguous V13 cases must be reviewed, never auto-merged'],'canonical_sense_id_authorized':0,'release_allowed':False}
(O/'CGMASTER_V86_V13_SAFE_SOURCE_BRIDGE_REPORT.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
