#!/usr/bin/env python3
"""Core20K frozen-membership audit and safe AI-draft staging.
No generated record is ever labeled dictionary_verified or production_ready.
Usage: python3 tools/core20k_lexicon/build.py --frozen /path/frozen.csv --drafts drafts.jsonl --out build/core20k
"""
import argparse, csv, hashlib, json, pathlib, collections

def sha256(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for part in iter(lambda:f.read(1024*1024),b''): h.update(part)
    return h.hexdigest()

def dump(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--frozen',required=True)
    ap.add_argument('--drafts')
    ap.add_argument('--out',default='build/core20k')
    ap.add_argument('--expected-sha256')
    args=ap.parse_args()
    src=pathlib.Path(args.frozen); out=pathlib.Path(args.out); out.mkdir(parents=True,exist_ok=True)
    digest=sha256(src)
    if args.expected_sha256 and digest!=args.expected_sha256: raise SystemExit('FROZEN_SHA_MISMATCH')
    with src.open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f)
        required={'core20k_rank_final','lemma'}
        if not required.issubset(reader.fieldnames or []): raise SystemExit('FROZEN_COLUMNS_MISSING')
        words=[(int(r['core20k_rank_final']),r['lemma'].strip()) for r in reader]
    ranks=[x[0] for x in words]; lemmas=[x[1].casefold() for x in words]
    if len(words)!=20000 or sorted(ranks)!=list(range(1,20001)) or len(set(lemmas))!=20000:
        raise SystemExit('FROZEN_MEMBERSHIP_INVARIANT_FAIL')
    dictionary={lemma:(rank,word) for rank,word in words for lemma in [word.casefold()]}
    staged={}; errors=[]; stats=collections.Counter()
    if args.drafts:
        with open(args.drafts,encoding='utf-8') as f:
            for n,line in enumerate(f,1):
                if not line.strip():continue
                try: r=json.loads(line)
                except json.JSONDecodeError: errors.append({'line':n,'error':'invalid_json'}); continue
                lemma=str(r.get('lemma','')).strip().casefold()
                if lemma not in dictionary: errors.append({'line':n,'error':'not_frozen_member'});continue
                if not r.get('part_of_speech') or not r.get('core_definition_zh'):
                    errors.append({'line':n,'error':'missing_pos_or_zh'});continue
                rank,original=dictionary[lemma]
                # Candidate IDs are NOT canonical KU IDs until migration is audited.
                r['lemma']=original; r['core20k_rank']=rank
                r['quality_level']='AI_DRAFT_UNVERIFIED'
                r['evidence_status']='PENDING_INDEPENDENT_REVIEW'
                r['candidate_id']='draft:'+hashlib.sha256((lemma+'|'+str(r.get('part_of_speech'))+'|'+str(r.get('sense_key',''))).encode()).hexdigest()[:20]
                r.pop('ku_id',None); r.pop('dictionary_verified',None); r.pop('production_ready',None)
                if r['candidate_id'] in staged:errors.append({'line':n,'error':'duplicate_candidate'});continue
                staged[r['candidate_id']]=r;stats[lemma]+=1
    inventory={'baseline_file':src.name,'baseline_sha256_computed':digest,'member_count':len(words),
               'unique_member_count':len(set(lemmas)),'rank_contiguous':True,
               'draft_candidate_count':len(staged),'draft_headword_count':len(stats),
               'production_ready_headword_count':None,
               'production_ready_status':'NOT_EVALUATED','note':'Unreviewed AI drafts never count as ready.'}
    dump(out/'baseline_inventory.json',inventory)
    dump(out/'coverage_audit.json',{'denominator_frozen_headwords':20000,
         'ai_draft_headword_numerator':len(stats),'ai_draft_rate':len(stats)/20000,
         'production_ready_headwords':None,'reason':'No independent evidence evaluator supplied.'})
    dump(out/'quality_risk_queue.json',{'errors':errors[:5000],'error_count':len(errors),
         'uncovered_frozen_headword_count':20000-len(stats)})
    with (out/'ai_drafts_unverified.jsonl').open('w',encoding='utf-8') as f:
        for record in sorted(staged.values(),key=lambda r:(r['core20k_rank'],r['candidate_id'])):
            f.write(json.dumps(record,ensure_ascii=False,sort_keys=True)+'\n')
    (out/'gap_report.md').write_text(f'# Core20K gap report\n\nFrozen membership: 20,000, verified structurally.\nAI draft headwords: {len(stats)}.\nProduction Ready: NOT EVALUATED.\nMissing AI drafts: {20000-len(stats)}.\nRejected rows: {len(errors)}.\n',encoding='utf-8')
    print(json.dumps(inventory,ensure_ascii=False))
if __name__=='__main__': main()
