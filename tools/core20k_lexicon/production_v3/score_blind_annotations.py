#!/usr/bin/env python3
"""Score two genuinely independent 600-record annotations after collection."""
import csv,sys,collections,json
valid={'KEEP_CORE','KEEP_EXTENDED','MERGE_REVIEW','DEFER','GAP_REVIEW'}
def load(p):
 with open(p,encoding='utf8-sig',newline='') as f:rows=list(csv.DictReader(f))
 d={}
 for r in rows:
  sid=r['sample_id'].strip()
  assert sid and sid not in d
  label=r['KEEP_CORE_or_KEEP_EXTENDED_or_MERGE_REVIEW_or_DEFER_or_GAP_REVIEW'].strip()
  assert label in valid
  d[sid]=label
 return d
a,b=load(sys.argv[1]),load(sys.argv[2])
assert len(a)==600 and set(a)==set(b)
n=len(a);po=sum(a[k]==b[k] for k in a)/n
ca,cb=collections.Counter(a.values()),collections.Counter(b.values())
pe=sum(ca[k]*cb[k] for k in valid)/(n*n)
kappa=(po-pe)/(1-pe) if pe<1 else None
print(json.dumps({'n':n,'observed_agreement':po,'expected_agreement':pe,'cohen_kappa':kappa,'pass_kappa_0_75':kappa is not None and kappa>=0.75},indent=2))
