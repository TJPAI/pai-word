#!/usr/bin/env python3
"""V85 semantic-review units: group repeated contextual Master evidence conservatively.
Not global Sense IDs, not automatic semantic merging.
"""
import gzip,json,hashlib,unicodedata,collections
from pathlib import Path
P=Path('/mnt/data/v85');source=P/'CGMASTER_V85_P0_63690_MASTER_SENSE_SCENE_ADJUDICATION_ROWS.jsonl.gz'
norm=lambda s:' '.join(unicodedata.normalize('NFKC',s or '').casefold().split())
G={};n=0
with gzip.open(source,'rt',encoding='utf8') as f:
 for line in f:
  a=json.loads(line);n+=1;k=(a['review_group_expression'],norm(a['master_original_sense_zh']))
  if k not in G:G[k]={'expression':a['expression'],'source_zh':a['master_original_sense_zh'],'lexical_candidate_key_NOT_SENSE_ID':a['lexical_candidate_key_NOT_SENSE_ID'],'rows':[],'scenes':set(),'candidates':a['candidate_senses'],'priority':a['priority']}
  g=G[k];g['rows'].append(a['source_final_row']);g['scenes'].add(a['scene_id']);assert len(g['candidates'])==len(a['candidate_senses'])
assert n==63690
out=P/'CGMASTER_V85_POLYSEMY_GLOSS_REVIEW_UNITS.jsonl.gz';c=collections.Counter()
with gzip.open(out,'wt',encoding='utf8',compresslevel=6) as f:
 for k,g in sorted(G.items()):
  uid='SC1341-POLY-REVIEW-'+hashlib.sha256((k[0]+'\0'+k[1]).encode()).hexdigest()[:24]
  q={'review_unit_id_NOT_SENSE_ID':uid,'lookup_expression':k[0],'master_zh':g['source_zh'],'total_master_rows':len(g['rows']),
     'master_original_row_ids':g['rows'],'scene_count':len(g['scenes']),'scene_ids':sorted(g['scenes']),
     'native_kaikki_candidates':g['candidates'],'review':{'candidate_local_index':None,'is_scene_dependent':None,
     'has_multiple_distinct_lexical_senses':None,'reviewer':None,'qa_mu':None,'qa_cg':None,'canonical_sense_id':None},
     'state':'UNREVIEWED_GLOSS_GROUP_NOT_FORMAL_SENSE','release_allowed':False}
  f.write(json.dumps(q,ensure_ascii=False,separators=(',',':'))+'\n');c['review_units']+=1;c['rows']+=len(g['rows']);c['multiscene']+=len(g['scenes'])>1
assert c['rows']==63690
h=lambda p:hashlib.file_digest(open(p,'rb'),'sha256').hexdigest()
rep={'version':'V85','review_units':dict(c),'source_row_tasks_sha256':h(source),'review_unit_file':{'sha256':h(out),'bytes':out.stat().st_size},'warning':'Grouping same normalized expression and Chinese gloss is a WORKFLOW unit only; it does NOT establish identical semantic Sense across all scenes. Review may split group by scene and link many scenes to one authorized Sense only with QA.','released':False}
(P/'CGMASTER_V85_REVIEW_UNITS_REPORT.json').write_text(json.dumps(rep,ensure_ascii=False,indent=2))
print(json.dumps(rep,ensure_ascii=False,indent=2))
