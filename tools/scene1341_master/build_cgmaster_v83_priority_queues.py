#!/usr/bin/env python3
"""Build actionable source-retrieval and Sense-adjudication worklists from V83.
No automatic Sense selection or authoring/certification. Source-pinned original Master.
"""
from pathlib import Path
import collections,csv,gzip,hashlib,json,unicodedata
P=Path('/mnt/data'); OUT=P/'v83'
SOURCE=P/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv'
EXPECTED='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==EXPECTED
norm=lambda x:' '.join(unicodedata.normalize('NFKC',str(x or '')).casefold().split())
lookup={}
with gzip.open(OUT/'CGMASTER_V83_KAIKKI_EXACT_HEADWORD_CANDIDATE_SENSE_LIBRARY.jsonl.gz','rt',encoding='utf-8') as f:
 for line in f:
  r=json.loads(line);lookup[r['lookup_key']]={'sense_count':r['candidate_sense_count'],'evidence_status':r['status']}
G={}
with SOURCE.open(encoding='utf-8-sig',newline='') as f:
 for n,row in enumerate(csv.DictReader(f),1):
  key=norm(row['english_expression']);d=G.setdefault(key,{'expression':row['english_expression'],'row_count':0,'scene_ids':set(),'sense_zh':set(),'first_source_rows':[],'first_scenes':[]})
  d['row_count']+=1;d['scene_ids'].add(row['scene_id']);
  if row['sense_zh'].strip():d['sense_zh'].add(row['sense_zh'])
  if len(d['first_source_rows'])<5:d['first_source_rows'].append(n)
  if row['scene_id'] not in d['first_scenes'] and len(d['first_scenes'])<5:d['first_scenes'].append(row['scene_id'])
# Priority: more distinct scenes and source rows first; for polysemy, more gloss variants then more candidate senses.
missing=[]; multi=[];single=[];partial=[]
for key,v in G.items():
 ev=lookup.get(key);stat=ev['evidence_status'] if ev else 'NOT_IN_21_PACKS';num=ev['sense_count'] if ev else 0
 obj={'lookup_key':key,'display_expression':v['expression'],'master_record_count':v['row_count'],'scene_count':len(v['scene_ids']),'source_sense_zh_variant_count':len(v['sense_zh']),'sample_original_sense_zh':sorted(v['sense_zh'])[:5],'sample_scene_ids':v['first_scenes'],'sample_final_source_rows':v['first_source_rows'],'kaikki_pack_evidence_status':stat,'kaikki_candidate_count':num,'canonical_sense_id':None,'release_allowed':False}
 if not ev or not num: missing.append(obj)
 elif stat=='FULL_EXACT_HEADWORD' and num>1:multi.append(obj)
 elif stat=='FULL_EXACT_HEADWORD' and num==1:single.append(obj)
 else:partial.append(obj)
missing.sort(key=lambda x:(-x['scene_count'],-x['master_record_count'],-x['source_sense_zh_variant_count'],x['lookup_key']))
multi.sort(key=lambda x:(-x['scene_count'],-x['source_sense_zh_variant_count'],-x['master_record_count'],-x['kaikki_candidate_count'],x['lookup_key']))
for name,arr in [('CGMASTER_V83_PRIORITY_3000_MISSING_KAIKKI_SOURCE.jsonl',missing[:3000]),('CGMASTER_V83_PRIORITY_3000_POLYSEMY_SENSE_REVIEW.jsonl',multi[:3000])]:
 with (OUT/name).open('w',encoding='utf8') as f:
  for r in arr:f.write(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')
summary={'version':'V83-QUEUE','master_sha256':EXPECTED,'strategy':'Prioritize by scene reuse and number of original source records. Polysemy queue further orders by distinct Chinese gloss variants. These queues are only candidate evidence retrieval and manual review, not approved Sense IDs.','counts':{'missing_unique_expressions':len(missing),'missing_original_master_rows':sum(o['master_record_count'] for o in missing),'polysemy_unique_expressions':len(multi),'polysemy_original_master_rows':sum(o['master_record_count'] for o in multi),'single_full_candidate_unique_expressions':len(single),'partial_samples_unique_expressions':len(partial)},'files':{}}
for name in ['CGMASTER_V83_PRIORITY_3000_MISSING_KAIKKI_SOURCE.jsonl','CGMASTER_V83_PRIORITY_3000_POLYSEMY_SENSE_REVIEW.jsonl']:
 p=OUT/name;summary['files'][name]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':p.stat().st_size,'rows':3000}
(OUT/'CGMASTER_V83_PRIORITY_QUEUES_REPORT.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
