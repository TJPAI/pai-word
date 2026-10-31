#!/usr/bin/env python3
"""Content-aware fail-closed QA for experimental Sense editorial records.
Reads JSONL supplied explicitly by the caller. NEVER confers certification.
"""
import argparse,collections,hashlib,json,pathlib
def main():
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--out',required=True);a=p.parse_args()
 src=pathlib.Path(a.input);data=src.read_bytes()
 rows=[json.loads(s) for s in data.splitlines() if s.strip()]
 seen=set();counts=collections.Counter();qa=[]
 for x in rows:
  ident=x['teaching_sense_id']
  flags=[]
  if ident in seen:flags.append('DUPLICATE_SENSE_ID')
  seen.add(ident)
  zh=x.get('gloss_zh_revised_candidate',x.get('selected_gloss_zh'))
  status=x.get('editorial_disposition','')
  reason=x.get('editorial_reason_zh','')
  options=x.get('original_chinese_lexicalizations',[])
  if not zh:flags.append('MISSING_GLOSS')
  if status=='KEEP_CANDIDATE' and zh not in options:flags.append('KEEP_NOT_SOURCE')
  if '英文义项限定为' in reason and '与其他同义词项区分，需独立语境复核' in reason:flags.append('TEMPLATE_REASON')
  if reason.startswith('按当前英文定义逐义项选择或修订'):flags.append('GENERIC_REASON')
  if status=='REVISE_CANDIDATE':flags.append('REVISED_CANDIDATE_NEEDS_CHECK')
  if x.get('independent_certified') or x.get('production_ready'):flags.append('UNSUPPORTED_CERTIFICATION_IN_INPUT')
  counts.update(flags)
  qa.append({'teaching_sense_id':ident,'qa_flags':flags,'qa_status':'HOLD_INDEPENDENT_SEMANTIC_QA','production_ready':False,'independent_certified':False})
 out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
 f=out/'qa_flags.jsonl';f.write_text(''.join(json.dumps(x,ensure_ascii=False)+chr(10) for x in qa),encoding='utf8')
 m={'input_records':len(rows),'unique_ids':len(seen),'flags':dict(counts),'source_sha256':hashlib.sha256(data).hexdigest(),'approved':0,'production_ready':0}
 (out/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+chr(10),encoding='utf8')
 print(json.dumps(m,ensure_ascii=False))
if __name__=='__main__':main()
