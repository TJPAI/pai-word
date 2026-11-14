#!/usr/bin/env python3
"""V87: non-destructive repair suggestions for 8,523 V13->FINAL unsettled links.
No semantic Sense merges, certification, or production writes. Reviewed V13 remains authoritative.
"""
import csv,gzip,json,hashlib,collections,unicodedata
from pathlib import Path
P=Path('/mnt/data');O=P/'v87';O.mkdir(exist_ok=True)
F=P/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv'
V=P/'PAI_Word_Scene1341_ReviewedMaster_WORKING_V13_20261112.csv.gz.csv'
B=P/'v86/CGMASTER_V86_V13_TO_FINAL_AND_V85_SAFE_IDENTITY_BRIDGE.jsonl.gz'
expected={'final':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','v13':'568455645ff4d0ee6fba8177c45cf89d5f7f892ff8ecd7ad1897a9458c03aba6','bridge':'58acc91357503cacdf41f88af93e4168d5c2039d21ec8b5d8b754a42544b18da'}
sha=lambda p: hashlib.file_digest(p.open('rb'),'sha256').hexdigest()
for k,p in [('final',F),('v13',V),('bridge',B)]:assert sha(p)==expected[k]
norm=lambda s:' '.join(unicodedata.normalize('NFKC',s or '').casefold().split())
FR={};FEXP=collections.defaultdict(list)
with F.open(encoding='utf-8-sig',newline='') as f:
 for n,r in enumerate(csv.DictReader(f),1):
  FR[n]=r;FEXP[(r['scene_id'],norm(r['english_expression']))].append(n)
VROWS=[]
with gzip.open(V,'rt',encoding='utf-8-sig',newline='') as f:
 for r in csv.DictReader(f):VROWS.append(r)
assert len(VROWS)==200144 and len(FR)==230289
out=O/'CGMASTER_V87_8523_V13_UNRESOLVED_SOURCE_RECOVERY.jsonl.gz'
ct=collections.Counter(); unique_scene=set();missing_scenes=set();missing_source_versions=collections.Counter();per_scene=collections.Counter(); examples={}
with gzip.open(B,'rt',encoding='utf-8') as f,gzip.open(out,'wt',encoding='utf-8',compresslevel=6) as w:
 for line in f:
  b=json.loads(line)
  if b['final_original_row_safe_link'] is not None:continue
  r=VROWS[b['v13_audit_row_no']-1];scene=b['v13_scene_id'];eng=b['v13_expression'];z=b['v13_original_zh']
  candidates=FEXP.get((scene,norm(eng)),[])
  if len(candidates)==1:
   typ='ONE_EXPRESSION_SOURCE_ROW_GLOSS_DIVERGENCE_REVIEW'
   rid=candidates[0];fr=FR[rid]
   provisional=rid
  elif len(candidates)>1:
   typ='MULTIPLE_ORIGINAL_SOURCE_ROWS_NEED_IDENTITY_REVIEW';provisional=None
  else:
   typ='V13_ONLY_OR_RENAMED_EXPRESSION_VERIFY_LINEAGE';provisional=None;missing_source_versions[r['source_version']]+=1;missing_scenes.add(scene)
  ct[typ]+=1;unique_scene.add(scene);per_scene[scene]+=1
  cand=[{'final_source_row':i,'final_expression':FR[i]['english_expression'],'final_original_sense_zh':FR[i]['sense_zh'],'final_source_filename':FR[i]['source_filename'],'final_source_row_number':FR[i]['source_row_number']} for i in candidates[:12]]
  o={'v13_row':b['v13_audit_row_no'],'candidate_id_NOT_CANONICAL_SENSE':r['candidate_id'],'scene_id':scene,'v13_expression':eng,'v13_original_zh':z,'v13_working_zh':r['working_zh'],'v13_source_version':r['source_version'],'v13_original_file':r['original_file'],'v13_original_file_row':r['original_file_row'],'v13_review_decision':r['v13_review_decision'],'v13_review_status':r['v13_qa_status'],'v86_status':b['final_match_status'],'recovery_class':typ,'provisional_unique_expression_source_row_NOT_AUTHORIZED':provisional,'candidate_source_rows':cand,'proposed_action':'CHECK_ORIGINAL_SOURCE_LINE_AND_SEMANTIC_GLOSS' if candidates else 'VERIFY_V13_ADDED_RECORD_OR_RENAME_NOT_IN_FINAL','semantic_choice':None,'canonical_scene1341_sense_id':None,'independent_qa':None,'release_allowed':False}
  w.write(json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n')
  if len(examples.get(typ,[]))<8:examples.setdefault(typ,[]).append({'v13_row':b['v13_audit_row_no'],'english':eng,'v13_zh':z,'source_zh':[x['final_original_sense_zh'] for x in cand]})
assert sum(ct.values())==8523
report={'version':'V87','date':'2026-11-14','source_sha256':expected,'scope':{'v13_unresolved':8523,'source_classes':dict(ct),'affected_scenes':len(unique_scene),'v13_only_affected_scenes':len(missing_scenes),'v13_only_source_versions_top15':missing_source_versions.most_common(15)},'examples':examples,'file':{'name':out.name,'bytes':out.stat().st_size,'sha256':sha(out)},'notice':'Only 5059 rows have exactly one ORIGINAL scene-expression candidate, but gloss differs. All require identity/meaning review; NO additional source links formally authorized. 3140 may be intentional V13 additions and must not be called erroneous without lineage verification. No semantic certification.','safe_new_authorized_links':0,'sense_ids_certified':0,'release_allowed':False}
(O/'CGMASTER_V87_SOURCE_RECOVERY_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report['scope'],ensure_ascii=False,indent=2))
