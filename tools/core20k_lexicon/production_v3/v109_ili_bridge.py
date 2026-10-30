#!/usr/bin/env python3
"""V109 verified ILI bridge. CILI WN3.0 tab + OEWN2025 JSON + OMW-cmn."""
import zipfile,io,json,urllib.request,hashlib,collections,pathlib,re
P=pathlib.Path('tools/core20k_lexicon/production_v3/v109_output');P.mkdir(parents=True,exist_ok=True)
src=pathlib.Path('source-evidence')
z=zipfile.ZipFile(src/'oewn2025.download')
oe={}
for fn in z.namelist():
 if fn.startswith(('noun.','verb.','adj.','adv.')) and fn.endswith('.json'):
  for sid,rec in json.loads(z.read(fn)).items():
   if rec.get('ili'): oe[rec['ili']]=sid
raw=(src/'omw_cmn.download').read_text(encoding='utf-8')
cmn=collections.defaultdict(set)
for row in raw.splitlines():
 if row.startswith('#'):continue
 t=row.split('\t')
 if len(t)==3 and t[1]=='cmn:lemma' and t[2].strip():cmn[t[0]].add(t[2])
url='https://raw.githubusercontent.com/globalwordnet/cili/a895d7ecb18019dda3443f98901e59d81ce8722b/ili-map-pwn30.tab'
with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Core20K-V109'}),timeout=120) as f: b=f.read()
(P/'cili_wn30_sha256.txt').write_text(hashlib.sha256(b).hexdigest()+'  ili-map-pwn30.tab\n')
lines=b.decode('utf8').splitlines()
(P/'mapping_first_lines.txt').write_text('\n'.join(lines[:8]))
wnmap=collections.defaultdict(set)
for line in lines:
 t=line.strip().split('\t')
 if len(t)<2:continue
 for v in t:
  v=v.strip().split('/')[-1]
  if re.fullmatch(r'i\d+',v):ili=v
  elif re.fullmatch(r'\d{8}-[nvars]',v):wn=v
 if 'ili' in locals() and 'wn' in locals():wnmap[wn].add(ili)
 if 'ili' in locals():del ili
 if 'wn' in locals():del wn
rows=[]
for wn,words in cmn.items():
 il=wnmap.get(wn,set())
 targets=[(ili,oe[ili]) for ili in il if ili in oe]
 if targets:rows.append({'wn30':wn,'ili':sorted(il),'oewn2025_synsets':sorted(set(s for i,s in targets)),'cmn_count':len(words),'chinese':sorted(words)})
with (P/'mapped_cmn_concepts.jsonl').open('w') as f:
 for r in rows:f.write(json.dumps(r,ensure_ascii=False)+'\n')
stats={'mapping_sha256':hashlib.sha256(b).hexdigest(),'wn30_ili_mappings':sum(len(v) for v in wnmap.values()),'wn30_unique':len(wnmap),'oewn_ili_count':len(oe),'omw_concepts':len(cmn),'verified_ili_join_concepts':len(rows),'ambiguous_ili':sum(len(r['ili'])!=1 or len(r['oewn2025_synsets'])!=1 for r in rows),'matched_chinese_lexemes':sum(r['cmn_count'] for r in rows),'mapped_examples':rows[:5]}
(P/'report.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in stats.items() if k!='mapped_examples'},indent=2),flush=True)
assert len(wnmap)>100000,'mapping format or size unexpected'
assert len(rows)>10000,'mapping too low; check format'
