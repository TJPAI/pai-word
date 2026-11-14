#!/usr/bin/env python3
import csv,gzip,json,hashlib,collections,unicodedata
from pathlib import Path
P=Path('/mnt/data');R=P/'v87'; f=R/'CGMASTER_V87_8523_V13_UNRESOLVED_SOURCE_RECOVERY.jsonl.gz';rep=json.loads((R/'CGMASTER_V87_SOURCE_RECOVERY_REPORT.json').read_text());assert hashlib.file_digest(f.open('rb'),'sha256').hexdigest()==rep['file']['sha256']
F=P/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv';V=P/'PAI_Word_Scene1341_ReviewedMaster_WORKING_V13_20261112.csv.gz.csv';N=lambda x:' '.join(unicodedata.normalize('NFKC',x or '').casefold().split())
orig={};
with F.open(encoding='utf-8-sig') as h:
 for n,x in enumerate(csv.DictReader(h),1):orig[n]=x
vrows={};
with gzip.open(V,'rt',encoding='utf-8-sig') as h:
 for n,x in enumerate(csv.DictReader(h),1):vrows[n]=x
seen=set();ct=collections.Counter();errors=[]
with gzip.open(f,'rt',encoding='utf-8') as h:
 for line in h:
  r=json.loads(line);i=r['v13_row'];assert i not in seen;seen.add(i);x=vrows[i]
  assert (r['scene_id'],N(r['v13_expression']),N(r['v13_original_zh']))==(x['scene_id'],N(x['english_expression']),N(x['master_original_zh']))
  assert r['canonical_scene1341_sense_id'] is None and r['independent_qa'] is None and not r['release_allowed']
  classif=r['recovery_class'];ct[classif]+=1
  cand=r['candidate_source_rows'];n=r['provisional_unique_expression_source_row_NOT_AUTHORIZED']
  assert n is not None if classif=='ONE_EXPRESSION_SOURCE_ROW_GLOSS_DIVERGENCE_REVIEW' else n is None
  if n is not None:
   assert len(cand)==1 and cand[0]['final_source_row']==n
   y=orig[n];assert y['scene_id']==r['scene_id'] and N(y['english_expression'])==N(r['v13_expression']) and N(y['sense_zh'])!=N(r['v13_original_zh'])
  for c in cand:
   y=orig[c['final_source_row']];assert y['scene_id']==r['scene_id'] and N(y['english_expression'])==N(r['v13_expression'])
assert len(seen)==8523 and dict(ct)==rep['scope']['source_classes']
out={'version':'V87-QA','status':'PASS_STRUCTURAL_ONLY','rows_checked':len(seen),'counts':dict(ct),'input_sha256':rep['source_sha256'],'workset_sha256':rep['file']['sha256'],'source_values_revalidated':True,'no_new_authorized_sense_ids':True,'no_final_master_or_v13_mutation':True,'errors':errors}
(R/'CGMASTER_V87_INDEPENDENT_STRUCTURAL_QA.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps(out,ensure_ascii=False,indent=2))
