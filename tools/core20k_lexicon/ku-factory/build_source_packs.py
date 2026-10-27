#!/usr/bin/env python3
"""Materialize compact frozen Runtime into rank-scoped, explicitly unverified Sense/KU source packs."""
import argparse, collections, gzip, hashlib, json, pathlib, re, sys
def digest(x): return hashlib.sha256(x).hexdigest()
def dump(path,obj):
    b=(json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n').encode('utf8')
    path.write_bytes(b)
    return digest(b)
def main():
    p=argparse.ArgumentParser()
    p.add_argument('--runtime',default='data/core20k-runtime.json.gz')
    p.add_argument('--out',default='tools/core20k_lexicon/ku-factory/source-packs/b500')
    a=p.parse_args()
    out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
    blob=pathlib.Path(a.runtime).read_bytes();h=digest(blob)
    expect='e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b'
    qa={'runtime_sha256':h,'runtime_bytes':len(blob),'expected_runtime_sha256':expect}
    def fail(msg):
        qa.update(status='BLOCKED',error=msg)
        dump(out/'source_qa_report.json',qa)
        raise SystemExit(msg)
    if h!=expect:fail('SHA_MISMATCH')
    root=json.loads(gzip.decompress(blob))
    if not isinstance(root,dict) or not isinstance(root.get('headwords'),list):fail('HEADWORDS_NOT_LIST')
    words=root['headwords'];qa['headword_count']=len(words)
    if len(words)!=20000:fail('COUNT_NOT_20000')
    if any(not isinstance(w,list) or len(w)!=5 for w in words):fail('UNEXPECTED_COMPACT_ROW_SCHEMA')
    ranks=[w[0] for w in words];lemmas=[w[1] for w in words]
    if ranks!=list(range(1,20001)):fail('RUNTIME_RANK_NOT_CONTIGUOUS')
    if any(not isinstance(x,str) or not x for x in lemmas):fail('INVALID_LEMMA')
    if len(set(x.casefold() for x in lemmas))!=20000:fail('DUPLICATE_LEMMA')
    counts=collections.Counter();mapped=[];seen_ku=set()
    for rank,lemma,pos,ipa,compact_kus in words:
        if not isinstance(compact_kus,list):fail('KU_COLLECTION_NOT_LIST_AT_'+str(rank))
        kus=[];prefixes=set()
        for k in compact_kus:
            if not isinstance(k,list) or len(k)!=5:fail('INVALID_KU_SHAPE_AT_'+str(rank))
            kid,kind,zh,en,active=k
            if not isinstance(kid,str) or not kid:fail('INVALID_KU_ID_AT_'+str(rank))
            if kid in seen_ku:fail('DUPLICATE_KU_ID_'+kid)
            seen_ku.add(kid)
            prefix=re.sub(r'_ku[0-9]+$','',kid)
            if prefix!=kid:prefixes.add(prefix)
            kus.append({'ku_id':kid,'ku_type':kind,'gloss_zh':zh,'gloss_en':en,
                         'runtime_active_flag':active,'evidence_status':'runtime_record_unverified',
                         'source_tuple':k})
            counts['runtime_kus']+=1
            if kind=='sense':counts['sense_typed_ku']+=1
        hid=next(iter(prefixes)) if len(prefixes)==1 else None
        if hid:counts['derived_headword_prefix']+=1
        else:counts['headwords_without_derivable_id']+=1
        if not any(k['ku_type']=='sense' for k in kus):counts['headwords_without_sense_typed_ku']+=1
        mapped.append({'runtime_rank':rank,'rank_status':'runtime_order_not_independently_matched_to_frozen_csv',
                       'lemma':lemma,'pos':pos,'us_ipa':ipa,
                       'headword_id':None,'headword_id_hint':hid,
                       'headword_id_status':'derived_unverified_hint' if hid else 'missing',
                       'senses':[],'sense_status':'formal_sense_id_missing_in_runtime',
                       'kus':kus,'source_runtime_tuple':[rank,lemma,pos,ipa,compact_kus]})
    manifest={'schema':'enlex-ku-source-manifest-v1','runtime_sha256':h,
              'runtime_rank_authority':'NOT_VERIFIED_AGAINST_FROZEN_CSV',
              'formal_sense_ids_present':False,'headword_ids_present':False,
              'number_of_packs':40,'headwords':20000,'packs':[]}
    for i in range(40):
        chunk=mapped[i*500:(i+1)*500];ident=f'{i+1:03d}'
        payload={'schema':'enlex-ku-source-pack-v1','task_id':ident,'runtime_sha256':h,
                 'rank_range_runtime_only':[i*500+1,(i+1)*500],
                 'authoritative_rank_verified':False,'formal_sense_ids_available':False,
                 'headwords':chunk}
        name='source_'+ident+'.json'
        checksum=dump(out/name,payload)
        manifest['packs'].append({'task_id':ident,'path':name,'sha256':checksum,
                                  'runtime_rank_start':i*500+1,'runtime_rank_end':(i+1)*500,
                                  'headword_count':500,'formal_sense_status':'MISSING'})
    dump(out/'source_manifest.json',manifest)
    qa.update(status='PASS_RUNTIME_ORDINAL_PACKS_SENSE_ID_BLOCKED',packs=40,
              rank_coverage='1-20000 in runtime order, frozen CSV match unverified',
              formal_sense_ids=0,confirmed_headword_ids=0,**dict(counts))
    dump(out/'source_qa_report.json',qa)
    print(json.dumps(qa,ensure_ascii=False))
if __name__=='__main__': main()
