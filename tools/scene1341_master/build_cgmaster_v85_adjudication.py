#!/usr/bin/env python3
"""V85: derive review-ready per-Master-row decisions from source-pinned V84 multi-sense dossiers.

No automatic Sense selection. Never replace Reviewed V13, FINAL, or production fields.
"""
from pathlib import Path
from collections import Counter, defaultdict
import gzip, json, hashlib
ROOT=Path('/mnt/data'); OUT=ROOT/'v85'; OUT.mkdir(exist_ok=True)
POLY=ROOT/'v84/CGMASTER_V84_POLYSEMY_P0_3000_FULL_SENSE_ADJUDICATION_DOSSIERS.jsonl.gz'
FINAL_SHA='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986'
POLY_SHA='cce3bc28ba3de3ba5095d13d296e94adee0db351f555a1c5466c9670258de1d4'
sha=lambda p:hashlib.file_digest(open(p,'rb'),'sha256').hexdigest()
assert sha(POLY)==POLY_SHA
rows_out=OUT/'CGMASTER_V85_P0_63690_MASTER_SENSE_SCENE_ADJUDICATION_ROWS.jsonl.gz'
unique=set(); seen_expr=set(); scene_ids=set(); statuses=Counter(); pri=Counter(); cand_ex=0; no_candidates=0; n=0
# Field status: each original row is a separate decision; no candidate preselection.
with gzip.open(POLY,'rt',encoding='utf8') as rf,gzip.open(rows_out,'wt',encoding='utf8',compresslevel=6) as wf:
 for line in rf:
  d=json.loads(line); key=d['lookup_key'];assert key not in seen_expr;seen_expr.add(key)
  candidates=d['candidate_senses']; assert len(candidates)>1
  compact=[]
  for c in candidates:
   compact.append({'local_index_NOT_SENSE_ID':c['review_candidate_local_index_NOT_SENSE_ID'],'pos':c['pos'],
    'glosses_en':c['english_glosses'],'tags':c['tags'],'native_sense_index_as_extracted':c['native_entry_sense_index_as_extracted'],
    'source_pack_sha256':c['source_pack_sha256'],'source_line':c['source_line'],
    'source_example_en':c['english_examples_source_candidates'][:1],
    'dictionary_risk_flags':[t for t in (c['tags'] or []) if t in {'obsolete','archaic','dated','historical','rare','slang','vulgar','offensive'}]})
  zh_counts=Counter(r['original_sense_zh'] for r in d['original_master_rows']);scene_count=d['scene_count'];
  if len(compact)>15:priority='HIGH_MULTISENSE'
  elif len(zh_counts)>1:priority='CROSS_GLOSS'
  else:priority='STANDARD'
  for r in d['original_master_rows']:
   rowid=r['source_row'];assert rowid not in unique;unique.add(rowid)
   scene_ids.add(r['scene_id']); n+=1;pri[priority]+=1
   o={'source_final_sha256':FINAL_SHA,'source_final_row':rowid,'scene_id':r['scene_id'],
      'expression':r['expression'],'master_original_sense_zh':r['original_sense_zh'],
      'lexical_candidate_key_NOT_SENSE_ID':r['candidate_lexical_key_NOT_SENSE_ID'],
      'review_group_expression':key,'candidate_count':len(compact),'candidate_senses':compact,
      'priority':priority,'cross_scene_occurrences_for_expression':len(d['original_master_rows']),
      'distinct_master_gloss_variants':len(zh_counts),
      'decision':{'selected_local_candidate_indices':None,'meaning_alignment':None,
        'pos_alignment':None,'no_matching_native_sense':None,'is_compositional':None,
        'canonical_scene1341_sense_id':None,'reviewer':None,'review_timestamp':None,
        'qa_cg':None,'qa_mu':None},'decision_status':'PENDING_PER_ROW_CONTEXTUAL_SEMANTIC_REVIEW',
      'content_qa_certified':False,'release_allowed':False}
   wf.write(json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n')
assert n==63690 and len(seen_expr)==3000
summary={'version':'V85','master_final_sha256':FINAL_SHA,'v84_poly_dossier_sha256':POLY_SHA,
 'output':{'filename':rows_out.name,'sha256':sha(rows_out),'bytes':rows_out.stat().st_size},
 'counts':{'original_master_rows':n,'unique_final_row_ids':len(unique),'unique_expressions':len(seen_expr),
           'distinct_scenes':len(scene_ids),'priority_rows':dict(pri)},
 'interpretation':'A separate, contextual Sense-choice slot exists per original Master row, not merely per English expression. Candidate list contains source English glosses and all relevant POS. None are selected or certified. Same global Sense can be linked to several rows only after adjudication.',
 'authoritative_reviewed_v13_not_joined':True,'global_canonical_sense_ids_authorized':0,
 'release_allowed':False}
(OUT/'CGMASTER_V85_ROW_LEVEL_ADJUDICATION_REPORT.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
