#!/usr/bin/env python3
"""V122 evidence admission gate. Validate a supplied JSONL; never certify by import."""
import argparse,json,hashlib,pathlib,sys
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('--expected-sha256',required=True);p.add_argument('--expected-count',type=int,default=90);a=p.parse_args()
raw=pathlib.Path(a.source).read_bytes();actual=hashlib.sha256(raw).hexdigest()
assert actual==a.expected_sha256,(actual,a.expected_sha256)
rows=[json.loads(line) for line in raw.splitlines() if line.strip()]
assert len(rows)==a.expected_count,(len(rows),a.expected_count)
keys=set()
required=('sense_key','rank','lemma','pos','definition_en','gloss_zh_editorial_draft','source_lexemes','ili','wn30','v119_gloss_zh_draft','v119_editorial_status','semantically_certified','production_ready')
for i,row in enumerate(rows,1):
 for k in required:
  assert k in row,(i,k)
 assert row['sense_key'] and row['sense_key'] not in keys,(i,'sense key duplicate or blank')
 keys.add(row['sense_key'])
 assert row['rank']>=1 and row['rank']<=20000,(i,'rank')
 assert row['definition_en'].strip() and row['v119_gloss_zh_draft'].strip(),(i,'blank')
 assert row['semantically_certified'] is False,(i,'certification not permitted')
 assert row['production_ready'] is False,(i,'production not permitted')
print(json.dumps({'status':'PASS_EVIDENCE_ONLY_NOT_CERTIFIED','count':len(rows),'unique_keys':len(keys),'sha256':actual}))
