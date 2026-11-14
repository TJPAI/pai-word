#!/usr/bin/env python3
"""Independent V88 readback relative to immutable V87 source."""
import gzip,json,hashlib,collections
from pathlib import Path
P=Path('/mnt/data');O=P/'v88';s=P/'v87/CGMASTER_V87_8523_V13_UNRESOLVED_SOURCE_RECOVERY.jsonl.gz';q=O/'CGMASTER_V88_5059_V13_GLOSS_DIVERGENCE_KAIKKI_TRIAGE.jsonl.gz';report=json.loads((O/'CGMASTER_V88_GLOSS_DIVERGENCE_AND_EDITORIAL_REPORT.json').read_text())
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
assert sha(s)==report['authority_sha256']['v87_workset']; assert sha(q)==report['output_sha256']['triage']
source={}
with gzip.open(s,'rt') as f:
 for line in f:
  x=json.loads(line)
  if x['recovery_class']=='ONE_EXPRESSION_SOURCE_ROW_GLOSS_DIVERGENCE_REVIEW':source[x['v13_row']]=x
assert len(source)==5059
checked=set();typ=collections.Counter()
with gzip.open(q,'rt') as f:
 for line in f:
  x=json.loads(line);i=x['v13_audit_row'];assert i in source and i not in checked;checked.add(i);src=source[i]
  assert (x['scene_id'],x['expression'],x['v13_original_zh'])==(src['scene_id'],src['v13_expression'],src['v13_original_zh'])
  assert x['final_original_candidate']==src['candidate_source_rows'][0]
  assert x['proposed_semantic_decision'] is None and x['canonical_sense_id'] is None and not x['release_allowed']
  assert x['kaikki_candidate_sense_count']==len(x['kaikki_native_senses_all_unselected'])
  typ[x['kaikki_evidence_type']]+=1
assert checked==set(source);assert dict(typ)==report['census']['types']
pilot=json.loads((O/'CGMASTER_V88_16_REAL_SEMANTIC_EDITORIAL_ASSESSMENTS.json').read_text());assert sha(O/'CGMASTER_V88_16_REAL_SEMANTIC_EDITORIAL_ASSESSMENTS.json')==report['output_sha256']['pilot']
assert len(pilot['records'])==16
for p in pilot['records']:
 assert p['v13_audit_row'] in checked and p['canonical_scene1341_sense_id'] is None and not p['release_allowed']
 assert p['qa_cg']==p['qa_mu']=='NOT_REVIEWED'
 if p['editorial_status']=='SUGGEST_PREFERRED_CONTEXT_CHECK':assert p['source_candidate_evidence'] and p['source_candidate_evidence']['source_pack_sha256']
res={'version':'V88-INDEPENDENT-READBACK','status':'PASS_STRUCTURAL_ONLY','source_sha_verified':True,'original_5059_source_rows_exactly_once':True,'counts':dict(typ),'editorial_records':len(pilot['records']),'new_formal_sense_ids':0,'release_allowed':False,'errors':[]}
(O/'CGMASTER_V88_INDEPENDENT_STRUCTURAL_QA.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
print(json.dumps(res,ensure_ascii=False,indent=2))
