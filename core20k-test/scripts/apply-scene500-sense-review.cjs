#!/usr/bin/env node
const fs=require('node:fs');
const path=require('node:path');

function fail(message){console.error('ERROR:',message);process.exit(1)}
function readJson(file){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch(e){fail(`cannot read JSON ${file}: ${e.message}`)}}
function norm(v){return String(v||'').trim().toLowerCase()}

const args=process.argv.slice(2);
const get=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null};
const membershipPath=get('--membership')||path.join(process.cwd(),'data','scene500-playable-membership-v2.json');
const patchPath=get('--patch');
const outputPath=get('--output');
const overwrite=args.includes('--overwrite');
if(!patchPath)fail('usage: node scripts/apply-scene500-sense-review.cjs --patch review-patch.json [--membership data/scene500-playable-membership-v2.json] [--output updated.json | --overwrite]');
if(overwrite&&outputPath)fail('choose either --output or --overwrite, not both');

const membership=readJson(membershipPath),patch=readJson(patchPath);
if(membership.schemaVersion!==2)fail('membership schemaVersion must be 2');
if(patch.schema!=='pai-word-scene500-membership-patch-v1')fail('unsupported patch schema');
if(patch.mutationApplied!==false)fail('patch must be review output with mutationApplied=false');
if(Array.isArray(patch.errors)&&patch.errors.length)fail(`patch contains ${patch.errors.length} review errors; resolve them first`);
if(!Array.isArray(patch.patches)||!patch.patches.length)fail('patch contains no selections');

const seen=new Set(),changes=[];
for(const p of patch.patches){
  const sceneId=String(p.sceneId||''),lemma=norm(p.lemma),kuId=String(p.kuId||'');
  if(!sceneId||!lemma||!kuId)fail('every patch row requires sceneId, lemma and kuId');
  const key=`${sceneId}:${lemma}`;if(seen.has(key))fail(`duplicate patch row: ${key}`);seen.add(key);
  if(p.senseBindingReviewed!==true)fail(`${key}: senseBindingReviewed must be true`);
  if(!['manual_review','dictionary_corpus_verified','source_verified'].includes(p.senseBindingMethod))fail(`${key}: invalid senseBindingMethod`);
  const scene=membership.scenes?.[sceneId];if(!scene)fail(`${key}: scene not found in membership`);
  const matches=(scene.entries||[]).filter(e=>norm(e?.lemma)===lemma);
  if(matches.length!==1)fail(`${key}: expected exactly one membership entry, found ${matches.length}`);
  const entry=matches[0];
  if(p.sceneRank!=null&&Number(entry.sceneRank)!==Number(p.sceneRank))fail(`${key}: sceneRank mismatch membership=${entry.sceneRank} patch=${p.sceneRank}`);
  if(entry.senseBindingReviewed===true&&entry.kuId&&String(entry.kuId)!==kuId)fail(`${key}: refusing to replace an already reviewed different KU (${entry.kuId} -> ${kuId})`);
  const before={kuId:entry.kuId??null,coreRank:entry.coreRank??null,senseBindingReviewed:entry.senseBindingReviewed===true};
  entry.kuId=kuId;
  if(p.coreRank!=null)entry.coreRank=Number(p.coreRank);
  entry.senseBindingReviewed=true;
  entry.senseBindingMethod=p.senseBindingMethod;
  entry.senseReviewNote=String(p.senseReviewNote||'');
  entry.senseReviewedAt=String(p.senseReviewedAt||'');
  entry.senseReviewedBy=String(p.senseReviewedBy||'');
  changes.push({key,before,after:{kuId:entry.kuId,coreRank:entry.coreRank??null,senseBindingReviewed:true}});
}

const target=overwrite?membershipPath:(outputPath||path.join(process.cwd(),'data','scene500-playable-membership-v2.reviewed.json'));
if(!overwrite&&path.resolve(target)===path.resolve(membershipPath))fail('refusing implicit overwrite; use --overwrite explicitly');
fs.writeFileSync(target,JSON.stringify(membership,null,2)+'\n','utf8');
console.log(JSON.stringify({ok:true,input:membershipPath,output:target,changeCount:changes.length,changes},null,2));
