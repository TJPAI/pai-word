#!/usr/bin/env python3
"""V190 adds V75 batch03 CG-ENTEACH author answers to full V189 3000-row overlay.
Source-pinned, append only, no canonical sense fabrication or source overwrite.
"""
import pathlib,gzip,json,collections,hashlib,zipfile
P=pathlib.Path('/mnt/data'); SRC=P/'CGMASTER_V189_FIRST3000_AUTHOR_MERGED'; PATCH=P/'CGMASTER_V190_TEMP_AUTHOR_TRANSFER_20261115.txt'; OUT=P/'CGMASTER_V190_FIRST3000_AUTHOR_MERGED';OUT.mkdir(exist_ok=True)
def norm(x):return ' '.join(str(x or '').strip().casefold().split())
raw=json.loads(PATCH.read_text(encoding='utf-8-sig'));assert raw['version']=='V190'
delta={};holds=list(raw['prehold']);conflicts=[];stats=collections.Counter();seen=set();rows=[];scenes=set();lex=set();global_groups=collections.Counter();ipa=collections.Counter();sha=lambda x:hashlib.sha256(x).hexdigest()
for x in raw['records']:
 n=x['source_final_row'];assert n not in delta;delta[n]=x
assert len(delta)==288 and len(holds)==32
shards=[]
for idx in range(3):
 name=f'CGMASTER_V189_SOURCE{idx*1000+1:05d}_{(idx+1)*1000:05d}_BATCH02_AUTHOR_MERGED_OVERLAY.jsonl.gz'
 source=SRC/name;output=OUT/name.replace('V189','V190').replace('BATCH02','BATCH03');group=[]
 with gzip.open(source,'rt',encoding='utf8') as f:
  for line in f:
   r=json.loads(line);n=r['source_final_row'];rid=r['record_id'];assert rid not in seen;seen.add(rid);rows.append(n);scenes.add(r['scene_id']);lex.add(r['lexical_entry_id']);ipa[r['question_page']['ipa_status']]+=1
   if r.get('provisional_sense_group_key'):global_groups[r['provisional_sense_group_key']]+=1
   a=r['answer_page'];x=delta.get(n)
   if x:
    if r['scene_id']!=x['scene_id'] or norm(r['question_page']['expression'])!=norm(x['expression']) or norm(r['question_page']['cue_zh'])!=norm(x['cue_zh']):
     holds.append({'row':n,'ku':x['ku'],'reason':'SCENE_EXPRESSION_CUE_MISMATCH'});stats['identity_hold']+=1
    elif norm(a.get('meaning_zh'))!=norm(x['author_answer'].get('meaning_zh')):
     holds.append({'row':n,'ku':x['ku'],'reason':'MEANING_CONFLICT'});stats['meaning_hold']+=1
    else:
     author=x['author_answer'];stats['author_records_merged']+=1
     for field in ('example_en','example_zh','collocations','usage_note'):
      v=author.get(field)
      if not v:continue
      if a.get(field):
       if a[field]!=v:conflicts.append({'row':n,'field':field,'resolution':'KEEP_EXISTING'});stats['preserved_conflict']+=1
      else:a[field]=v;stats['new_'+field]+=1
     en=author.get('example_en');zh=author.get('example_zh')
     if en and zh:
      pairs=a.setdefault('examples',[])
      if not any(norm(z.get('example_en'))==norm(en) and norm(z.get('example_zh'))==norm(zh) for z in pairs):
       if len(pairs)<3:
        pairs.append({'example_en':en,'example_zh':zh,'source':'V190_BATCH03_CG_ENTEACH_V51_AUTHOR','status':'AUTHOR_DRAFT_NOT_CERTIFIED','evidence':{'pack':x['pack'],'git_blob_sha1':x['blob'],'ku_audit_only':x['ku'],'crosswalk_blob_sha1':raw['source_crosswalk_blob']}});stats['new_examples']+=1
       else:holds.append({'row':n,'ku':x['ku'],'reason':'EXAMPLE_LIMIT_REACHED'})
     note=author.get('contrast_note')
     if note and not (a.get('sense_disambiguation') or {}).get('note_zh'):
      d=a.setdefault('sense_disambiguation',{});d.update({'note_zh':note,'status':'AUTHOR_DRAFT_NOT_SENSE_VERIFIED','source':x['pack']});stats['new_contrast_notes']+=1
     r.setdefault('evidence',{})['author_answer_batch03_reuse']={'ku_audit_only':x['ku'],'pack':x['pack'],'source_git_blob_sha1':x['blob'],'crosswalk_blob_sha1':raw['source_crosswalk_blob'],'qa_status':x['qa_status']}
     a['author_source']=x['pack'];a['answer_author_status']='V190_BATCH03_AUTHOR_DRAFT_NOT_CERTIFIED'
   a['examples_status']='EXISTING_1_TO_3_BILINGUAL_AUTHOR_DRAFT_NOT_CERTIFIED' if a.get('examples') else 'MISSING_BILINGUAL_EXAMPLES'
   a['required_semantic_content_complete']=bool(a.get('meaning_zh') and a.get('gloss_en') and a.get('pos') and a.get('examples') and a.get('collocations') and a.get('usage_note'))
   a['extended_enrichment_complete']=False;r['schema']='CGMASTER_V190_SOURCE_SAFE_AUTHOR_ENRICHMENT_STAGING';r['version']='V190';r['base_version']='V189';r['formal_ready']=False;r['srs_eligible']=False
   assert r['global_sense_id'] is None and len(a['examples'])<=3
   for fld in ('meaning_zh','gloss_en','pos','examples','collocations','usage_note'):
    if a.get(fld):stats[fld+'_filled']+=1
   if a['required_semantic_content_complete']:stats['complete_unverified']+=1
   if r['question_page'].get('ipa'):stats['test_ipa_nonempty']+=1
   group.append(r)
 assert len(group)==1000
 with gzip.open(output,'wt',encoding='utf8',compresslevel=6) as f:
  for row in group:f.write(json.dumps(row,ensure_ascii=False,separators=(',',':'))+'\n')
 d=output.read_bytes();shards.append({'name':output.name,'records':1000,'bytes':len(d),'sha256':sha(d),'git_blob_sha1':hashlib.sha1(b'blob '+str(len(d)).encode()+b'\x00'+d).hexdigest()})
assert rows==list(range(1,3001)) and len(seen)==3000
assert stats['author_records_merged']+stats['identity_hold']+stats['meaning_hold']==288
manifest={'version':'V190','date':'2026-11-15','batch_unit':'Sense-Scene association','source_final_rows':[1,3000],'scene_count':len(scenes),'associations':3000,'lexical_entries':len(lex),'provisional_sense_groups':len(global_groups),'reused_provisional_associations':sum(v-1 for v in global_groups.values() if v>1),'formal_global_sense_ids':0,'new_source_author_candidates':288,'merged_author_records':stats['author_records_merged'],'held_author_candidates':len(holds),'preserved_content_conflicts':len(conflicts),'counts':dict(stats),'ipa_status_breakdown':dict(ipa),'shards':shards,'source_base':'V189 immutable 3000-row snapshot','source_crosswalk_sha1':raw['source_crosswalk_blob'],'source_master_sha256':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','formal_ready':0,'srs_eligible':False,'notes':['Author examples are unreviewed staging, not independently QA-certified','No fabricated gloss POS synonyms antonyms canonical global sense','Original Master, Reviewed V13, V189 unchanged.']}
for nm,obj in [('CGMASTER_V190_MANIFEST_20261115.json',manifest),('CGMASTER_V190_IDENTITY_HOLD_20261115.json',holds),('CGMASTER_V190_CONFLICTS_20261115.json',conflicts)]:
 (OUT/nm).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
zip_path=P/'CGMASTER_V190_FIRST3000_ADDITIONAL_AUTHOR_ANSWERS_20261115.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_STORED) as z:
 for f in sorted(OUT.iterdir()):z.write(f,arcname=f.name)
 z.write(pathlib.Path(__file__),arcname=pathlib.Path(__file__).name)
print(json.dumps({'manifest':manifest,'zip':str(zip_path),'zip_sha256':sha(zip_path.read_bytes())},ensure_ascii=False,indent=2))
