#!/usr/bin/env python3
"""V189: non-destructive V188 + V75 Batch02 exact CG-ENTEACH author answer merge.
Preserve old certified/author content and all original identities. No fabricated semantic data.
"""
import json,gzip,hashlib,zipfile,pathlib,collections
P=pathlib.Path('/mnt/data'); SRC=P/'CGMASTER_V188_FIRST3000_AUTHOR_MERGED'; DELTA=P/'CGMASTER_V189_TEMP_AUTHOR_PATCH_TRANSFER_20261115.txt';OUT=P/'CGMASTER_V189_FIRST3000_AUTHOR_MERGED';OUT.mkdir(exist_ok=True)
def norm(x):return ' '.join(str(x or '').strip().casefold().split())
def hashdata(x):return hashlib.sha256(x).hexdigest()
raw=json.loads(DELTA.read_text(encoding='utf-8-sig'))
assert raw['version']=='V189';delta={}
for x in raw['records']:
 n=x['record_row'];assert n not in delta;delta[n]=x
assert len(delta)==266
counts=collections.Counter();matched=set();conflicts=[];extra_holds=list(raw['prehold']);scenes=set();lex=set();groups=collections.Counter();ipa=collections.Counter();rids=set();rows=[];shards=[]
for i in range(3):
 src=SRC/f'CGMASTER_V188_SOURCE{i*1000+1:05d}_{(i+1)*1000:05d}_AUTHOR_MERGED_ANSWER_OVERLAY.jsonl.gz'
 dest=OUT/src.name.replace('V188','V189').replace('AUTHOR_MERGED_ANSWER_OVERLAY','BATCH02_AUTHOR_MERGED_OVERLAY')
 part=[]
 with gzip.open(src,'rt',encoding='utf8') as f:
  for line in f:
   r=json.loads(line);n=r['source_final_row'];rid=r['record_id'];assert rid not in rids;rids.add(rid);rows.append(n)
   scenes.add(r['scene_id']);lex.add(r['lexical_entry_id']);ipa[r['question_page']['ipa_status']]+=1
   if r.get('provisional_sense_group_key'):groups[r['provisional_sense_group_key']]+=1
   a=r['answer_page'];x=delta.get(n)
   if x:
    if r['scene_id']!=x['scene_id'] or norm(r['question_page']['expression'])!=norm(x['expression']) or norm(r['question_page']['cue_zh'])!=norm(x['cue_zh']):
     extra_holds.append({'row':n,'ku':x['ku'],'reason':'SOURCE_SCENE_EXPRESSION_ZH_MISMATCH'});counts['identity_holds']+=1
    else:
     author=x['author_answer']
     if norm(a.get('meaning_zh'))!=norm(author.get('meaning_zh')):
      extra_holds.append({'row':n,'ku':x['ku'],'reason':'MEANING_ZH_CONFLICT'});counts['meaning_holds']+=1
     else:
      matched.add(n);counts['author_records_merged']+=1
      for field in ('example_en','example_zh','collocations','usage_note'):
       v=author.get(field)
       if not v:continue
       if a.get(field):
        if a[field]!=v:conflicts.append({'row':n,'field':field,'action':'PRESERVED_EXISTING'});counts['preserved_existing_conflicts']+=1
       else:a[field]=v;counts['new_'+field]+=1
      en=author.get('example_en');zh=author.get('example_zh')
      if en and zh:
       pairs=a.setdefault('examples',[])
       if not any(norm(z.get('example_en'))==norm(en) and norm(z.get('example_zh'))==norm(zh) for z in pairs):
        if len(pairs)<3:
         pairs.append({'example_en':en,'example_zh':zh,'source':'V189_BATCH02_CG_ENTEACH_V51_AUTHOR','status':'AUTHOR_DRAFT_NOT_CERTIFIED','evidence':{'pack':x['pack'],'git_blob_sha1':x['blob'],'ku_audit_only':x['ku'],'crosswalk_blob_sha1':raw['source_crosswalk_blob']}});counts['new_examples']+=1
        else:extra_holds.append({'row':n,'reason':'EXAMPLE_LIMIT_3'})
      note=author.get('contrast_note')
      if note and not (a.get('sense_disambiguation') or {}).get('note_zh'):
       dis=a.setdefault('sense_disambiguation',{});dis.update({'note_zh':note,'status':'EXISTING_AUTHOR_DRAFT_NOT_SENSE_VERIFIED','source':x['pack']});counts['contrast_note_reused']+=1
      r.setdefault('evidence',{})['author_answer_batch02_reuse']={'ku_id_audit_only':x['ku'],'pack':x['pack'],'git_blob_sha1':x['blob'],'crosswalk_git_blob_sha1':raw['source_crosswalk_blob'],'qa_status':x['qa_status']}
      a['author_source']=x['pack'];a['answer_author_status']='V189_BATCH02_EXISTING_AUTHOR_DRAFT_NOT_CERTIFIED'
   a['examples_status']='EXISTING_1_TO_3_BILINGUAL_AUTHOR_DRAFT_NOT_CERTIFIED' if a.get('examples') else 'MISSING_BILINGUAL_EXAMPLES'
   a['required_semantic_content_complete']=bool(a.get('meaning_zh') and a.get('gloss_en') and a.get('pos') and a.get('examples') and a.get('collocations') and a.get('usage_note'))
   a['extended_enrichment_complete']=False
   r['schema']='CGMASTER_V189_SOURCE_SAFE_AUTHOR_ENRICHMENT_STAGING';r['version']='V189';r['base_version']='V188';r['formal_ready']=False;r['srs_eligible']=False
   assert r['global_sense_id'] is None and len(a.get('examples',[]))<=3
   for field in ('meaning_zh','gloss_en','pos','examples','collocations','usage_note'):
    if a.get(field):counts[field+'_filled']+=1
   if a['required_semantic_content_complete']:counts['content_complete_unverified']+=1
   if r['question_page'].get('ipa'):counts['test_ipa_nonempty']+=1
   part.append(r)
 assert len(part)==1000
 with gzip.open(dest,'wt',encoding='utf8',compresslevel=6) as out:
  for v in part:out.write(json.dumps(v,ensure_ascii=False,separators=(',',':'))+'\n')
 d=dest.read_bytes();shards.append({'name':dest.name,'records':1000,'bytes':len(d),'sha256':hashdata(d),'git_blob_sha1':hashlib.sha1(b'blob '+str(len(d)).encode()+b'\x00'+d).hexdigest()})
assert rows==list(range(1,3001));assert len(matched)+counts['identity_holds']+counts['meaning_holds']==266
manifest={'version':'V189','date':'2026-11-15','batch_unit':'Sense-Scene association','scope':{'source_final_rows':[1,3000],'scenes':len(scenes),'sense_scene_associations':3000,'lexical_entries':len(lex),'provisional_sense_groups':len(groups),'provisional_reused_associations':sum(v-1 for v in groups.values() if v>1),'certified_global_senses':0},'source':'V188 immutable full 3000 plus GitHub CG-ENTEACH V51 + exact V75 Batch02 crosswalk','source_master_sha256':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','new_author_exact_candidates':266,'matched_author_records':len(matched),'prehold_v75':len(raw['prehold']),'total_holds_including_merge':len(extra_holds),'preserved_existing_conflicts':len(conflicts),'counts':dict(counts),'ipa_status_breakdown':dict(ipa),'shards':shards,'release_allowed':False,'formal_ready':0,'srs_eligible':False,'policy':['Retain original Master and Reviewed V13','No invented gloss/POS/synonyms/antonyms/Global Sense','1-3 original bilingual examples per Sense-Scene, source pinned','Do not certify author gloss or examples without independent QA']}
(OUT/'CGMASTER_V189_MANIFEST_20261115.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'CGMASTER_V189_IDENTITY_AND_CONTENT_HOLD_20261115.json').write_text(json.dumps(extra_holds,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'CGMASTER_V189_EXISTING_CONTENT_CONFLICTS_20261115.json').write_text(json.dumps(conflicts,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
zp=P/'CGMASTER_V189_FIRST3000_ADDITIONAL_AUTHOR_ANSWERS_20261115.zip'
with zipfile.ZipFile(zp,'w',zipfile.ZIP_STORED) as z:
 for v in sorted(OUT.iterdir()):z.write(v,arcname=v.name)
 z.write(pathlib.Path(__file__),arcname=pathlib.Path(__file__).name)
print(json.dumps({'manifest':manifest,'zip':str(zp),'zip_sha256':hashdata(zp.read_bytes())},ensure_ascii=False,indent=2))
