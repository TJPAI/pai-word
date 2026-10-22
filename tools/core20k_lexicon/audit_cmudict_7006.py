#!/usr/bin/env python3
"""Audit CMUdict ARPABET candidates; no IPA or KU is promoted."""
import argparse,collections,gzip,json,hashlib,pathlib,cmudict
p=argparse.ArgumentParser()
p.add_argument('--mvp',required=True);p.add_argument('--out',required=True)
a=p.parse_args();src=pathlib.Path(a.mvp);dest=pathlib.Path(a.out);dest.mkdir(parents=True,exist_ok=True)
words=[x for x in json.load(gzip.open(src,'rt',encoding='utf-8'))['entries'] if x.get('legacy_rank') is None]
assert len(words)==7006
dictionary=cmudict.dict(); c=collections.Counter()
out=dest/'cmudict_7006_candidates.jsonl'
with out.open('w',encoding='utf-8') as f:
 for word in words:
  candidates=dictionary.get(word['lemma'].casefold(),[])
  status='NO_CMU_ENTRY' if not candidates else ('MULTIPLE_PRONUNCIATIONS_REVIEW' if len(candidates)>1 else 'SINGLE_PRONUNCIATION_CANDIDATE')
  c[status]+=1
  f.write(json.dumps({'rank':word['rank'],'lemma':word['lemma'],'arpabet_candidates':candidates,'us_ipa':None,'status':status,'quality':'UNVERIFIED','release_allowed':False},ensure_ascii=False)+'\n')
assert sum(c.values())==7006
report={'input_count':7006,'classes':dict(c),'match_count':7006-c['NO_CMU_ENTRY'],'accepted_us_ipa':0,'production_ready_ku':0,'license_review':'PENDING','input_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
(dest/'audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
