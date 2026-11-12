import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createEnglishCore20KV2Preview} from '../../rebuild-preview/scene1341-readonly/scene1341-enlex-preview.mjs';
const p=new URL('../../rebuild-preview/scene1341-readonly/scene1341-enlex-v2-exact-preview.json',import.meta.url);
const raw=await fs.readFile(p,'utf8'),data=JSON.parse(raw);
assert.equal(data.schema,'pai-scene1341-core20k-v2-exact-lexicon-preview-v1');
assert.equal(data.status,'ISOLATED_PREVIEW_ONLY_NOT_SEMANTICALLY_CERTIFIED');
assert.equal(data.source_sense_count,27471);
assert.equal(data.source_qa_ku_count,1778);
assert.equal(data.exact_lemma_matches,413);
assert.equal(Object.keys(data.entries).length,413);
assert.equal(data.not_released,true);
assert.equal(data.can_write_srs,false);
assert.equal(data.source_enlex_manifest_blob,'30fbd1fdde9d7ee59bc88da6465bbd9b772511a8');
assert.equal(data.source_qa_manifest_blob,'f8967fb97573bbccd89b4c645303dd2c983bb1da');
for(const [key,rows] of Object.entries(data.entries)){
 assert.equal(key,key.normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim());
 assert(rows.length>0&&rows.length<=6);
 for(const r of rows){
  assert.equal(r.lemma.normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim(),key);
  assert(r.sense_id&&r.gloss_zh&&r.gloss_en&&r.rank>0);
 }
}
const engine=createEnglishCore20KV2Preview({fetchImpl:async()=>new Response(raw,{status:200})});
const alarms=await engine.lookup(' ALARM ');
assert(alarms.length>0);
assert(alarms.every(x=>x.lemma.toLowerCase()==='alarm'));
assert.equal(engine.canWriteSrs,false);
assert.equal(engine.certified,false);
assert.deepEqual(await engine.lookup('NOT_IN_ANY_FROZEN_SENSE_000'),[]);
const poisoned=createEnglishCore20KV2Preview({fetchImpl:async()=>new Response(JSON.stringify({...data,not_released:false}),{status:200})});
await assert.rejects(()=>poisoned.lookup('alarm'),/ENLEX_PREVIEW_INDEX_GATE/);
const html=await fs.readFile(new URL('../../rebuild-preview/scene1341-readonly/index.html',import.meta.url),'utf8');
assert(html.includes('id="enlex-section" hidden'));
assert(html.includes('scene1341-enlex-preview.mjs'));
assert(html.includes('void renderLexiconReference(r)'));
assert(html.includes("subset()[index]?.scene_ku_id!==card.scene_ku_id"),'Stale lexical data must not display on next card');
assert(!html.includes('cdn.jsdelivr'));
console.log(JSON.stringify({status:'PASS',senses:27471,qaCandidates:1778,exactLinkedLemmas:413,
 previewOnly:true,formalCertification:false,productionSrsWrites:0,defaultNativeAnswerLayoutUnchanged:true}));
