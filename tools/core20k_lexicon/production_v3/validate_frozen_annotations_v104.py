#!/usr/bin/env python3
"""V104: independent annotation inputs, IDs and labels must match the frozen V103 sample ZIP."""
import sys,csv,zipfile,io,json,collections
Z,A,B=sys.argv[1:4]
key='KEEP_CORE_or_KEEP_EXTENDED_or_MERGE_REVIEW_or_DEFER_or_GAP_REVIEW'
valid={'KEEP_CORE','KEEP_EXTENDED','MERGE_REVIEW','DEFER','GAP_REVIEW'}
def parse(raw):return list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
with zipfile.ZipFile(Z) as z:
 ref=parse(z.read('blind_annotation_A.csv'))
 other=parse(z.read('blind_annotation_B.csv'))
 assert len(ref)==600 and [x['sample_id'] for x in ref]==[x['sample_id'] for x in other]
 expected={x['sample_id'] for x in ref}
 sealed=parse(z.read('sealed_model_decisions.csv'))
 assert {x['sample_id'] for x in sealed}==expected
 strata={x['sample_id']:x['selection_suggestion'] for x in sealed}
def load(p):
 rows=parse(open(p,'rb').read());d={}
 for x in rows:
  i=x['sample_id'].strip();v=x[key].strip()
  assert i and i not in d and v in valid,('duplicate, blank or invalid',i,v)
  assert x.get('reason','').strip(),('missing rationale',i)
  d[i]=v
 assert set(d)==expected,('missing',len(expected-set(d)),'unexpected',len(set(d)-expected))
 return d
a,b=load(A),load(B);n=len(expected)
po=sum(a[s]==b[s] for s in expected)/n
ca,cb=collections.Counter(a.values()),collections.Counter(b.values())
pe=sum(ca[k]*cb[k] for k in valid)/n**2
k=(po-pe)/(1-pe) if pe<1 else None
print(json.dumps({'n':n,'observed_agreement':po,'kappa':k,'pass':k is not None and k>=0.75,'disagreements':sum(a[s]!=b[s] for s in expected),'adjudication_required':True,'by_model_stratum':{t:{'n':sum(strata[s]==t for s in expected),'agreement':sum(a[s]==b[s] for s in expected if strata[s]==t)/sum(strata[s]==t for s in expected)} for t in set(strata.values())}},indent=2))
