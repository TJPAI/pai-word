#!/usr/bin/env python3
"""Reconcile frozen Core20K membership against historical audit JSONs, without claiming content verification."""
import argparse,csv,hashlib,json,pathlib
EXPECTED='e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser()
 for k in ('frozen','inventory','crosswalk','unified','out'):p.add_argument('--'+k,required=True,type=pathlib.Path)
 a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 if digest(a.frozen)!=EXPECTED:raise ValueError('Frozen source SHA mismatch')
 with a.frozen.open(encoding='utf-8-sig',newline='') as f:words=[(int(r['core20k_rank_final']),r['lemma'].strip()) for r in csv.DictReader(f)]
 if len(words)!=20000 or sorted(n for n,_ in words)!=list(range(1,20001)) or len({w.casefold() for _,w in words})!=20000:raise ValueError('Membership invariants failed')
 inventory=json.loads(a.inventory.read_text());cross=json.loads(a.crosswalk.read_text());unified=json.loads(a.unified.read_text())
 if inventory['wordCount']!=13000 or cross['shared_lemmas']!=12994 or unified['word_count']!=20000:raise ValueError('Unexpected historic audit versions')
 duplicates={x['lemma'] for x in inventory['duplicateLemmas']}
 with (a.out/'identity_risk_queue.jsonl').open('w',encoding='utf-8') as f:
  for rank,lemma in words:
   flags=['HISTORICAL_AUDIT_NOT_CONTENT_VERIFICATION']
   if lemma in duplicates:flags.append('LEGACY_DUPLICATE_LEMMA_RESOLVE_IDS')
   f.write(json.dumps({'rank':rank,'lemma':lemma,'risk_flags':flags,'production_ready':'NOT_MEASURED'},ensure_ascii=False)+'\n')
 report={'baseline_sha256':EXPECTED,'frozen_members':20000,'historical_core13k_unique_lemmas':inventory['distinctLemmas'],
 'historical_core13k_sense_ku':inventory['kuTypes']['sense'],'historical_shared_lemmas':cross['shared_lemmas'],
 'historical_shared_ku_ids':cross['shared_ku_ids'],'historical_changed_zh':cross['changed_zh_count'],
 'legacy_duplicate_lemmas':sorted(duplicates),'legacy_orphan_lemmas':cross['old_missing_lemmas'],
 'legacy_ku_compatibility_missing_after_historic_adapter':unified['legacy_ids_missing_after_compatibility'],
 'historical_sources_sha256':{k:digest(getattr(a,k)) for k in ('inventory','crosswalk','unified')},
 'current_runtime_pack_audit':'NOT_EXECUTED','quality_coverage':'NOT_MEASURED','production_ready':'NOT_MEASURED',
 'warning':'Old QA summaries are leads; not current certified field-quality measurements.'}
 (a.out/'historical_evidence_reconciliation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
