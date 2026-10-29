import gzip,json,urllib.request,hashlib,collections,pathlib
p=pathlib.Path('core20k-test/data/core20k-runtime.json.gz')
raw=p.read_bytes()
obj=json.loads(gzip.decompress(raw))
print('TOP_LEVEL', type(obj).__name__, list(obj)[:12] if isinstance(obj,dict) else len(obj),flush=True)
out=pathlib.Path('tools/core20k_lexicon/production_v3/v101_output');out.mkdir(parents=True,exist_ok=True)
def collect(o):
 if isinstance(o,list):
  return o
 if isinstance(o,dict):
  for k in ['words','headwords','entries','items','data','lexicon']:
   if isinstance(o.get(k),list):return o[k]
 return []
a=collect(obj)
print('COLLECTION_LENGTH',len(a),'ROW_SAMPLE',str(a[0])[:800] if a else '',flush=True)
(out/'runtime_schema.json').write_text(json.dumps({'top_type':type(obj).__name__,'keys':list(obj)[:25] if isinstance(obj,dict) else [],'rows':len(a),'sample':a[:2]},ensure_ascii=False,indent=2))
if not a:raise SystemExit('Runtime schema unsupported; no claim of matching')
(out/'runtime_facts.json').write_text(json.dumps({'compressed_sha256':hashlib.sha256(raw).hexdigest(),'rows':len(a)}))

rows=[{'rank':r[0],'lemma':r[1],'pos':r[2]} for r in a]
(out/'frozen_rank_lemma_20000.jsonl').write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in rows))
assert len(rows)==20000 and len({x['rank'] for x in rows})==20000 and len({x['lemma'].casefold() for x in rows})==20000
print('FROZEN_MEMBERSHIP_EXPORTED',len(rows),flush=True)
