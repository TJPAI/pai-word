import gzip,json,re,collections,hashlib
from pathlib import Path
import cmudict
src=Path('/mnt/data/CGMASTER_V108_BATCH001_100SCENES_FULL_KAIKKI_EVIDENCE_EXPANDED.jsonl.gz')
rows=[]
with gzip.open(src,'rt') as f:
 for l in f:
  x=json.loads(l)
  if x['scene_id']=='SC50-0001':rows.append(x)
assert len(rows)==294
D=cmudict.dict()
V={'AA':'ɑ','AE':'æ','AH':'ʌ','AO':'ɔ','AW':'aʊ','AY':'aɪ','EH':'ɛ','ER':'ɝ','EY':'eɪ','IH':'ɪ','IY':'i','OW':'oʊ','OY':'ɔɪ','UH':'ʊ','UW':'u'}
C={'B':'b','CH':'tʃ','D':'d','DH':'ð','F':'f','G':'g','HH':'h','JH':'dʒ','K':'k','L':'l','M':'m','N':'n','NG':'ŋ','P':'p','R':'r','S':'s','SH':'ʃ','T':'t','TH':'θ','V':'v','W':'w','Y':'j','Z':'z','ZH':'ʒ'}
def arp(s):
 toks=[]
 for p in s:
  base=re.sub('[012]','',p);stress=p[-1] if p[-1:].isdigit() else ''
  v=V.get(base,C.get(base))
  if v is None:return None
  toks.append(v)  # segmental-only provisional IPA; retain no incorrectly placed stress marks
 return ''.join(toks)
def lookup(w):
 w=w.lower(); vs=D.get(w)
 if vs:return arp(vs[0]),'EXACT_CMU_LEXEME'
 if '-' in w:
  parts=w.split('-');xx=[lookup(z)[0] for z in parts]
  if all(xx):return ''.join(xx),'COMPOSED_HYPHEN_CMU_TEST'
 return None,'MISSING_CMU'
EDITORIAL_SEGMENTAL_DRAFT={'ringtone':'rɪŋtoʊn','pillowcase':'pɪloʊkeɪs','bedsheet':'bɛdʃit','duvet':'duveɪ'}
counts=collections.Counter();out=[]
for x in rows:
 expr=x['expression'];parts=re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*",expr)
 resolved=[lookup(t) for t in parts]
 phon=' '.join(k for k,typ in resolved if k) if all(k for k,typ in resolved) and parts else None
 status=('CMU_TOKEN_COMPOSED_PREVIEW_ONLY' if len(parts)>1 else 'CMU_EXACT_LEXEME_PREVIEW_ONLY') if phon else 'IPA_MISSING_NEEDS_EDITOR'
 if not phon and expr.lower() in EDITORIAL_SEGMENTAL_DRAFT:
  phon=EDITORIAL_SEGMENTAL_DRAFT[expr.lower()];status='EDITORIAL_SEGMENTAL_PREVIEW_ONLY_NOT_KAIKKI'
 counts[status]+=1
 out.append({'scene_id':x['scene_id'],'source_final_row':x['source_final_row'],'record_id':x['original_record_id_candidate'], 'canonical_sense_id':None,
 'question_page':{'english_expression':expr,'cue_zh':x['original_sense_zh'],'ipa':('/'+phon+'/' if phon else None),'ipa_status':status,'audio_text':expr,'content_complete':bool(phon)},
 'pronunciation_source':('EDITORIAL_PROVISIONAL_NOT_NATIVE_SOURCE' if status.startswith('EDITORIAL') else 'CMUdict (supplemental, NOT Kaikki native exact-phrase proof)') if phon else None,
 'unresolved_tokens':[t for t,(z,_ ) in zip(parts,resolved) if not z],
 'cg_qa_status':'DEFERRED','mu_qa_status':'DEFERRED','release_allowed':False})
assert len({r['record_id'] for r in out})==294
payload={'version':'V168','scope':'SC50-0001 question page test overlay','count':len(out),'counts':dict(counts),'source_master_sha256':rows[0]['master_sha256'], 'pronunciation_source':'CMUdict supplemental, not Kaikki; segmental-only broad IPA omits lexical stress, and composed multiword pronunciations are unverified for connected speech','ready':0,'formal_certification':False,'records':out}
p=Path('/mnt/data/CGMASTER_V168_SC0001_294_QUESTION_PAGE_TEST_OVERLAY_20261114.json');p.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps(counts,ensure_ascii=False));print('first',json.dumps(out[:3],ensure_ascii=False));print('missing',[(x['question_page']['english_expression'],x['unresolved_tokens']) for x in out if x['question_page']['ipa'] is None]);print(p,p.stat().st_size)