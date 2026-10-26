// Read-only validation for Scene500 teaching candidates against the SAME
// Core20K Runtime + S113 Top100 assets loaded by the original preview.
// Run: node tools/answer-enrichment/validate-s113-candidates.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const here=new URL('./',import.meta.url);
const readJson=path=>JSON.parse(readFileSync(new URL(path,here),'utf8'));
const candidates=readJson('s113-teaching-candidates.v1.json');
const shard=readJson('../../data/scene500-top100-v40/group-05.json').scenes?.S113;
const runtime=JSON.parse(gunzipSync(readFileSync(new URL('../../data/core20k-runtime.json.gz',here))).toString('utf8'));
assert.equal(runtime.schema,'pai-core20k-runtime-v1');
assert.equal(runtime.headwords.length,20000);
assert.equal(candidates.status,'EDITORIAL_STAGING_UNCERTIFIED');
assert.equal(candidates.production_ready,false);
assert.equal(candidates.scene_id,'S113');
assert(Array.isArray(shard)&&shard.length===100);
const seen=new Set(),report=[];
for(const c of candidates.records){
 assert.equal(c.scene_id,'S113');
 assert(Number.isInteger(c.scene_rank)&&c.scene_rank>=1&&c.scene_rank<=100);
 assert(Number.isInteger(c.core_rank)&&c.core_rank>=1&&c.core_rank<=20000);
 assert(!seen.has(c.ku_id),'duplicate KU');
 seen.add(c.ku_id);
 const scene=shard[c.scene_rank-1];
 assert.deepEqual([scene[0],scene[1],scene[2],scene[3]],[c.scene_rank,c.headword,c.core_rank,c.ku_id],'scene mapping mismatch');
 const word=runtime.headwords[c.core_rank-1];
 assert.equal(word[0],c.core_rank,'core rank mismatch');
 assert.equal(word[1],c.headword,'lemma mismatch');
 const units=word[4],sense=units.find(u=>u[0]===c.ku_id);
 assert(sense,'KU does not belong to headword');
 assert.equal(sense[1],'sense','KU is not a Sense');
 assert.equal(sense[4],true,'KU is not eligible');
 assert(typeof sense[2]==='string'&&sense[2].trim(),'missing Core20K Chinese gloss');
 assert(typeof sense[3]==='string'&&sense[3].trim(),'missing Core20K English gloss');
 for(const field of ['collocation','example_en','example_zh','contrast_note']){
  assert(typeof c[field]==='string'&&c[field].trim().length>=10&&c[field].length<=1500,field+' invalid');
 }
 assert(/[.!?]$/.test(c.example_en),'English sentence lacks end punctuation');
 assert(/[。！？]$/.test(c.example_zh),'Chinese translation lacks end punctuation');
 assert(!('content_certified' in c)||c.content_certified===false,'uncertified pack claims certification');
 const genericGloss=/^core modern learner use of[\\s“"']/i.test(sense[3]);
 const multipleChineseSenses=/[；;]/.test(sense[2]);
 const risks=[genericGloss?'generic_English_gloss_needs_sense_review':null,multipleChineseSenses?'multiple_Chinese_meanings_needs_binding_review':null].filter(Boolean);
 report.push({scene_rank:c.scene_rank,headword:c.headword,ku_id:c.ku_id,gloss_zh:sense[2],gloss_en:sense[3],fields:['collocation','example_en','example_zh','contrast_note'],risks,status:risks.length?'IDENTITY_VERIFIED_SEMANTIC_REVIEW_REQUIRED':'IDENTITY_VERIFIED_EDITORIAL_REVIEW_REQUIRED'});
}
console.log(JSON.stringify({source:'Core20K runtime + S113 Top100',entries:report.length,results:report,editorialSemanticReview:'PENDING',certification:'NOT_GRANTED'},null,2));
