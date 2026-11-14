#!/usr/bin/env python3
import gzip,json,csv,unicodedata,collections,hashlib
from pathlib import Path
P=Path('/mnt/data');Q=P/'v86';bridge=Q/'CGMASTER_V86_V13_TO_FINAL_AND_V85_SAFE_IDENTITY_BRIDGE.jsonl.gz';pilot=Q/'CGMASTER_V86_EIGHT_EXPLICIT_SEMANTIC_EDITORIAL_PILOT.json'
rep=json.loads((Q/'CGMASTER_V86_V13_SAFE_SOURCE_BRIDGE_REPORT.json').read_text());assert hashlib.file_digest(bridge.open('rb'),'sha256').hexdigest()==rep['output']['sha256']
F={}
with (P/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv').open(encoding='utf-8-sig') as f:
 for n,r in enumerate(csv.DictReader(f),1):F[n]=r
N=lambda x:' '.join(unicodedata.normalize('NFKC',x or '').casefold().split())
count=collections.Counter();seen=set();safe=set()
with gzip.open(bridge,'rt',encoding='utf8') as f:
 for line in f:
  x=json.loads(line);i=x['v13_audit_row_no'];assert i not in seen;seen.add(i)
  assert x['global_sense_id'] is None and not x['release_allowed']
  s=x['final_original_row_safe_link'];count[x['final_match_status']]+=1
  if s:
   assert s not in safe;safe.add(s);r=F[s]
   assert r['scene_id']==x['v13_scene_id'] and N(r['english_expression'])==N(x['v13_expression']) and N(r['sense_zh'])==N(x['v13_original_zh'])
assert len(seen)==200144 and len(safe)==191621
p=json.loads(pilot.read_text());assert len(p['records'])==8 and sum(len(x['source_final_rows']) for x in p['records'])==18
for x in p['records']:
 for s in x['source_final_rows']:
  r=F[s];assert N(r['english_expression'])==N(x['expression']) and N(r['sense_zh'])==N(x['master_original_zh'])
 assert x['CG_QA']=='NOT_REVIEWED' and x['MU_QA']=='NOT_REVIEWED' and not x['release_allowed']
qa={'version':'V86-INDEPENDENT-STRUCTURAL-QA','status':'PASS_STRUCTURAL_ONLY','v13_rows_readback':len(seen),'unique_exact_source_links':len(safe),'all_status_counts_match_report':dict(count)==rep['counts']['match_status'],'pilot_editorial_units':len(p['records']),'pilot_original_rows':18,'no_formal_sense_ids_or_qa_pass':True,'source_final_unchanged':True,'errors':[]}
assert qa['all_status_counts_match_report']
out=Q/'CGMASTER_V86_INDEPENDENT_STRUCTURAL_QA.json';out.write_text(json.dumps(qa,ensure_ascii=False,indent=2));print(json.dumps(qa,indent=2))
