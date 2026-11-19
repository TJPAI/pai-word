#!/usr/bin/env node
/**
 * Read-only CG-ENTEACH V51 draft intake. Run from a checkout containing both
 * tools/answer-enrichment and tools/scene1341_master/production.
 * Usage: node tools/scene1341_master/prepare_enteach_drafts.mjs <manifest.json> <output.jsonl>
 * Output is a candidate evidence queue, NOT an approved Master import.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const [manifestFile,outFile]=process.argv.slice(2);
if(!manifestFile||!outFile)throw Error('manifest and output required');
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
if(manifest.status!=='AUTHOR_DRAFT_QA_PENDING_NO_RELEASE')throw Error('unexpected manifest status');
const index=JSON.parse(fs.readFileSync('tools/scene1341_master/production/SCENE1341_LIVE_INDEX.json','utf8'));
const summary={packs:0,author_drafts:0,matched_unique:0,held_no_match:0,held_ambiguous:0,held_incomplete:0,held_source_mismatch:0,held_meaning_conflict:0};
const sceneCache=new Map(),out=[],holds=[],usedTargets=new Set(),seenAuthorIds=new Set();
function loadScene(id){
 if(sceneCache.has(id))return sceneCache.get(id);
 const meta=index.scenes[id];if(!meta)return null;
 const bytes=fs.readFileSync(meta.path);
 if(blob(bytes)!==meta.git_blob_sha1)throw Error('stale Master scene '+id);
 const scene=JSON.parse(bytes);
 if(scene.scene_id!==id||scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('invalid scene '+id);
 sceneCache.set(id,scene);return scene;
}
const norm=s=>String(s||'').normalize('NFKC').trim().toLocaleLowerCase('en');
for(const pack of manifest.assets.packs){
 const raw=fs.readFileSync(pack.path);
 if(blob(raw)!==pack.git_blob)throw Error('author pack SHA mismatch '+pack.path);
 const doc=JSON.parse(raw);
 if(doc.records?.length!==pack.records||doc.release_status!=='EDITORIAL_STAGING_ONLY')throw Error('invalid pack '+pack.path);
 summary.packs++;
 for(const d of doc.records){
  summary.author_drafts++;
  if(!d.scene_ku_id||seenAuthorIds.has(d.scene_ku_id))throw Error('duplicate/missing author KU identity '+d.scene_ku_id);
  seenAuthorIds.add(d.scene_ku_id);
  if(d.scene_id!==doc.scope?.scene_id)throw Error('author pack scene mismatch '+pack.path);
  const s=loadScene(d.scene_id);
  if(!s){summary.held_no_match++;holds.push({scene_id:d.scene_id,source_sense_id:d.source_sense_id,reason:'SCENE_NOT_FOUND'});continue;}
  const candidates=s.records.filter(r=>norm(r.question_page?.expression)===norm(d.expression)&&norm(r.answer_page?.meaning_zh)===norm(d.sense_zh));
  if(!candidates.length){
   const expressionMatches=s.records.filter(r=>norm(r.question_page?.expression)===norm(d.expression));
   if(expressionMatches.length){summary.held_meaning_conflict++;holds.push({scene_id:d.scene_id,source_sense_id:d.source_sense_id,expression:d.expression,author_meaning:d.sense_zh,reason:'EXPRESSION_MATCH_MEANING_CONFLICT',master_candidates:expressionMatches.slice(0,8).map(r=>({source_final_row:r.source_final_row,meaning_zh:r.answer_page?.meaning_zh}))});}
   else {summary.held_no_match++;holds.push({scene_id:d.scene_id,source_sense_id:d.source_sense_id,expression:d.expression,reason:'NO_EXPRESSION_MATCH'});}
   continue;
  }
  if(candidates.length!==1){summary.held_ambiguous++;holds.push({scene_id:d.scene_id,source_sense_id:d.source_sense_id,expression:d.expression,reason:'MULTIPLE_MASTER_SENSES',matches:candidates.length});continue;}
  const target=candidates[0],a=d.answer||{};
  const targetKey=d.scene_id+':'+target.source_final_row;
  if(usedTargets.has(targetKey)){summary.held_ambiguous++;holds.push({scene_id:d.scene_id,source_sense_id:d.source_sense_id,reason:'DUPLICATE_MASTER_TARGET',source_final_row:target.source_final_row});continue;}
  if(!a.example_en||!a.example_zh||!Array.isArray(a.collocations)||!a.collocations.length||!a.usage_note){summary.held_incomplete++;holds.push({scene_id:d.scene_id,source_sense_id:d.source_sense_id,reason:'INCOMPLETE_AUTHOR_ANSWER'});continue;}
  if(d.authoring_status!=='AUTHOR_DRAFT_QA_PENDING'||d.independent_language_qa!=='NOT_REVIEWED'||d.activation_allowed!==false){summary.held_source_mismatch++;holds.push({scene_id:d.scene_id,source_sense_id:d.source_sense_id,reason:'UNEXPECTED_QA_STATUS'});continue;}
  usedTargets.add(targetKey);
  out.push({scene_id:d.scene_id,source_final_row:target.source_final_row,expression:target.question_page.expression,source_sense_id:d.source_sense_id,source_rank:d.source_rank,fields:{meaning_zh:a.meaning_zh,example_en:a.example_en,example_zh:a.example_zh,collocations:a.collocations,usage_note:a.usage_note},provenance:{source:'CG-ENTEACH V51 author draft',source_id:d.scene_ku_id,pack_path:pack.path,pack_blob:pack.git_blob},qa_stage:'待审',release_allowed:false,srs_eligible:false});
  summary.matched_unique++;
 }
}
if(summary.author_drafts!==manifest.assets.packs.reduce((n,p)=>n+p.records,0))throw Error('manifest count mismatch');
if(summary.matched_unique+summary.held_no_match+summary.held_ambiguous+summary.held_incomplete+summary.held_source_mismatch+summary.held_meaning_conflict!==summary.author_drafts)throw Error('candidate accounting mismatch');
fs.writeFileSync(outFile,out.map(x=>JSON.stringify(x)).join('\n')+(out.length?'\n':''));
const holdFile=outFile.replace(/\.jsonl$/,'-holds.jsonl');
fs.writeFileSync(holdFile,holds.map(x=>JSON.stringify(x)).join('\n')+(holds.length?'\n':''));
console.log(JSON.stringify({...summary,output:outFile,hold_file:holdFile,publication:'NONE_DRAFT_QUEUE_ONLY'},null,2));
