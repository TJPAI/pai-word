#!/usr/bin/env node
// Reproduce the deployed candidate selectors, then apply explicit sense-level decisions.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const catalog=JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(root,'data/learning-v3/catalog.b64'),'utf8').trim(),'base64')));
const source=fs.readFileSync(path.join(root,'learning-app.js'),'utf8');
function constant(name){const match=source.match(new RegExp('const '+name+'=([\\s\\S]*?);'));if(!match)throw Error('Missing runtime constant '+name);return vm.runInNewContext('('+match[1]+')',{}, {timeout:1000});}
const topics=[...constant('foodTopicSets'),...constant('topicSets')];
const explicit=constant('explicitTaskTerms');
const dims=read('data/scene-dimensions-v1.json').dimensions;
const aliases=read('data/scene-semantic-rules-v1.json').aliases;
const rules=read('data/scene-dimension-rules-v1.json').rules;
const seeds=read('data/scene-headword-seeds-v1.json').seeds;
const entries=[...read('data/scene-taxonomy-proposal-v1.json').domains.flatMap(d=>d.topics.map(t=>({id:t.id,name:t.name,dimension:'topic',group:d.name}))),...dims.flatMap(d=>d.groups.flatMap(g=>g.items.map(i=>({id:i.id,name:i.name,dimension:d.id,group:g.name}))))];
const units=new Map(),words=Array.isArray(catalog)?catalog:catalog.words;
let duplicateKU=0,totalKU=0;
for(const w of words)for(const s of w[3]){totalKU++;if(units.has(s[0]))duplicateKU++;units.set(s[0],{ku_id:s[0],word:w[1],rank:w[0],type:s[2],title:s[3],pos:s[4],gloss:s[5]});}
const senses=[...units.values()].filter(u=>u.type==='sense');
const senseCount=new Map(words.map(w=>[w[0],w[3].filter(s=>s[2]==='sense').length]));
const lemmas=new Set(words.map(w=>w[1].toLowerCase()));
const missingSeeds=Object.entries(seeds).flatMap(([scene,ws])=>ws.filter(w=>!lemmas.has(w.toLowerCase())).map(word=>({scene,word,status:'absent_from_catalog_not_necessarily_invalid_English'})));
const missingTopicSeeds=topics.flatMap(t=>t.words.split(/\s+/).filter(w=>!lemmas.has(w)).map(word=>({scene:t.name,word})));
const reviewsPath='data/scene-ku-review-v1.json';
const reviews=fs.existsSync(path.join(root,reviewsPath))?read(reviewsPath):{decisions:[]};
const errors=[];const pairs=new Set();
for(const r of reviews.decisions){const u=units.get(r.ku_id),e=entries.find(e=>e.id===r.scene_id),pair=r.scene_id+'|'+r.ku_id;if(pairs.has(pair))errors.push('duplicate decision '+pair);pairs.add(pair);if(!e||!u||u.type!=='sense'||u.word!==r.word||u.gloss!==r.gloss||u.title!==r.title||!['include','exclude'].includes(r.action)||!r.reason)errors.push('invalid/stale decision '+pair);}
const scenes=entries.map(e=>{
 const terms=[...new Set([e.name,...(e.dimension==='topic'?aliases[e.name]||[]:[...(rules[e.name]||[]),...(explicit[e.name]||[])])])].filter(t=>t.length>=2);
 const seedSet=new Set(e.dimension==='topic'?(topics.find(t=>t.name===e.name)?.words||'').split(/\s+/):seeds[e.name]||[]);
 const candidates=[];
 for(const u of senses){const text=e.dimension==='topic'?u.gloss+' '+u.title:null;const matches=terms.filter(t=>text?text.includes(t):u.gloss.includes(t)||u.title.includes(t));const seed=seedSet.has(u.word.toLowerCase())&&senseCount.get(u.rank)===1;if(matches.length||seed)candidates.push({...u,source:matches.length?'gloss_alias':'headword_seed',matchedTerms:matches,seedMatch:seed,reviewStatus:'pending',dictionaryStatus:'not_verified'});}
 const accepted=new Map(candidates.map(u=>[u.ku_id,u]));const decisions=reviews.decisions.filter(r=>r.scene_id===e.id);let added=0,removed=0,confirmed=0;
 for(const r of decisions){if(r.action==='exclude'){if(accepted.delete(r.ku_id))removed++;}else{if(accepted.has(r.ku_id))confirmed++;else added++;accepted.set(r.ku_id,{...units.get(r.ku_id),source:'explicit_sense_review',reviewStatus:'editorially_reviewed',dictionaryStatus:'not_verified',reason:r.reason});}}
 const items=[...accepted.values()].sort((a,b)=>a.rank-b.rank||a.ku_id.localeCompare(b.ku_id));
 return {...e,beforeCount:candidates.length,count:items.length,added,removed,confirmed,pending:items.filter(x=>x.reviewStatus==='pending').length,duplicateWithinScene:candidates.length-new Set(candidates.map(x=>x.ku_id)).size,multipleRuleHits:candidates.filter(x=>x.matchedTerms.length+Number(x.seedMatch)>1).length,flags:[...(!items.length?['empty']:[]),...(items.length>0&&items.length<10?['low_coverage']:[]),...(items.length>1000?['possible_overmatching']:[])],items};
});
const links=scenes.flatMap(s=>s.items.map(u=>({scene:s.id,ku_id:u.ku_id})));const covered=new Set(links.map(x=>x.ku_id));
const summary={catalogWords:words.length,catalogKU:totalKU,catalogSenseKU:senses.length,sceneCount:scenes.length,byDimension:Object.fromEntries(['topic','task','function'].map(d=>[d,scenes.filter(s=>s.dimension===d).length])),candidateLinksBefore:scenes.reduce((n,s)=>n+s.beforeCount,0),linksAfter:links.length,uniqueSenseKUCovered:covered.size,unmappedSenseKU:senses.length-covered.size,emptyScenes:scenes.filter(s=>!s.count).length,lowCoverageScenes:scenes.filter(s=>s.count>0&&s.count<10).length,duplicateCatalogKU:duplicateKU,duplicateWithinScene:scenes.reduce((n,s)=>n+s.duplicateWithinScene,0),multipleRuleHits:scenes.reduce((n,s)=>n+s.multipleRuleHits,0),crossSceneLinksBeyondFirst:links.length-covered.size,missingDimensionSeedOccurrences:missingSeeds.length,missingTopicSeedOccurrences:missingTopicSeeds.length,reviewedIncludes:scenes.reduce((n,s)=>n+s.confirmed+s.added,0),addedMissingLinks:scenes.reduce((n,s)=>n+s.added,0),removedIncorrectLinks:scenes.reduce((n,s)=>n+s.removed,0),pendingLinks:scenes.reduce((n,s)=>n+s.pending,0),dictionaryVerifiedLinks:0,errors};
summary.scenesWithEditorialDecisions=new Set(reviews.decisions.map(r=>r.scene_id)).size;
summary.scenesStillContainingPending=scenes.filter(s=>s.pending>0).length;
summary.editoriallyReviewedUniqueKU=new Set(reviews.decisions.filter(r=>r.action==='include').map(r=>r.ku_id)).size;
summary.externallyVerifiedEnglishSeedErrors=null;
const output={schemaVersion:3,baselineCommit:'6bfe301cfa1cad31cd2ebddc2b76338b0b84e110',scope:'all 312 scene selectors; candidate matches are NOT semantic verification',notes:['Cross-scene reuse is permitted and is not automatically a duplicate error.','Unmapped senses and missing seeds are coverage candidates, not proven omissions.','Editorial decisions use exact existing sense gloss/title; no external dictionary verification claimed.'],summary,missingSeeds,missingTopicSeeds,unmapped:senses.filter(u=>!covered.has(u.ku_id)),scenes};
const arg=process.argv.indexOf('--out'),dest=arg>=0?process.argv[arg+1]:null;
if(dest)fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
if(words.length!==13000||totalKU!==16616||senses.length!==16136||scenes.length!==312||duplicateKU||errors.length)process.exitCode=1;
