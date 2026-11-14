#!/usr/bin/env python3
"""Non-destructive V185 compatibility migration: V182 first 3000 source rows.
Examples become 1..3 bilingual pairs; synonyms/antonyms/disambiguation have stable typed fields.
No semantic relationship, translation, example, or canonical sense ID is invented.
V183/V184 exact author-reuse deltas remain independently source-pinned until separately merged.
"""
import collections, gzip, hashlib, json, pathlib, zipfile
P=pathlib.Path('/mnt/data')
SRC=P/'CGMASTER_V182_FIRST3000_THREE_LAYER_PAGE_OVERLAY_WITH_BUILDER_20261115.zip'
OUT=P/'CGMASTER_V185_FIRST3000_EXTENDED_ANSWER_SCHEMA'
OUT.mkdir(exist_ok=True)
shards=[];counts=collections.Counter();hold=[];rids=set();rows=[];senses=collections.Counter()
with zipfile.ZipFile(SRC) as z:
  names=sorted(n for n in z.namelist() if 'SOURCE' in n and n.endswith('.jsonl.gz'))
  assert len(names)==3
  for n in names:
    shard=[]
    with gzip.GzipFile(fileobj=z.open(n),mode='rb') as f:
      for ln in f:
        r=json.loads(ln)
        rid=r['record_id'];assert rid not in rids
        rids.add(rid);rows.append(r['source_final_row'])
        a=r['answer_page'];en=a.get('example_en');zh=a.get('example_zh')
        bilingual=bool(en and zh)
        a['examples']=([{'example_en':en,'example_zh':zh,'source':'EXISTING_V182_PAIRED_DRAFT','status':'AUTHOR_DRAFT_NOT_CERTIFIED'}] if bilingual else [])
        a['examples_required_min']=1
        a['examples_supported_max']=3
        a['examples_status']='EXISTING_1_OF_1_TO_3_DRAFT_NOT_CERTIFIED' if bilingual else ('PARTIAL_BILINGUAL_HOLD' if bool(en)!=bool(zh) else 'MISSING_BILINGUAL_EXAMPLES')
        a['synonyms']=[]
        a['antonyms']=[]
        a['synonyms_status']='PENDING_SENSE_ALIGNED_EVIDENCE'
        a['antonyms_status']='PENDING_SENSE_ALIGNED_EVIDENCE'
        old=a.get('optional_contrast_note')
        a['sense_disambiguation']={
          'note_zh':old if isinstance(old,str) and old.strip() else None,
          'comparisons':[],
          'status':'EXISTING_AUTHOR_DRAFT_NOT_SENSE_VERIFIED' if old else 'PENDING_SENSE_COMPARATIVE_EVIDENCE',
          'source':a.get('author_source') if old else None,
        }
        a['all_required_new_fields_present_as_keys']=True
        a['required_semantic_content_complete']=bool(a.get('meaning_zh') and a.get('gloss_en') and a.get('pos') and bilingual and a.get('collocations') and a.get('usage_note'))
        a['extended_enrichment_complete']=False
        r['schema']='CGMASTER_V185_THREE_LAYER_EXTENDED_ANSWER_TEST_OVERLAY'
        r['version']='V185'
        r['base_version']='V182'
        r['provenance_addendum']={'V183_SC0001_AUTHOR_DELTA':'EXTERNAL_SOURCE_PINNED_NOT_YET_MERGED','V184_SC0002_AUTHOR_DELTA':'EXTERNAL_SOURCE_PINNED_NOT_YET_MERGED','schema_migration':'LOSSLESS_KEEP_ORIGINAL_EXAMPLE_FIELDS_AND_ADD_STRUCTURED_EXAMPLES'}
        assert len(a['examples'])<=3
        assert a['synonyms']==[] and a['antonyms']==[]
        assert r['global_sense_id'] is None and r['formal_ready'] is False and r['srs_eligible'] is False
        counts['rows']+=1
        for key in ['meaning_zh','gloss_en','pos','usage_note']:
          if a.get(key):counts[key+'_filled']+=1
        if a.get('collocations'):counts['collocations_filled']+=1
        if a['examples']:counts['examples_bilingual_1_to_3']+=1
        if old:counts['existing_contrast_notes_preserved']+=1
        if r['question_page'].get('ipa'):counts['ipa_test_nonempty']+=1
        if a['required_semantic_content_complete']:counts['prior_six_content_categories_present_unverified']+=1
        if not bilingual:hold.append({'record_id':rid,'source_final_row':r['source_final_row'],'scene_id':r['scene_id'],'reason':'EXAMPLES_1_TO_3_BILINGUAL_MISSING'})
        if r.get('provisional_sense_group_key'):senses[r['provisional_sense_group_key']]+=1
        shard.append(r)
    filename=n.replace('V182','V185').replace('FULL_PAGE_OVERLAY','EXTENDED_ANSWER_OVERLAY')
    path=OUT/filename
    with gzip.open(path,'wt',encoding='utf-8',compresslevel=6) as f:
      for x in shard:f.write(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
    with gzip.open(path,'rt',encoding='utf-8') as f:assert sum(1 for _ in f)==len(shard)==1000
    d=path.read_bytes()
    shards.append({'name':filename,'records':len(shard),'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest(),'git_blob_sha1':hashlib.sha1(b'blob '+str(len(d)).encode()+b'\0'+d).hexdigest()})
assert counts['rows']==3000 and rows==list(range(1,3001)) and len(rids)==3000
manifest={'version':'V185','date':'2026-11-15','scope':'SC50-0001 onward, source rows 1..3000','origin':'V182 immutable first3000, lossless schema extension','counts':dict(counts),'unique_provisional_sense_groups':len(senses),'provisional_reused_associations':sum(v-1 for v in senses.values() if v>1),'global_canonical_senses_approved':0,'synonyms_verified_nonempty':0,'antonyms_verified_nonempty':0,'new_disambiguation_comparisons_verified':0,'examples_max_per_association':3,'examples_min_required_for_content_complete':1,'missing_example_count':3000-counts['examples_bilingual_1_to_3'],'source_ipa':'V182 unchanged Kaikki/CMU preview provenance, non-certified','source_master_sha256':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','release_allowed':False,'formal_ready':0,'srs_eligible':False,'not_applied_deltas':['V183 SC0001 223 author reuses','V184 SC0002 63 author reuses'],'policy':['example_en/example_zh retained for old UI','examples[] 1–3 bilingual objects; missing remain missing','synonyms[]/antonyms[] fixed typed fields; populated only after Sense-aligned evidence','sense_disambiguation note and comparisons; author contrast note preserved without asserting semantic verification','never fabricate approved global Sense ID or overwrite Reviewed V13'], 'shards':shards}
(OUT/'CGMASTER_V185_EXTENDED_ANSWER_MANIFEST_20261115.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'CGMASTER_V185_MISSING_EXAMPLES_HOLD_20261115.json').write_text(json.dumps(hold,ensure_ascii=False,separators=(',',':'))+'\n')
zip_path=P/'CGMASTER_V185_FIRST3000_EXTENDED_ANSWER_SCHEMA_20261115.zip'
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_STORED) as z:
 for p in sorted(OUT.iterdir()):z.write(p,arcname=p.name)
 z.write(pathlib.Path(__file__),arcname='build_cgmaster_v185_answer_schema.py')
manifest['zip_sha256']=hashlib.sha256(zip_path.read_bytes()).hexdigest()
print(json.dumps({'manifest':manifest,'zip':str(zip_path)},ensure_ascii=False,indent=2))
