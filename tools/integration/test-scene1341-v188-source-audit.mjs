/* CG-MAIN source audit of CG-MASTER V188 first 3000. This is NOT a runtime import.
 * Source SHA1 + SHA256, row identity, author fields, HOLD/release gates.
 * Never writes Master, Scene500, or a production SRS.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const COMMIT='59fab4f7498f685722f1c675576a4953dde1ffee';
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/'+COMMIT+'/tools/scene1341_master/qa_reports/';
const expected=[
 ['CGMASTER_V188_SOURCE00001_01000_AUTHOR_MERGED_ANSWER_OVERLAY.jsonl.gz',1000,'bba55cda580d14b579311400636526a0a8263262','2cc0eb6a0c84067f2eec7ef91ea2639b0f337d88a9add09cec9677c1470558e6'],
 ['CGMASTER_V188_SOURCE01001_02000_AUTHOR_MERGED_ANSWER_OVERLAY.jsonl.gz',1000,'b0e080ddd94baa416cfa0ec0b883ebaf18ca9f0d','98077885b5c6a6e3d7752a5fe36c7eec759a5f90356785b0e2ddbde03f1ba9c9'],
 ['CGMASTER_V188_SOURCE02001_03000_AUTHOR_MERGED_ANSWER_OVERLAY.jsonl.gz',1000,'df741b624206c74c446b31cdb89318a2a8679747','39f1bc482aaad731e7d948ff4c664356c1068f0c25ce03623df7b61ea9317835']
];
const rows=[],ids=new Set(),scenes=new Set();let ipa=0,examples=0,all6=0,meaning=0,gloss=0,pos=0;
for(const [filename,count,blob,sha256] of expected){
 const response=await fetch(ROOT+filename,{cache:'no-store'});
 assert.equal(response.status,200,'V188 immutable source must be reachable: '+filename);
 const gzip=Buffer.from(await response.arrayBuffer());
 assert.equal(createHash('sha256').update(gzip).digest('hex'),sha256,filename+' gzip SHA256');
 const gitPrefix=Buffer.from('blob '+gzip.length+'\0','utf8');
 assert.equal(createHash('sha1').update(gitPrefix).update(gzip).digest('hex'),blob,filename+' Git object SHA1');
 const lines=gunzipSync(gzip).toString('utf8').trimEnd().split('\n');
 assert.equal(lines.length,count,filename+' record count');
 for(const line of lines){
  const record=JSON.parse(line),q=record.question_page,a=record.answer_page;
  const n=record.source_final_row;
  assert(Number.isSafeInteger(n)&&n>=1&&n<=3000,'V188 source row');
  assert.match(record.record_id,/^SC1341-FINAL-SRC-[a-f0-9]{32}$/);
  assert(!ids.has(record.record_id),'V188 duplicate identity');ids.add(record.record_id);
  assert(/^SC50-\d{4}$/.test(record.scene_id),'V188 scene ID');
  assert(typeof q?.expression==='string'&&q.expression.trim(),'V188 expression');
  assert(typeof q?.cue_zh==='string'&&q.cue_zh.trim(),'V188 cue');
  assert(a&&typeof a==='object','V188 answer');
  assert(!Array.isArray(a.examples)||a.examples.length<=3,'V188 1-3 examples maximum');
  assert(Array.isArray(a.synonyms)&&Array.isArray(a.antonyms),'V188 additive sense relationship placeholders');
  assert(!record.release_allowed&&!record.srs_eligible,'V188 unapproved release gate');
  rows.push(n);scenes.add(record.scene_id);
  if(typeof q.ipa==='string'&&q.ipa.trim())ipa++;
  if(a.meaning_zh)meaning++;
  if(a.gloss_en)gloss++;
  if(a.pos)pos++;
  if(a.examples?.length)examples++;
  if(a.required_semantic_content_complete===true)all6++;
 }
}
assert.equal(ids.size,3000);assert.equal(scenes.size,13);
assert.deepEqual(rows,Array.from({length:3000},(_,i)=>i+1),'V188 contiguous ordered association rows');
assert.equal(ipa,1478);assert.equal(examples,907);assert.equal(all6,112);
assert.equal(meaning,3000);assert.equal(gloss,338);assert.equal(pos,338);
console.log(JSON.stringify({status:'PASS',version:'V188',records:3000,scenes:13,testIpa:ipa,
 authorExamples:examples,sixFieldUnverified:all6,sourcePinned:true,formalReady:0,srsWrites:0}));
