#!/usr/bin/env python3
"""CG-MASTER V160: context-aware, non-releasing audit for 34 multi-US-reading records.
Source V158 is a Kaikki evidence queue; author examples provide editorial POS, never Reviewed Master POS.
"""
import json,collections
from pathlib import Path
BASE=Path('/mnt/data')
source=json.loads((BASE/'CGMASTER_V158_SC0011_0014_86_POS_REGION_QA_QUEUE_20261114.json').read_text())
drafts={}
for name in ('CGMASTER_V128_SC0011_ALL255_BILINGUAL_DRAFT_20261114.json','CGMASTER_V134_SC0012_ALL253_BILINGUAL_DRAFT_20261114.json','CGMASTER_V142_SC0013_ALL245_BILINGUAL_DRAFT_20261114.json','CGMASTER_V147_SC0014_ALL243_BILINGUAL_DRAFT_20261114.json'):
 d=json.loads((BASE/name).read_text());
 for r in d['records']:
  assert r['record_id'] not in drafts
  drafts[r['record_id']]=(r,name)
# Manually analyzed grammar and meaning of each example, not a verified Master semantic assertion.
POS={
('SC50-0011','channel'):'noun',('SC50-0011','series'):'noun',('SC50-0011','documentary'):'noun',
('SC50-0012','joke'):'noun',('SC50-0012','gossip'):'noun',('SC50-0012','boundary'):'noun',('SC50-0012','parent'):'noun',('SC50-0012','daughter'):'noun',('SC50-0012','grandparent'):'noun',('SC50-0012','cousin'):'noun',('SC50-0012','message'):'noun',('SC50-0012','frustrated'):'adj',('SC50-0012','interested'):'adj',('SC50-0012','honest'):'adj',
('SC50-0013','care'):'noun',('SC50-0013','carer'):'noun',('SC50-0013','supervision'):'noun',('SC50-0013','grandparent'):'noun',('SC50-0013','mobility'):'noun',('SC50-0013','parent'):'noun',('SC50-0013','guardian'):'noun',('SC50-0013','mobile'):'adj',('SC50-0013','calm'):'adj',('SC50-0013','uncomfortable'):'adj',('SC50-0013','nauseous'):'adj',('SC50-0013','steady'):'adj',('SC50-0013','fall'):'noun',
('SC50-0014','foster'):'verb',('SC50-0014','veterinarian'):'noun',('SC50-0014','parasite'):'noun',('SC50-0014','obedience'):'noun',('SC50-0014','calm'):'adj',('SC50-0014','obedient'):'adj',('SC50-0014','lethargic'):'adj'}
rows=[]
for r in source['records']:
 if r['review_status']!='MULTIPLE_US_IPA_WITHIN_POS_NEEDS_MANUAL_QA':continue
 q,fn=drafts[r['record_id']]
 assert q['source_final_row']==r['source_final_row'] and q['question_page']['english_expression']==r['expression']
 key=(r['scene_id'],r['expression']);target=POS[key]
 candidates=collections.defaultdict(set)
 for tag,parts in r['region_pos_variants'].items():
  for val in parts.get(target,[]):candidates[tag].add(val)
 union=sorted(set().union(*candidates.values())) if candidates else []
 ga=set(candidates['General-American']);us=set(candidates['US'])
 conflicts=bool(ga and us and ga!=us)
 not_present=not union
 if not_present: status='TARGET_CONTEXT_POS_NO_US_EVIDENCE_BLOCK'
 elif conflicts:status='GA_US_TARGET_POS_CONFLICT_BLOCK'
 elif len(union)>1:status='MULTIPLE_US_TARGET_POS_READINGS_MANUAL_QA'
 else:status='TARGET_POS_US_SINGLE_AFTER_CONTEXT_REVIEW_QA_HOLD'
 if r['expression']=='carer': flags=['BRITISH_USAGE_TARGET_CANNOT_AUTO_ASSUME_AMERICAN_STANDARD']
 else: flags=[]
 if r['expression']=='foster':flags+=['TARGET_VERB_MISSING_IN_US_TAGGED_SOURCE_EVIDENCE']
 if r['expression']=='fall':flags+=['TARGET_NOUN_MISSING_IN_US_TAGGED_SOURCE_EVIDENCE']
 if r['expression'] in ('care','guardian'):flags+=['GA_US_REGION_VARIANT_DISAGREEMENT']
 if target not in r['region_pos_variants'].get('General-American',{}) and target not in r['region_pos_variants'].get('US',{}): flags+=['TARGET_POS_NOT_IN_US_REGION_TAGS']
 rows.append(dict(scene_id=r['scene_id'],record_id=r['record_id'],source_final_row=r['source_final_row'],expression=r['expression'],meaning_zh_source=r['meaning_zh_source'],
 author_draft_file=fn,author_draft_example_en=q['answer_page']['example_en'],author_draft_usage_note=q['answer_page']['usage_note'],target_pos_editorial_inferred=target,
 source_pos_status='EDITORIAL_INFERENCE_NOT_REVIEWED_MASTER',source_canonical_sense_id=q['canonical_sense_id'],source_cg_qa_status=q['cg_qa_status'],
 us_region_target_pos_variants={k:sorted(v) for k,v in candidates.items() if v},us_region_union_target_pos_variants=union,
 source_kaikki_evidence=r['source_evidence'],source_kaikki_sha256=r['source_sha256'],qa_queue_status=status,risk_flags=flags,
 suggested_ipa=None,approved_ipa=None,formal_sense_id=None,qa_approved=False,release_allowed=False))
assert len(rows)==34 and len(set(x['record_id'] for x in rows))==34
counts=dict(collections.Counter(r['qa_queue_status'] for r in rows))
print(counts)
out=dict(version='V160',input='V158',source_kaikki_sha256=source['source_sha256'],scope='SC50-0011 through SC50-0014, 34 target-context POS triages',counts=counts,
 records=rows,formal_ready=0,release_allowed=False,
 limitations=['Examples and usage notes are author drafts, not Reviewed Master Sense/POS.','No automatic accent preference between General-American and US or among regional variants.','All proposed or approved IPA remains null.'])
p=BASE/'CGMASTER_V160_SC0011_0014_34_MULTIREADING_TARGET_CONTEXT_QA_20261114.json';p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(str(p))