#!/usr/bin/env python3
"""V182 non-destructive, source-locked first-3000 Master three-layer page enrichment.
No inferred canonical sense IDs; no automatic authoring of missing pedagogical examples.
"""
import os, csv, gzip, json, hashlib, collections, re, pathlib, zipfile, sys
P=pathlib.Path('/mnt/data'); OUT=P/'CGMASTER_V182_SC0001_ONWARD_FIRST3000'
OUT.mkdir(exist_ok=True)
source=P/'CGMASTER_V108_BATCH001_100SCENES_FULL_KAIKKI_EVIDENCE_EXPANDED.jsonl.gz'
v13=P/'PAI_Word_Scene1341_ReviewedMaster_WORKING_V13_20261112.csv.gz.csv'
qa_files=[P/f'CGMASTER_V179_SC0001_0013_PART{i}_SENSE_IPA_TEST_20261114.jsonl.gz' for i in range(1,5)]
paired_files=list((P/'v171').glob('CGMASTER_V171_SC00*_PAIRED_QUESTION_ANSWER_DRAFT_20261114.json'))
def norm(s):return re.sub(r'\s+',' ',str(s or '').strip()).casefold()
def digest(v,n=24):return hashlib.sha256(v.encode()).hexdigest()[:n]
def dump(obj,path):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf8')
source_rows=[]
with gzip.open(source,'rt') as f:
 for line in f:
  if len(source_rows)>=3000:break
  source_rows.append(json.loads(line))
assert len(source_rows)==3000 and [r['source_final_row'] for r in source_rows]==list(range(1,3001))
assert len({r['original_record_id_candidate'] for r in source_rows})==3000
pron={}
for p in qa_files:
 with gzip.open(p,'rt') as f:
  for line in f:
   x=json.loads(line);key=x['record_id'];assert key not in pron;pron[key]=x
assert len(pron)==3000
paired={}
for p in paired_files:
 j=json.loads(p.read_text());
 for x in j['records']:
  if x['source_final_row']<=3000:
   assert x['record_id'] not in paired
   paired[x['record_id']]=dict(x, _source_file=p.name)
# Match Reviewed V13 using scene+expression+Chinese, never source row.
scene_set={x['scene_id'] for x in source_rows}
v13_index=collections.defaultdict(list);v13_scene_expression=collections.defaultdict(list)
with gzip.open(v13,'rt',newline='') as f:
 for x in csv.DictReader(f):
  if x['scene_id'] not in scene_set:continue
  e=norm(x.get('working_expression') or x['english_expression']); zh=norm(x.get('working_zh') or x['master_original_zh'])
  v13_index[(x['scene_id'],e,zh)].append(x)
  v13_scene_expression[(x['scene_id'],e)].append(x)
lexical={}; global_candidate={}; scene_rows=[];hold=[];mismatches=[]
count=collections.Counter();statuses=collections.Counter();reuse_provisional=collections.Counter();
for raw in source_rows:
 sid=raw['scene_id'];rid=raw['original_record_id_candidate'];expression=raw['expression'];chinese=raw['original_sense_zh']
 p=pron[rid];assert p['source_final_row']==raw['source_final_row'] and norm(p['expression'])==norm(expression)
 matched=v13_index.get((sid,norm(expression),norm(chinese)),[])
 id_status='UNIQUE_SCENE_EXPRESSION_ZH' if len(matched)==1 else ('AMBIGUOUS_MATCH' if matched else 'NOT_FOUND_EXACT')
 if len(matched)!=1:
  count['v13_held']+=1
  mismatches.append({'source_final_row':raw['source_final_row'],'record_id':rid,'scene_id':sid,'expression':expression,'meaning_zh':chinese,'match_count':len(matched),'same_scene_expression_count':len(v13_scene_expression.get((sid,norm(expression)),[]))})
 elif matched[0].get('working_zh')!=chinese:
  count['v13_alternative_chinese']+=1
 row13=matched[0] if len(matched)==1 else None
 lex_id='SC1341-LEX-'+digest(norm(expression))
 if lex_id not in lexical:
  lexical[lex_id]={'lexical_entry_id':lex_id,'display_expression':expression,'normalized_expression':norm(expression),'source_first_row':raw['source_final_row'],'source_master_sha256':raw['master_sha256'],'candidate_sense_count':0,'scene_refs':[]}
 lexical[lex_id]['scene_refs'].append(rid)
 ke=raw['kaikki_evidence'];candidates=ke.get('candidate_senses') or []
 exact_candidates=[x for x in candidates if x.get('glosses_en') and x.get('pos')]
 only_cand=exact_candidates[0] if len(candidates)==1 and len(exact_candidates)==1 else None
 # Unreviewed lexical gloss cannot be asserted as the Chinese meaning's matching Sense.
 gkey=None
 if only_cand:
  gloss=str(only_cand['glosses_en'][0]).strip()
  pos=only_cand['pos'];k=norm(expression)+'\x1f'+norm(pos)+'\x1f'+norm(gloss)+'\x1f'+norm(chinese)
  gkey='SC1341-GSC-PROVISIONAL-'+digest(k)
  if gkey not in global_candidate:
   global_candidate[gkey]={'provisional_group_key':gkey,'lexical_entry_id':lex_id,'headword':expression,'pos_candidate':pos,'gloss_en_candidate':gloss,'zh_guide':chinese,'canonical_sense_id':None,'verification_status':'SEMANTIC_ALIGNMENT_NOT_CERTIFIED','evidence_source_pack':only_cand.get('source_pack'),'source_evidence_line':only_cand.get('source_line'),'sense_scene_record_ids':[]}
  global_candidate[gkey]['sense_scene_record_ids'].append(rid);reuse_provisional[gkey]+=1
 qpron=p.get('pronunciation') or {};qsource='V179_SOURCE_PINN';status=qpron.get('status') or 'UNKNOWN';ipa=qpron.get('selected_ipa_test_only')
 prev=paired.get(rid)
 if not ipa and prev and prev.get('question_page',{}).get('ipa'):
  ipa=prev['question_page']['ipa'];status='V171_LEGACY_PREVIEW_FALLBACK_NOT_AUTHORITY';qsource=prev['_source_file'];count['v171_ipa_reused_when_v179_missing']+=1
 elif ipa:count['v179_test_ipa_reused']+=1
 statuses[status]+=1
 question={'expression':expression,'cue_zh':chinese,'ipa':ipa,'ipa_status':status,'ipa_source_ref':qsource,'audio_text':expression,'audio_url':None,'record_id':rid,'scene_id':sid,'rank':int(row13['rank']) if row13 and row13.get('rank','').isdigit() else None,'rank_status':'REVIEWED_V13_EXACT_JOIN' if row13 else 'HOLD_V13_IDENTITY','lexical_entry_id':lex_id,'global_sense_id':None,'provisional_sense_group_key':gkey,'source_final_row':raw['source_final_row']}
 a=prev.get('answer_page',{}) if prev else {}
 answer={'meaning_zh':a.get('meaning_zh') or chinese,'gloss_en':str(only_cand['glosses_en'][0]).strip() if only_cand else None,'gloss_status':'SINGLE_KAIKKI_CANDIDATE_UNREVIEWED' if only_cand else 'HOLD_UNRESOLVED_SEMANTIC_ALIGNMENT','pos':only_cand['pos'] if only_cand else None,'pos_status':'SINGLE_KAIKKI_CANDIDATE_UNREVIEWED' if only_cand else 'HOLD_UNRESOLVED_POS','example_en':a.get('example_en'),'example_zh':a.get('example_zh'),'collocations':a.get('collocations') or [],'usage_note':a.get('usage_note'),'optional_contrast_note':a.get('contrast_note'),'author_source':prev['_source_file'] if prev else None,'answer_author_status':'EXISTING_V171_AUTHOR_DRAFT_NOT_CERTIFIED' if prev else 'MISSING_AUTHOR_CONTENT_NEEDS_REUSE_FROM_ENTEACH'}
 lex_status='CANDIDATE_SINGLE' if only_cand else ('CANDIDATE_MULTIPLE' if candidates else 'CANDIDATE_NONE');count['sense_'+lex_status]+=1
 statuses['ANSWER_EXISTING_V171' if prev else 'ANSWER_MISSING_CONTENT']+=1
 record={'schema':'CGMASTER_V182_THREE_LAYER_NONDESTRUCTIVE_OVERLAY','version':'V182','source_final_row':raw['source_final_row'],'record_id':rid,'scene_id':sid,'scene_name':raw['scene_name'],'lexical_entry_id':lex_id,'global_sense_id':None,'candidate_group_not_sense_id':raw['candidate_group_not_sense_id'],'provisional_sense_group_key':gkey,'reviewed_v13':{'status':id_status,'candidate_id_not_global_sense_id':row13['candidate_id'] if row13 else None,'audit_row_no':int(row13['audit_row_no']) if row13 else None,'rank':question['rank'],'qa_status':row13.get('qa_status') if row13 else None,'v13_qa_status':row13.get('v13_qa_status') if row13 else None},'question_page':question,'answer_page':answer,'evidence':{'master_sha256':raw['master_sha256'],'source_record_locator':raw['source_record_locator'],'kaikki_candidate_status':ke.get('status'),'kaikki_candidate_senses':candidates,'pronunciation_evidence':qpron,'pronunciation_source':'CGMASTER_V179','paired_answer_source':answer['author_source']},'semantic_status':'HOLD_GLOBAL_SENSE_ID_NOT_YET_VERIFIED','formal_ready':False,'srs_eligible':False}
 scene_rows.append(record)
 for field in ['expression','cue_zh','ipa','audio_text']:
  if question.get(field): count['question_'+field+'_filled']+=1
 for field in ['meaning_zh','gloss_en','pos','example_en','example_zh','collocations','usage_note']:
  if answer.get(field):count['answer_'+field+'_filled']+=1
 if all(question.get(k) for k in ['expression','cue_zh','ipa','audio_text']):count['question_page_complete_test']+=1
 if all(answer.get(k) for k in ['meaning_zh','gloss_en','pos','example_en','example_zh','collocations','usage_note']):count['answer_page_all_fields_nonempty_unverified']+=1
 if not gkey:hold.append({'record_id':rid,'source_final_row':raw['source_final_row'],'scene_id':sid,'reason':'NO_UNAMBIGUOUS_SINGLE_KAIKKI_SENSE_CANDIDATE','candidate_count':len(candidates)})
assert len(scene_rows)==3000
counts={'records':3000,'scenes':len({x['scene_id'] for x in scene_rows}),'lexical_entries':len(lexical),'official_global_sense_ids':0,'provisional_semantic_groups':len(global_candidate),'provisional_reused_groups':sum(v>1 for v in reuse_provisional.values()),'provisional_reused_associations':sum(v-1 for v in reuse_provisional.values() if v>1),'v171_paired_source_rows_reused':sum(bool(x['answer_page']['author_source']) for x in scene_rows),'reviewed_v13_unique_exact_links':3000-count['v13_held'],'reviewed_v13_ambiguous_or_missing':count['v13_held']}
for k,v in count.items():counts[k]=v
counts['ipa_status_breakdown']=dict(collections.Counter(x['question_page']['ipa_status'] for x in scene_rows))
assert sum(counts['ipa_status_breakdown'].values())==3000
# 1000-row deterministic sharding
shards=[]
for j in range(3):
 chunk=scene_rows[j*1000:(j+1)*1000];name=f'CGMASTER_V182_SOURCE{1+j*1000:05d}_{(j+1)*1000:05d}_FULL_PAGE_OVERLAY.jsonl.gz';dest=OUT/name
 with gzip.open(dest,'wt',encoding='utf8',compresslevel=6) as f:
  for x in chunk:f.write(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
 with gzip.open(dest,'rt') as f:assert sum(1 for _ in f)==1000
 data=dest.read_bytes();sha=hashlib.sha256(data).hexdigest();gitsha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 shards.append({'name':name,'records':1000,'bytes':len(data),'sha256':sha,'git_blob_sha1':gitsha})
lex_file=OUT/'CGMASTER_V182_LEXICAL_ENTRIES.json.gz';sense_file=OUT/'CGMASTER_V182_PROVISIONAL_GLOBAL_SENSE_GROUPS.json.gz'
for fn,ob in [(lex_file,list(lexical.values())),(sense_file,list(global_candidate.values()))]:
 with gzip.open(fn,'wt',encoding='utf8') as f:json.dump(ob,f,ensure_ascii=False,separators=(',',':'))
report={'version':'V182','date':'2026-11-15','scope':'SC50-0001 through first 113 rows of SC50-0013','source_final_rows':[1,3000],'source_master_sha256':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','authority':'V108 + Reviewed V13 + V179 + V171 available paired drafts','source_policy':'NO_OVERWRITE / NO_CANONICAL_SENSE_ID_INVENTION / ALL_PREVIEWS_TEST_ONLY / NO_SRS','counts':counts,'shards':shards,'open_issues':['SC0001-0010 CG-ENTEACH answer-only assets only evidenced through V75 join metadata; full author payload not yet materialized: preserve references, do not replace.','Kaikki single-sense evidence is still not independently aligned to Chinese meaning and cannot be certified.','Global Sense groups are provisional semantic-signature matches, never final canonical IDs.','No fabricated examples, translations, collocations, or usage notes.','All items require independent QA before Ready.'],'payload_files':[lex_file.name,sense_file.name]}
dump(report,OUT/'CGMASTER_V182_MANIFEST.json')
dump(mismatches,OUT/'CGMASTER_V182_REVIEWED_V13_JOIN_HOLD.json')
dump(hold,OUT/'CGMASTER_V182_SENSE_SELECTION_HOLD.json')
zipfile_name=P/'CGMASTER_V182_FIRST3000_THREE_LAYER_PAGE_OVERLAY_20261115.zip'
with zipfile.ZipFile(zipfile_name,'w',compression=zipfile.ZIP_STORED) as z:
 for path in sorted(OUT.iterdir()):z.write(path,arcname=path.name)
print(json.dumps({'report':report,'zip':str(zipfile_name),'zip_sha256':hashlib.sha256(zipfile_name.read_bytes()).hexdigest()},ensure_ascii=False,indent=2))
