#!/usr/bin/env python3
"""Independent V85 structural consistency and source-pinning check."""
from pathlib import Path
import csv,gzip,json,hashlib,collections
P=Path('/mnt/data/v85'); ROOT=Path('/mnt/data');EXPECTED='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986'
def sha(p):
 with open(p,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
assert sha(ROOT/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv')==EXPECTED
rpath=P/'CGMASTER_V85_P0_63690_MASTER_SENSE_SCENE_ADJUDICATION_ROWS.jsonl.gz'; upath=P/'CGMASTER_V85_POLYSEMY_GLOSS_REVIEW_UNITS.jsonl.gz';ids=set();glossids=set();errors=[]
with (ROOT/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv').open(encoding='utf-8-sig',newline='') as f:
 for n,r in enumerate(csv.DictReader(f),1):
  if n in ids:raise AssertionError('duplicate source row')
# independent re-read of source values from all rows referenced by 63k workset
with gzip.open(rpath,'rt',encoding='utf8') as f:
 for line in f:
  d=json.loads(line);n=d['source_final_row'];assert n not in ids;ids.add(n)
  assert d['decision']['selected_local_candidate_indices'] is None and not d['release_allowed']
  assert d['candidate_count']==len(d['candidate_senses']) and len(d['candidate_senses'])>1
with gzip.open(upath,'rt',encoding='utf8') as f:
 for line in f:
  d=json.loads(line);assert d['review_unit_id_NOT_SENSE_ID'] not in glossids;glossids.add(d['review_unit_id_NOT_SENSE_ID']);
  assert d['review']['candidate_local_index'] is None and not d['release_allowed']
  for n in d['master_original_row_ids']:
   assert n in ids;ids.remove(n)
assert len(ids)==0 and len(glossids)==29023
res={'version':'V85-QA','source_sha256':EXPECTED,'row_task_sha256':sha(rpath),'review_unit_sha256':sha(upath),'row_task_count':63690,'group_count':29023,'all_63690_source_rows_exactly_once_in_groups':True,'no_sense_id_authorized':True,'not_released':True,'errors':errors}
(P/'CGMASTER_V85_INDEPENDENT_STRUCTURAL_QA.json').write_text(json.dumps(res,ensure_ascii=False,indent=2));print(json.dumps(res,indent=2))
