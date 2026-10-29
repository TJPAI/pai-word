#!/usr/bin/env python3
"""V98 reproducible upstream-source fetch; NEVER mark missing files frozen."""
import json, hashlib, pathlib, urllib.request, subprocess, os, time
out=pathlib.Path('tools/core20k_lexicon/production_v3/v98_output')
out.mkdir(parents=True,exist_ok=True)
sources=[
 ('oewn2025','https://en-word.net/static/english-wordnet-2025-json.zip'),
 ('ecdict','https://raw.githubusercontent.com/skywind3000/ECDICT/ab22ad36302cafc6349a050e2b60894855208055/ecdict.csv'),
 ('omw_cmn','https://raw.githubusercontent.com/globalwordnet/omw/e3b5ac103f86b743a1c0e3079675aaf0ef2cbf88/wns/cmn/wn-data-cmn.tab'),
 ('kaikki_en','https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl'),
 ('kaikki_zh','https://kaikki.org/dictionary/Chinese/kaikki.org-dictionary-Chinese.jsonl'),
]
rows=[]
for name,url in sources:
 row={'source':name,'url':url,'status':'PENDING','sha256':None}
 try:
  # bounded size avoids runner exhaustion; provenance still records downloaded bytes
  p=out/(name+'.download')
  req=urllib.request.Request(url,headers={'User-Agent':'PAI-Core20K-Source-Freeze/1.0'})
  with urllib.request.urlopen(req,timeout=90) as resp,p.open('wb') as f:
   size=0;sha=hashlib.sha256()
   while True:
    b=resp.read(1048576)
    if not b: break
    size+=len(b)
    if size>300_000_000: raise RuntimeError('source exceeds 300 MB cap')
    sha.update(b);f.write(b)
  row.update(status='DOWNLOADED_UNVERIFIED_RELEASE',sha256=sha.hexdigest(),bytes=size)
 except Exception as e:
  row.update(status='BLOCKED',error=str(e)[:300])
  (out/(name+'.download')).unlink(missing_ok=True)
 rows.append(row)
 (out/'manifest.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False))
 print(name,row['status'],row['sha256'],flush=True)
(out/'manifest.json').write_text(json.dumps(rows,indent=2))
# Do not certify dump version by mutable redirect.
if any(r['status']!='DOWNLOADED_UNVERIFIED_RELEASE' for r in rows):
 raise SystemExit('BLOCKED: missing raw source; no selection permitted')
print('All bytes downloaded but release/synset verification still required.')
