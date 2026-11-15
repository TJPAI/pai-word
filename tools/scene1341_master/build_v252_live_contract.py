#!/usr/bin/env python3
"""Build source-verified Scene1341 full live contract from V247 ZIP. All records TEST ONLY."""
import hashlib,json,pathlib,sys,zipfile
SOURCE_SHA='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986'
assert len(sys.argv)==3
zpath=pathlib.Path(sys.argv[1]);root=pathlib.Path(sys.argv[2]);target=root/'tools/scene1341_master/production/scenes';target.mkdir(parents=True,exist_ok=True)
index={'schema_version':'scene1341-master-index/v1','scene_count':1341,'source_associations':230289,'source_master_sha256':SOURCE_SHA,'release_allowed':False,'srs_eligible':False,'scenes':{}}
rows=set();missing=0
with zipfile.ZipFile(zpath) as z:
 names={pathlib.PurePosixPath(x).name:x for x in z.namelist() if x.endswith('.json')}
 for i in range(1,1342):
  sid=f'SC50-{i:04d}';key=f'CGMASTER_V247_{sid}_L1_TEST_PAGES.json';assert key in names
  d=json.loads(z.read(names[key]));assert d['scene_id']==sid and d['release_allowed'] is False
  cards=[]
  for r in d['records']:
   assert r['record_id'] is None and r['release_allowed'] is False and r['scene_id']==sid
   n=r['source_final_row'];assert n not in rows;rows.add(n)
   a=r['answer_page'];q=r['question_page'];missing+=a['meaning_zh'] is None
   cards.append({'record_id':None,'source_final_row':n,'scene_id':sid,'question_page':{'expression':q['expression'],'cue_zh':a['meaning_zh'],'ipa_candidate':None},'answer_page':{'meaning_zh':a['meaning_zh'],'gloss_en':None,'example_en':None,'example_zh':None,'examples':[],'collocations':[],'usage_note':None},'source':r['source'],'coverage_level':'L1_FROZEN_FINAL_SOURCE_ONLY','release_allowed':False,'srs_eligible':False})
  doc={'schema_version':'scene1341-master-scene/v1','scene_id':sid,'record_count':len(cards),'source_master_sha256':SOURCE_SHA,'release_allowed':False,'srs_eligible':False,'records':cards}
  raw=(json.dumps(doc,ensure_ascii=False,separators=(',',':'))+'\n').encode();sha=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
  path=f'tools/scene1341_master/production/scenes/{sid}.json';(target/f'{sid}.json').write_bytes(raw);index['scenes'][sid]={'path':path,'records':len(cards),'git_blob_sha1':sha}
assert len(rows)==230289 and min(rows)==1 and max(rows)==230289 and missing==222
p=root/'tools/scene1341_master/production/SCENE1341_LIVE_INDEX.json';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({'scenes':1341,'source_associations':len(rows),'missing_meaning':missing}))
