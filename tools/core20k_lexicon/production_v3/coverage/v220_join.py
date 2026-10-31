#!/usr/bin/env python3
"""Fail-closed join of Core20K rank/lemma input to independent Sense/KU candidate files.

Usage: python v220_join.py --batch first500_cross_source_input.jsonl --source candidate.jsonl --out output
Source files are JSONL; missing source is explicitly represented, never equated to missing Sense.
"""
import argparse,collections,hashlib,json,pathlib

def load(path):
    with open(path,encoding='utf-8') as f:
        for n,line in enumerate(f,1):
            if line.strip():
                try: yield json.loads(line)
                except Exception as e: raise ValueError(f'{path}:{n}: {e}')

def ssha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--batch',required=True);ap.add_argument('--source',action='append',default=[]);ap.add_argument('--out',required=True)
    args=ap.parse_args();out=pathlib.Path(args.out);out.mkdir(parents=True,exist_ok=True)
    batch=list(load(args.batch)); assert batch and len({int(x['rank']) for x in batch})==len(batch)
    ranks={int(x['rank']):x for x in batch};matches=collections.defaultdict(list);rejected=[];allrows=0;outside=0;dedupe=set()
    for src in args.source:
        for row in load(src):
            allrows+=1; rank=row.get('rank'); lemma=row.get('lemma') or row.get('headword');
            if rank is None or not lemma:
                rejected.append({'source':src,'reason':'MISSING_RANK_OR_LEMMA','record':row});continue
            try: rank=int(rank)
            except (TypeError,ValueError):rejected.append({'source':src,'reason':'INVALID_RANK','record':row});continue
            if rank not in ranks:outside+=1;continue
            if str(lemma).casefold()!=str(ranks[rank]['lemma']).casefold():
                rejected.append({'source':src,'reason':'RANK_LEMMA_MISMATCH','rank':rank,'lemma':lemma,'expected':ranks[rank]['lemma']});continue
            sid=row.get('sense_key') or row.get('teaching_sense_id') or row.get('sense_id')
            kid=row.get('ku_id')
            key=(rank,str(sid),str(kid),src)
            if key in dedupe: continue
            dedupe.add(key)
            matches[rank].append({'source_file':pathlib.Path(src).name,'sense_identity':sid,'ku_identity':kid,'record_status':'CANDIDATE_ONLY'})
    joined=[]
    for rank,item in sorted(ranks.items()):
        extra=matches.get(rank,[])
        joined.append({'rank':rank,'lemma':item['lemma'],'pos':item.get('pos'),
         'verified_v179_sense_keys':item.get('existing_v179_sense_keys',[]),
         'additional_candidate_records':extra,
         'source_status':'CROSS_SOURCE_JOINED_UNCERTIFIED' if extra else ('NO_EXTRA_SOURCE_PROVIDED' if not args.source else 'NOT_FOUND_IN_PROVIDED_SOURCES'),
         'source_scope_complete':False,'semantic_certified':False,'production_ready':False})
    dest=out/'joined.jsonl';dest.write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in joined),encoding='utf-8')
    errs=out/'rejected.jsonl';errs.write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in rejected),encoding='utf-8')
    report={'version':'V220','batch_rows':len(batch),'v179_present':sum(bool(x['verified_v179_sense_keys']) for x in joined),
      'source_count':len(args.source),'source_rows_seen':allrows,'records_outside_batch':outside,
      'matched_records':sum(len(x['additional_candidate_records']) for x in joined),
      'matched_headwords':sum(bool(x['additional_candidate_records']) for x in joined),
      'rejected_records':len(rejected),'source_complete':False,'certified':0,'production_ready':0,
      'source_sha256':{pathlib.Path(p).name:ssha(p) for p in args.source},'joined_sha256':ssha(dest),'rejected_sha256':ssha(errs)}
    (out/'manifest.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if rejected:raise SystemExit('FAIL CLOSED: source identities rejected; inspect rejected.jsonl')
if __name__=='__main__':main()
