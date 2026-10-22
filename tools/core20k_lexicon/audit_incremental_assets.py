#!/usr/bin/env python3
"""Strict accounting for existing unified MVP 20K candidates; never promotes KU."""
import argparse,csv,gzip,hashlib,json,pathlib,collections
EXPECTED='e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca'
def main():
 p=argparse.ArgumentParser()
 for key in ('frozen','mvp','out'):p.add_argument('--'+key,required=True,type=pathlib.Path)
 a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 if hashlib.sha256(a.frozen.read_bytes()).hexdigest()!=EXPECTED:raise ValueError('membership SHA mismatch')
 with a.frozen.open(encoding='utf-8-sig',newline='') as f:members=[(int(row['core20k_rank_final']),row['lemma'].casefold()) for row in csv.DictReader(f)]
 data=json.load(gzip.open(a.mvp,'rt',encoding='utf-8'))['entries']
 assert len(members)==20000 and len(data)==20000 and members==[(x['rank'],x['lemma'].casefold()) for x in data]
 old=[x for x in data if x['legacy_rank'] is not None];new=[x for x in data if x['legacy_rank'] is None]
 no_sense=[x for x in new if not x['senses']];with_sense=[x for x in new if x['senses']]
 report={'frozen_count':20000,'legacy_count':len(old),'incremental_count':len(new),
 'incremental_sense_candidate_headwords':len(with_sense),'incremental_no_sense_headwords':len(no_sense),
 'incremental_zh_sense_candidates':sum(bool(s.get('zh_core')) for w in new for s in w['senses']),
 'incremental_us_ipa':sum(bool(w['us_ipa']) for w in new),
 'legacy_word_level_examples':sum(bool(w.get('examples')) for w in old),
 'legacy_word_level_collocations':sum(bool(w.get('collocations')) for w in old),
 'legacy_explicit_sense_examples':sum(bool(e.get('sense_id')) for w in old for e in w.get('examples',[]) if isinstance(e,dict)),
 'legacy_explicit_sense_collocations':sum(bool(c.get('sense_id')) for w in old for c in w.get('collocations',[]) if isinstance(c,dict)),
 'increment_states':dict(collections.Counter(w['content_status'] for w in new)),
 'source_mvp_sha256':hashlib.sha256(a.mvp.read_bytes()).hexdigest(),'production_ready':'NOT_ASSESSED'}
 (a.out/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 for name,items in [('missing_sense.jsonl',no_sense),('existing_candidate.jsonl',with_sense)]:
  with (a.out/name).open('w',encoding='utf-8') as f:
   for x in items:f.write(json.dumps({'rank':x['rank'],'lemma':x['lemma'],'content_status':x['content_status'],'sense_candidate_count':len(x['senses']),'quality':'UNVERIFIED'},ensure_ascii=False)+'\n')
 print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
