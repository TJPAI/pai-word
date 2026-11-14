#!/usr/bin/env python3
"""Non-destructive V188 V185 + V183/V184 exact authors merge.
Requires crosswalk-vetted provenance patch; fail closed on identity/meaning conflict.
"""
import collections,gzip,hashlib,json,pathlib,zipfile
P=pathlib.Path('/mnt/data')
IN=P/'CGMASTER_V185_FIRST3000_EXTENDED_ANSWER_SCHEMA'
DELTA=P/'CGMASTER_V188_TEMP_SOURCE_PATCH_TRANSFER_20261115.txt'
OUT=P/'CGMASTER_V188_FIRST3000_AUTHOR_MERGED'
OUT.mkdir(exist_ok=True)
def sha(data):return hashlib.sha256(data).hexdigest()
def norm(s):return ' '.join(str(s or '').strip().casefold().split())
src=json.loads(DELTA.read_text(encoding='utf-8-sig'))
patch={}; per_source=collections.Counter()
for group in src['sources']:
 for d in group['records']:
  key=d['record_id'];assert key not in patch
  assert d['source_final_row']>=1 and d['source_final_row']<=3000
  patch[key]=dict(d,delta_version=group['version'],delta_blob=group['source_blob'])
  per_source[group['version']]+=1
assert len(patch)==286 and dict(per_source)=={'V183':223,'V184':63}
counts=collections.Counter(); conflicts=[]; matched=set(); rows=[]; shards=[]; scenes=set(); lexical=set(); global_keys=collections.Counter(); statuses=collections.Counter()
for part in range(3):
 name=f'CGMASTER_V185_SOURCE{1+part*1000:05d}_{(part+1)*1000:05d}_EXTENDED_ANSWER_OVERLAY.jsonl.gz'
 f=IN/name;out=OUT/name.replace('V185','V188').replace('EXTENDED_ANSWER_OVERLAY','AUTHOR_MERGED_ANSWER_OVERLAY')
 with gzip.open(f,'rt',encoding='utf-8') as inp, gzip.open(out,'wt',encoding='utf-8',compresslevel=6) as dst:
  for line in inp:
   r=json.loads(line);rid=r['record_id'];n=r['source_final_row'];rows.append(n);scenes.add(r['scene_id']);lexical.add(r['lexical_entry_id']);
   if r.get('provisional_sense_group_key'):global_keys[r['provisional_sense_group_key']]+=1
   a=r['answer_page']; d=patch.get(rid)
   if d:
    assert n==d['source_final_row'] and r['scene_id']==d['scene_id']
    assert norm(r['question_page']['expression'])==norm(d['expression'])
    assert norm(r['question_page']['cue_zh'])==norm(d['cue_zh'])
    matched.add(rid)
    author=d['author_answer']
    if a.get('meaning_zh') and norm(a['meaning_zh'])!=norm(author.get('meaning_zh')):
     conflicts.append({'record_id':rid,'field':'meaning_zh','source_final_row':n});counts['meaning_conflict']+=1
     # Do not integrate on meaning mismatch.
    else:
     if not a.get('meaning_zh') and author.get('meaning_zh'):a['meaning_zh']=author['meaning_zh']
     for key in ('example_en','example_zh','collocations','usage_note'):
      value=author.get(key)
      if not value:continue
      if a.get(key):
       if a[key]!=value:conflicts.append({'record_id':rid,'field':key,'source_final_row':n});counts['existing_answer_kept']+=1
      else:
       a[key]=value;counts['filled_'+key]+=1
     # Only append when there is a matched pair, preserve any pre-existing pair.
     en,zh=author.get('example_en'),author.get('example_zh')
     if en and zh:
      arr=a.setdefault('examples',[])
      if not any(norm(q.get('example_en'))==norm(en) and norm(q.get('example_zh'))==norm(zh) for q in arr):
       if len(arr)<3:
        arr.append({'example_en':en,'example_zh':zh,'source':'EXISTING_'+d['delta_version']+'_CG_ENTEACH_AUTHOR_DRAFT','status':'AUTHOR_DRAFT_NOT_CERTIFIED','evidence':{'source_path':d['source_file'],'source_blob_sha1':d['source_blob'],'delta_git_blob_sha1':d['delta_blob'],'ku_id_audit_only':d['source_ku_id_audit_only']}})
        counts['new_bilingual_examples']+=1
       else:
        conflicts.append({'record_id':rid,'field':'examples_max_3','source_final_row':n})
     note=author.get('contrast_note')
     dis=a.get('sense_disambiguation') or {}
     if note and not dis.get('note_zh'):
      dis['note_zh']=note
      dis['status']='EXISTING_AUTHOR_DRAFT_NOT_SENSE_VERIFIED'
      dis['source']=d['source_file']
      a['sense_disambiguation']=dis
      counts['contrast_note_added']+=1
     a['answer_author_status']='EXISTING_'+d['delta_version']+'_CG_ENTEACH_AUTHOR_DRAFT_NOT_CERTIFIED'
     a['author_source']=d['source_file']
     a['author_source_blob_sha1']=d['source_blob']
     r.setdefault('evidence',{})['author_answer_reuse']={'crosswalk_status':'V75_PREVERIFIED_EXACT','delta':d['delta_version'],'delta_blob_sha1':d['delta_blob'],'source_ku_id_audit_only':d['source_ku_id_audit_only'],'qa_status':d['qa_status']}
     counts['author_records_merged']+=1
   a['examples_status']='EXISTING_1_TO_3_BILINGUAL_AUTHOR_DRAFT_NOT_CERTIFIED' if a.get('examples') else 'MISSING_BILINGUAL_EXAMPLES'
   a['required_semantic_content_complete']=bool(a.get('meaning_zh') and a.get('gloss_en') and a.get('pos') and a.get('examples') and a.get('collocations') and a.get('usage_note'))
   a['extended_enrichment_complete']=False
   r['version']='V188';r['schema']='CGMASTER_V188_AUTHOR_MERGED_EXTENDED_ANSWER_STAGING';r['base_version']='V185'
   r['formal_ready']=False;r['srs_eligible']=False
   assert r.get('global_sense_id') is None and len(a['examples'])<=3
   counts['rows']+=1
   for k in ('meaning_zh','gloss_en','pos','usage_note','collocations','examples'):
    if a.get(k):counts[k+'_filled']+=1
   if a['required_semantic_content_complete']:counts['six_content_categories_filled_unverified']+=1
   if r.get('question_page',{}).get('ipa'):counts['ipa_test_nonempty']+=1
   statuses[r['question_page']['ipa_status']]+=1
   dst.write(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')
 data=out.read_bytes();shards.append({'name':out.name,'records':1000,'bytes':len(data),'sha256':sha(data),'git_blob_sha1':hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()})
assert rows==list(range(1,3001)) and len(matched)==len(patch)==286
assert counts['rows']==3000 and counts['author_records_merged']==286
assert counts['new_bilingual_examples']==286 and counts['examples_filled']==907,(counts,conflicts[:3])
manifest={'version':'V188','date':'2026-11-15','source_master_sha256':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','scope':{'first_source_final_row':1,'last_source_final_row':3000,'source_association_rows':3000,'scenes':len(scenes),'lexical_entries':len(lexical),'provisional_sense_groups':len(global_keys),'provisional_reuse_associations':sum(v-1 for v in global_keys.values() if v>1),'certified_global_senses':0},'source_base':'V185 unchanged immutable three gzip shards','source_deltas':{'V183_exact_author_answers':223,'V184_exact_author_answers':63},'counts':dict(counts),'conflict_count':len(conflicts),'coverage_missing':{k:3000-counts[k+'_filled'] for k in ('meaning_zh','gloss_en','pos','usage_note','collocations','examples')},'ipa_status_breakdown':dict(statuses),'shards':shards,'policy':{'preserve_existing_author_content':True,'new_examples_max':3,'new_synonyms_antonyms':'EMPTY_UNTIL_SENSE_VERIFIED','sense_disambiguation':'AUTHOR_CONTRAST_DRAFT_ONLY','formal_ready':False,'srs_eligible':False},'source_patch_sha256':sha(DELTA.read_bytes())}
(OUT/'CGMASTER_V188_MANIFEST_20261115.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'CGMASTER_V188_AUTHOR_MERGE_CONFLICTS_20261115.json').write_text(json.dumps(conflicts,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
zip_path=P/'CGMASTER_V188_FIRST3000_MERGED_AUTHOR_ANSWERS_20261115.zip'
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_STORED) as z:
 for p in sorted(OUT.iterdir()):z.write(p,arcname=p.name)
 z.write(pathlib.Path(__file__),arcname='build_cgmaster_v188_merge_author.py')
manifest['zip_sha256']=sha(zip_path.read_bytes())
print(json.dumps({'zip':str(zip_path),'manifest':manifest},ensure_ascii=False,indent=2))
