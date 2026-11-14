#!/usr/bin/env python3
"""Explicit human-readable editorial pilot (not automatic classifier/QA)."""
import gzip,json,hashlib
from pathlib import Path
P=Path('/mnt/data');source=P/'v85/CGMASTER_V85_POLYSEMY_GLOSS_REVIEW_UNITS.jsonl.gz';OUT=P/'v86'
assert hashlib.file_digest(source.open('rb'),'sha256').hexdigest()=='1fa515ad1b6caab1dfd21644ced0bb90b73a7ad1da4614a374c8370c553c97d3'
# Local indices are taken from real frozen V85 candidate lists, never permanent lexical IDs.
ED={
('ability','æè½'):(6,'PREFERRED_CANDIDATE','Specific competence/skill is better supported by Kaikki gloss 6 than general capacity 1.'),
('ability','è½å'):(1,'CONDITIONAL_CONTEXT_REVIEW','General capacity usually maps to Kaikki gloss 1; some contexts imply skill gloss 6, so verify each scene before selection.'),
('absence','ç¼ºå¤'):(2,'PREFERRED_CANDIDATE','Nonattendance at an expected place is specifically documented in gloss 2.'),
('absence','ç¼ºå¸­'):(2,'PREFERRED_CANDIDATE','Gloss 2 explicitly contains nonattendance. Check scene context.'),
('absence','ç¼ºå¸­ï¼ç¼ºä¹'):(None,'SPLIT_OR_REVISE_MASTER_ZH','Combines nonattendance (gloss 2) and lack (gloss 3); do not merge into one lexical Sense.'),
('absence','ç¼ºè¯¾'):(2,'CONDITIONAL_CONTEXT_REVIEW','Nonattendance gloss 2 plausible for school absence, but scene context should be checked.'),
('absorb','åå£¤å¸æ¶æ°´'):(2,'PREFERRED_CANDIDATE','Gloss 2 explicitly describes physically taking in liquids, as by a sponge.'),
('absorb','åå£¤å¸æ¶æ¶²ä½'):(2,'PREFERRED_CANDIDATE','Gloss 2 is the direct liquid uptake sense; subject-specific Chinese is a usage context, not necessarily new lexical sense.'),
}
lookup={}
with gzip.open(source,'rt',encoding='utf8') as f:
 for line in f:
  r=json.loads(line);k=(r['lookup_expression'],r['master_zh'])
  if k in ED:lookup[k]=r
assert lookup.keys()==ED.keys()
recs=[]
for (en,zh),(idx,status,reason) in ED.items():
 a=lookup[(en,zh)]; candidates=a['native_kaikki_candidates']; selected=next((s for s in candidates if s['local_index_NOT_SENSE_ID']==idx),None) if idx is not None else None
 assert idx is None or selected is not None
 recs.append({'review_unit_id_NOT_SENSE_ID':a['review_unit_id_NOT_SENSE_ID'],'expression':en,'master_original_zh':zh,'source_final_rows':a['master_original_row_ids'],'scene_ids':a['scene_ids'],'editorial_candidate_local_index_NOT_SENSE_ID':idx,'editorial_candidate_pos':selected['pos'] if selected else None,'editorial_candidate_gloss_en':selected['glosses_en'] if selected else None,'editorial_evidence_pack_sha256':selected['source_pack_sha256'] if selected else None,'editorial_evidence_line':selected['source_line'] if selected else None,'editorial_status':status,'rationale':reason,'needs_per_scene_validation':True,'formal_global_sense_id':None,'CG_QA':'NOT_REVIEWED','MU_QA':'NOT_REVIEWED','release_allowed':False})
assert sum(len(r['source_final_rows']) for r in recs)==18
path=OUT/'CGMASTER_V86_EIGHT_EXPLICIT_SEMANTIC_EDITORIAL_PILOT.json'
path.write_text(json.dumps({'version':'V86','type':'EXPLICIT_EDITORIAL_PILOT_UNCERTIFIED','source_v85_sha256':'1fa515ad1b6caab1dfd21644ced0bb90b73a7ad1da4614a374c8370c553c97d3','record_count':len(recs),'original_rows_in_pilot':18,'records':recs,'release_allowed':False},ensure_ascii=False,indent=2))
print('wrote',path,hashlib.file_digest(path.open('rb'),'sha256').hexdigest())
