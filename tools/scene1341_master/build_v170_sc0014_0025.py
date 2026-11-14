#!/usr/bin/env python3
"""Source-preserving SC0014-0025 (3047 card) Kaikki native pronunciation evidence with isolated CMU preview fallback.
No field implies linguistic approval, canonical sense resolution, or release. Exact source provenance retained.
"""
import gzip, json, re, collections, hashlib, os, sys, time
from pathlib import Path
try:import orjson
except ImportError:orjson=None
try:import cmudict
except ImportError:cmudict=None
SOURCE=Path('/mnt/data/CGMASTER_V108_BATCH001_100SCENES_FULL_KAIKKI_EVIDENCE_EXPANDED.jsonl.gz')
KAIKKI=Path('/mnt/data/kaikki_complete_20261111.jsonl.gz')
OUT=Path('/mnt/data/CGMASTER_V170_SC0014_0025_3047_KAIKKI_QUESTION_PAGE_TEST_OVERLAY_20261114.json')
rows=[]
with gzip.open(SOURCE,'rt') as f:
 for line in f:
  x=json.loads(line)
  if 14<=int(x['scene_id'].split('-')[-1])<=25:rows.append(x)
assert len(rows)==3047,len(rows)
assert len({x['original_record_id_candidate'] for x in rows})==3047
assert [x['source_final_row'] for x in rows]==list(range(3133,6180))
R=re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*")
terms={x['expression'].strip().casefold() for x in rows}
tokens={t.casefold() for x in rows for t in R.findall(x['expression'])}
# Raw exact phrase priority, then component native evidence. No invented native phrase IPA.
need=terms|tokens
ipa_re=re.compile(r'^/(?!/)[^/\]\[\r\n]+/$')
found=collections.defaultdict(list)
entries_seen=0
start=time.monotonic()
with gzip.open(KAIKKI,'rb') as f:
 for lineno,raw in enumerate(f,1):
  try:x=orjson.loads(raw) if orjson else json.loads(raw)
  except Exception:continue
  entries_seen+=1
  if x.get('lang_code')!='en':continue
  w=x.get('word','').strip().casefold()
  if w not in need:continue
  sounds=[]
  for s in x.get('sounds') or []:
   ipa=s.get('ipa')
   if isinstance(ipa,str) and ipa_re.fullmatch(ipa):
    sounds.append({'ipa':ipa,'tags':s.get('tags') or [],'line':lineno,'pos':x.get('pos','')})
  if sounds:found[w].extend(sounds)
# Retain full source candidates; do not naively merge regional or POS evidence.
D=cmudict.dict() if cmudict else {}
V={'AA':'ɑ','AE':'æ','AH':'ʌ','AO':'ɔ','AW':'aʊ','AY':'aɪ','EH':'ɛ','ER':'ɝ','EY':'eɪ','IH':'ɪ','IY':'i','OW':'oʊ','OY':'ɔɪ','UH':'ʊ','UW':'u'}
C={'B':'b','CH':'tʃ','D':'d','DH':'ð','F':'f','G':'g','HH':'h','JH':'dʒ','K':'k','L':'l','M':'m','N':'n','NG':'ŋ','P':'p','R':'r','S':'s','SH':'ʃ','T':'t','TH':'θ','V':'v','W':'w','Y':'j','Z':'z','ZH':'ʒ'}
def cmu(w):
 w=w.casefold().replace('’',"'")
 vals=D.get(w)
 if vals:
  a=[V.get(re.sub('[012]','',t),C.get(re.sub('[012]','',t))) for t in vals[0]]
  if all(a):return ''.join(a)
 if '-' in w:
  a=[cmu(t) for t in w.split('-')]
  if all(a):return ''.join(a)
 return None

def unique_sounds(term):
 arr=found.get(term.casefold(),[])
 return sorted(set(x['ipa'] for x in arr))
summary=collections.Counter();out=[];examples={}
for x in rows:
 expr=x['expression']; words=R.findall(expr); exact=unique_sounds(expr.strip());
 token_native=[unique_sounds(w) for w in words]; token_cmu=[cmu(w) for w in words]
 selected=None; category=None; extra=None
 if len(exact)==1:
  selected=exact[0];category='KAIKKI_NATIVE_EXACT_SINGLE_PHONEMIC_TEST_ONLY'
 elif len(exact)>1:
  # Multiple source readings; do not silently pick first; CMU optional preview segregated.
  p=cmu(expr.strip()) if len(words)==1 else None
  if p:selected='/'+p+'/';category='CMU_PREVIEW_WITH_KAIKKI_MULTIVARIANT_HOLD'
  elif len(words)>1 and all(token_cmu):
   selected='/'+' '.join(token_cmu)+'/';category='CMU_COMPOSED_WITH_KAIKKI_MULTIVARIANT_HOLD'
  else:category='KAIKKI_MULTIVARIANT_HOLD_NO_IPA'
 elif len(words)>1 and all(len(v)==1 for v in token_native):
  selected='/'+' '.join(v[0][1:-1] for v in token_native)+'/';category='KAIKKI_COMPONENT_COMPOSED_PREVIEW_ONLY_NOT_NATIVE_PHRASE'
 elif len(words)>1 and all(token_cmu):
  selected='/'+' '.join(token_cmu)+'/';category='CMU_TOKEN_COMPOSED_PREVIEW_ONLY'
 elif len(words)==1 and token_cmu and token_cmu[0]:
  selected='/'+token_cmu[0]+'/';category='CMU_EXACT_LEXEME_PREVIEW_ONLY'
 else:category='IPA_MISSING_REVIEW_REQUIRED'
 summary[category]+=1
 if category not in examples:examples[category]=[expr]
 elif len(examples[category])<8:examples[category].append(expr)
 rec={
 'scene_id':x['scene_id'],'scene_name':x['scene_name'],
 'source_final_row':x['source_final_row'],'record_id':x['original_record_id_candidate'],
 'canonical_sense_id':None,'question_page':{
 'english_expression':expr,'cue_zh':x['original_sense_zh'],
 'ipa':selected,'ipa_status':category,'audio_text':expr,
 'content_complete':bool(expr and x['original_sense_zh'] and selected)},
 'kaikki_source':{'archive_sha256':'4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99',
 'native_exact_headword_phonemic_candidates':exact,
 'native_exact_sound_evidence':found.get(expr.strip().casefold(),[]),
 'component_lookup':[{ 'token':w,'native_phonemic_candidates':v } for w,v in zip(words,token_native)]},
 'pronunciation_policy':'PREVIEW_CANDIDATE_ONLY_NOT_AUTHORIZED_SENSE_OR_NATIVE_PHRASE_IPA',
 'cg_qa_status':'DEFERRED','mu_qa_status':'DEFERRED','release_allowed':False
 }
 out.append(rec)
assert len(out)==3047 and len({r['record_id'] for r in out})==3047
counts=dict(summary)
report={'version':'V170','scope':'SC50-0014..SC50-0025','record_count':3047,
 'scene_count':len({x['scene_id'] for x in out}),
 'source_master_sha256':rows[0]['master_sha256'],
 'kaikki_archive_sha256':'4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99',
 'kaikki_entries_scanned':entries_seen,'native_source_headwords_with_phonemic':len(found),
 'counts':counts,'ipa_nonempty':sum(bool(x['question_page']['ipa']) for x in out),
 'missing_ipa':sum(not x['question_page']['ipa'] for x in out),
 'status_examples':examples,
 'formal_approved':0,'release_allowed':False,'records':out}
OUT.write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='records'},ensure_ascii=False))
print('elapsed',round(time.monotonic()-start,2))