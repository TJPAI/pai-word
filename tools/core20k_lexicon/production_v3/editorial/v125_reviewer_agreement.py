#!/usr/bin/env python3
"""V125 reviewer agreement gate. Does not self-certify Sense."""
import csv,sys,collections,json
A,B=sys.argv[1:3]
allowed={'PASS','REVISE','REJECT'}
def read(p):
 with open(p,encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
 assert len(rows)==90,'expected 90'
 d={}
 for r in rows:
  k=r['sense_key']; label=r['semantic_fit_PASS_REVISE_REJECT'].strip().upper()
  assert k and k not in d and label in allowed,('id or label',k,label)
  assert r['review_reason'].strip(),('review reason missing',k)
  if label=='REVISE':assert r['reviewer_gloss_zh'].strip(),('missing correction',k)
  d[k]=label
 return d
a,b=read(A),read(B);assert set(a)==set(b),'A/B IDs differ'
n=len(a);po=sum(a[k]==b[k] for k in a)/n
ca,cb=collections.Counter(a.values()),collections.Counter(b.values())
pe=sum(ca[k]*cb[k] for k in allowed)/n**2
kappa=(po-pe)/(1-pe) if pe<1 else None
print(json.dumps({'count':n,'agreement':po,'cohen_kappa':kappa,'disagreements':sum(a[k]!=b[k] for k in a),'independent_certified':0,'adjudication_required':True},indent=2))
