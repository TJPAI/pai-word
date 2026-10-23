#!/usr/bin/env python3
"""Deterministic AI-review shard preparation; does not change membership."""
import argparse,collections,hashlib,json,pathlib,re
def triage(records):
 out=[]
 for r in records:
  t=r['term']; flags=[]
  if re.search(r'\d',t):flags.append('numeric_expression_review')
  if re.search(r'[a-zA-Z]',t):flags.append('mixed_script_review')
  if len(t)>=7:flags.append('long_expression_review')
  if len(t)>1 and (t[0] in '我你他她它这那一不很更最每几两三四五六七八九十' or t[-1] in '了着过的地得们'):flags.append('possible_contextual_boundary')
  if t in ('人有','中有','人来','人去','我有','我要','他会','这会','人是'):flags.append('manual_boundary_priority')
  if not flags:continue
  priority='high' if 'manual_boundary_priority' in flags else ('medium' if 'mixed_script_review' in flags or 'numeric_expression_review' in flags else 'low')
  out.append({'term_id':r['term_id'],'term':t,'priority':priority,'flags':flags,'verdict':'UNDECIDED','evidence_required':['attested_contexts','segmented_corpus','dictionary_or_domain_evidence'],'action':'REVIEW_ONLY'})
 return sorted(out,key=lambda r:({'high':0,'medium':1,'low':2}[r['priority']],r['term_id']))
def main():
 p=argparse.ArgumentParser();p.add_argument('master');p.add_argument('outdir');a=p.parse_args()
 out=pathlib.Path(a.outdir);out.mkdir(parents=True,exist_ok=True)
 raw=pathlib.Path(a.master).read_bytes(); records=json.loads(raw)['records']
 assert len(records)==20000 and len({r['term_id'] for r in records})==20000
 assert all('zh_'+hashlib.sha256(r['term'].encode()).hexdigest()[:20]==r['term_id'] for r in records)
 rows=triage(records)
 for i in range(0,len(rows),200):
  (out/f'review-shard-{i//200+1:03}.jsonl').write_text(''.join(json.dumps(v,ensure_ascii=False)+'\n' for v in rows[i:i+200]),encoding='utf-8')
 qa={'version':'V0.10.7-ai-assisted-triage','baseline_sha256':hashlib.sha256(raw).hexdigest(),'total_records':len(records),'id_check':'PASS','flagged':len(rows),'priority_counts':dict(collections.Counter(r['priority'] for r in rows)),'shards':(len(rows)+199)//200,'membership_changes':0,'frequency_changes':0,'decision_status':'NO_AUTOMATIC_REMOVALS','important_limit':'Flags are overinclusive, NOT lexical errors or verified frequency; require external evidence for decisions.'}
 (out/'qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(qa,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
