#!/usr/bin/env python3
"""V88 independent triage: 5059 V13/FNAL gloss divergences plus explicit semantic spot checks.
Never auto-link a Kaikki meaning or claim certified Sense. Preserve authority and provenance.
"""
import gzip,json,csv,hashlib,collections,unicodedata
from pathlib import Path
ROOT=Path('/mnt/data'); OUT=ROOT/'v88';OUT.mkdir(exist_ok=True)
SRC=ROOT/'v87/CGMASTER_V87_8523_V13_UNRESOLVED_SOURCE_RECOVERY.jsonl.gz'
LIB=ROOT/'v83/CGMASTER_V83_KAIKKI_EXACT_HEADWORD_CANDIDATE_SENSE_LIBRARY.jsonl.gz'
REP87=json.loads((ROOT/'v87/CGMASTER_V87_SOURCE_RECOVERY_REPORT.json').read_text())
REP83=json.loads((ROOT/'v83/CGMASTER_V83_FULL1341_KAIKKI_EVIDENCE_REPORT.json').read_text())
def sha(p):
 with open(p,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
assert sha(SRC)==REP87['file']['sha256'];assert sha(LIB)==REP83['file_sha256']['candidate_sense_library']
N=lambda s:' '.join(unicodedata.normalize('NFKC',s or '').casefold().split())
lex={}
with gzip.open(LIB,'rt') as f:
 for ln in f:
  z=json.loads(ln);lex[z['lookup_key']]=z
manual={
 # Exact V13 audit row number, source-aware decisions; local index in frozen V83 candidate library, NOT permanent Sense.
 6:(None,'HOLD_PARTIAL_KAIKKI','snooze has nap, alarm snooze and postponement senses; available pack is truncated and source gloss is broader.'),
 60:(None,'HOLD_PARTIAL_KAIKKI','vibrate physical vibration vs alerting use; truncated candidates do not establish one precise contextual sense.'),
 73:(None,'HOLD_PARTIAL_KAIKKI','rush hurried activity is plausible, but only truncated sense snippets available.'),
 87:(0,'SUGGEST_PREFERRED_CONTEXT_CHECK','schedule has a time-plan noun sense; source gloss may describe a subset of a dayâs schedule.'),
 115:(None,'HOLD_PARTIAL_KAIKKI','comforter padded bedding sense is in truncated samples; not a full source entry.'),
 147:(0,'SUGGEST_PREFERRED_CONTEXT_CHECK','headache physical pain is distinct from figurative nuisance.'),
 199:(None,'HOLD_NO_USABLE_EXACT_KAIKKI','toast: only unrelated PostgreSQL acronym in truncated source evidence. Do NOT attach this candidate to bread.'),
 246:(None,'HOLD_REVIEW_SUBTYPE','deodorant controls odor, whereas antiperspirant additionally reduces perspiration; do not infer antiperspirant property.'),
 268:(None,'HOLD_PARTIAL_KAIKKI_SPLIT_USAGE','wash up includes UK dishwashing and US washing face/hands: two meanings must remain distinct.'),
 284:(None,'HOLD_PARTIAL_KAIKKI','bath mat source evidence means water-absorbing mat and slip prevention, but is not proof every bath mat is nonslip.'),
 428:(0,'SUGGEST_PREFERRED_CONTEXT_CHECK','pants has distinct US trousers vs UK underwear senses: garment context is trousers.'),
 458:(9,'SUGGEST_PREFERRED_CONTEXT_CHECK','wardrobe can mean an entire clothing collection, as distinguished from a storage cabinet.'),
 459:(None,'HOLD_PARTIAL_KAIKKI','closet evidence only truncated unrelated adjective/verb senses, lacks safe noun source mapping.'),
 477:(0,'SUGGEST_PREFERRED_CONTEXT_CHECK','scarf worn around neck distinct from other head covering or woodworking senses.'),
 627:(None,'HOLD_PARTIAL_KAIKKI','closet noun not fully covered in these evidence packs.'),
 673:(6,'SUGGEST_PREFERRED_CONTEXT_CHECK','wardrobe physical clothing cupboard distinct from personal clothing collection.'),
}
# Full row-level triage for all 5059 (all candidates, no elected sense).
full=OUT/'CGMASTER_V88_5059_V13_GLOSS_DIVERGENCE_KAIKKI_TRIAGE.jsonl.gz'
counts=collections.Counter();scenes=set();ids=set();examples=collections.defaultdict(list)
with gzip.open(SRC,'rt') as reader,gzip.open(full,'wt',encoding='utf8',compresslevel=6) as writer:
 for ln in reader:
  x=json.loads(ln)
  if x['recovery_class']!='ONE_EXPRESSION_SOURCE_ROW_GLOSS_DIVERGENCE_REVIEW':continue
  i=x['v13_row'];assert i not in ids;ids.add(i);scenes.add(x['scene_id'])
  k=N(x['v13_expression']);entry=lex.get(k);items=entry['candidate_senses'] if entry else []
  quality=entry['status'] if entry else 'NO_EVIDENCE_IN_21_PACKS'
  if quality=='FULL_EXACT_HEADWORD':label='FULL_KAIKKI_CANDIDATES_UNSELECTED'
  elif quality=='PARTIAL_TRUNCATED_SAMPLES_ONLY':label='PARTIAL_KAIKKI_SAMPLES_NOT_FULL_SENSE'
  else:label='NO_USABLE_KAIKKI_EVIDENCE_IN_21_PACKS'
  counts[label]+=1
  rec={'v13_audit_row':i,'v13_candidate_id_NOT_CANONICAL_SENSE':x['candidate_id_NOT_CANONICAL_SENSE'],
    'scene_id':x['scene_id'],'expression':x['v13_expression'],
    'v13_original_zh':x['v13_original_zh'],'v13_working_zh':x['v13_working_zh'],
    'final_original_candidate':x['candidate_source_rows'][0],
    'provisional_final_source_row_NOT_AUTHORIZED':x['provisional_unique_expression_source_row_NOT_AUTHORIZED'],
    'kaikki_evidence_type':label,'kaikki_candidate_sense_count':len(items),
    'kaikki_native_senses_all_unselected':[{'local_index_NOT_SENSE_ID':idx,'pos':s.get('pos'),
    'english_glosses':s.get('glosses') or ([s.get('gloss_sample_truncated_possible')] if s.get('gloss_sample_truncated_possible') else []),
    'native_sense_index':s.get('native_entry_sense_index_as_extracted'),
    'source_pack':s.get('source_pack'),'source_pack_sha256':s.get('source_pack_sha256'),
    'source_line':s.get('source_line')} for idx,s in enumerate(items)],
    'proposed_semantic_decision':None,'qa_cg':None,'qa_mu':None,'canonical_sense_id':None,'release_allowed':False}
  writer.write(json.dumps(rec,ensure_ascii=False,separators=(',',':'))+'\n')
  if len(examples[label])<3:examples[label].append({'v13_row':i,'expression':x['v13_expression'],'v13_zh':x['v13_original_zh'],'master_zh':x['candidate_source_rows'][0]['final_original_sense_zh']})
assert len(ids)==5059
# Explicit editorial assessment against actual frozen Kaikki candidates, checking expected gloss text.
pilot=[];sourceids=set()
with gzip.open(full,'rt',encoding='utf8') as f:
 for ln in f:
  r=json.loads(ln);i=r['v13_audit_row']
  if i not in manual:continue
  idx,status,reason=manual[i]
  sel=next((c for c in r['kaikki_native_senses_all_unselected'] if c['local_index_NOT_SENSE_ID']==idx),None) if idx is not None else None
  assert idx is None or sel is not None, (i,idx)
  if sel and status.startswith('SUGGEST'):assert r['kaikki_evidence_type']=='FULL_KAIKKI_CANDIDATES_UNSELECTED'
  pilot.append({'v13_audit_row':i,'scene_id':r['scene_id'],'expression':r['expression'],
  'v13_zh':r['v13_original_zh'],'source_final_zh':r['final_original_candidate']['final_original_sense_zh'],
  'editorial_candidate_local_index_NOT_SENSE_ID':idx,'source_candidate_evidence':sel,
  'editorial_status':status,'editorial_rationale':reason,
  'must_review_original_context':True,'must_independently_verify_original_kaikki':True,
  'qa_cg':'NOT_REVIEWED','qa_mu':'NOT_REVIEWED','canonical_scene1341_sense_id':None,'release_allowed':False})
assert len(pilot)==len(manual)
pilot.sort(key=lambda a:a['v13_audit_row'])
pilotfile=OUT/'CGMASTER_V88_16_REAL_SEMANTIC_EDITORIAL_ASSESSMENTS.json'
pilotfile.write_text(json.dumps({'version':'V88','type':'EDITORIAL_ASSESSMENTS_NOT_CERTIFIED','source_sha256':{'v87':sha(SRC),'v83_library':sha(LIB)},'count':len(pilot),'records':pilot,'release_allowed':False},ensure_ascii=False,indent=2))
report={'version':'V88','authority_sha256':{'v87_workset':sha(SRC),'v83_lexical':sha(LIB)},'census':{'divergence_rows':len(ids),'scenes':len(scenes),'types':dict(counts),'explicit_semantic_assessments':len(pilot),'suggested_single_lexical_candidates':sum(x['editorial_status']=='SUGGEST_PREFERRED_CONTEXT_CHECK' for x in pilot),'held_editorial':sum(x['editorial_status']!='SUGGEST_PREFERRED_CONTEXT_CHECK' for x in pilot)},'output_sha256':{'triage':sha(full),'pilot':sha(pilotfile)},'output_bytes':{'triage':full.stat().st_size,'pilot':pilotfile.stat().st_size},'sample_cases':dict(examples),'note':'No automated meaning alignment. 16 small explicit editorial assessments; all other 5043 rows are unreviewed. Even suggested candidates are provisional and require source validation and independent QA. No Sense ID or release.','release_allowed':False}
(OUT/'CGMASTER_V88_GLOSS_DIVERGENCE_AND_EDITORIAL_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
# independent structural check source row integrity & all pending
assert len({x['v13_audit_row'] for x in pilot})==len(pilot)
qa={'version':'V88-QA','source_pin_verified':True,'full_workset_rows':5059,'unique_v13_rows':len(ids),'editorial_assessments':len(pilot),'no_formal_sense_ids':True,'no_release':True,'structural_errors':[]}
(OUT/'CGMASTER_V88_INDEPENDENT_STRUCTURAL_QA.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2))
print(json.dumps(report['census'],ensure_ascii=False,indent=2));print(report['output_sha256'])
