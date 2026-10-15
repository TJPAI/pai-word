#!/usr/bin/env node
// Offline audit against the ACTUAL Core-13000 KU inventory. No network or dependencies.
// Usage: node scripts/audit-scene-ku.mjs [--out path.json]
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const catalogText=fs.readFileSync(path.join(root,'data/learning-v3/catalog.b64'),'utf8').trim();
const catalog=JSON.parse(zlib.gunzipSync(Buffer.from(catalogText,'base64')).toString('utf8'));
const dims=read('data/scene-dimensions-v1.json').dimensions;
const rules=read('data/scene-dimension-rules-v1.json').rules;
const seeds=read('data/scene-headword-seeds-v1.json').seeds;
const entries=dims.flatMap(d=>d.groups.flatMap(g=>g.items.map(i=>({id:i.id,name:i.name,dimension:d.id}))));
const byScene=new Map(entries.map(e=>[e.id,{...e,items:[],seen:new Set()}]));
const wordRows=Array.isArray(catalog)?catalog:(catalog.words||[]);
if(!wordRows.length)throw Error('Cannot find catalog.words: inspect catalog format before claiming results');
const sensesOf=row=>(row[3]||[]).filter(s=>s[2]==='sense').map(s=>({ku_id:s[0],kuTitle:s[3],m:s[5]}));
let totalSenses=0;
for(const w of wordRows){
 const lemma=w[1],senses=sensesOf(w);totalSenses+=senses.length;
 for(const s of senses){
  const gloss=String(s.m||''),title=String(s.kuTitle||'');
  for(const e of entries){
   const aliases=[e.name,...(rules[e.name]||[])].filter(x=>x.length>=2);
   const matched=aliases.find(t=>gloss.includes(t)||title.includes(t));
   const seed=senses.length===1&&(seeds[e.name]||[]).includes(String(lemma||'').toLowerCase());
   if(!matched&&!seed)continue;
   const row=byScene.get(e.id);
   if(row.seen.has(s.ku_id))continue;
   row.seen.add(s.ku_id);
   row.items.push({ku_id:s.ku_id,word:lemma,gloss,title,source:matched?'gloss_alias':'editorial_headword_seed',matchedText:matched||lemma});
  }
 }
}
const report=[...byScene.values()].map(({seen,...row})=>{
 const count=row.items.length,seedCount=row.items.filter(x=>x.source==='editorial_headword_seed').length;
 return {...row,count,seedCount,flags:[...(count===0?['empty']:[]),...(count>0&&count<10?['low_count']:[]),...(count>1000?['overmatch_candidate']:[])]};
}).sort((a,b)=>a.count-b.count);
const output={schemaVersion:1,source:'actual_catalog_b64_offline_audit',reviewStatus:'unverified_candidates',catalogWords:wordRows.length,catalogSenseRows:totalSenses,sceneCount:report.length,nonemptyScenes:report.filter(x=>x.count>0).length,scenes:report};
const arg=process.argv.indexOf('--out'),dest=arg>=0?process.argv[arg+1]:null;
if(dest)fs.writeFileSync(dest,JSON.stringify(output,null,2));
console.log(JSON.stringify({catalogWords:output.catalogWords,catalogSenseRows:totalSenses,sceneCount:report.length,nonemptyScenes:output.nonemptyScenes,empty:report.filter(x=>x.count===0).map(x=>x.name),lowest:report.slice(0,15).map(x=>({name:x.name,count:x.count,seedCount:x.seedCount})),outputFile:dest},null,2));
if(wordRows.length!==13000||report.length!==124)process.exitCode=1;
