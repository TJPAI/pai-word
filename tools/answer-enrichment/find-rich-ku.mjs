// Read-only audit of the REAL learning-v3 chunks used by the regular answer page.
// Run: node tools/answer-enrichment/find-rich-ku.mjs
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const root=new URL('../../data/learning-v3/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
const memberships=JSON.parse(readFileSync(new URL('../../data/scene500-playable-membership-v2.json',import.meta.url),'utf8')).scenes;
const sceneByLemma=new Map();
for(const [scene,record] of Object.entries(memberships))for(const entry of record.entries||[]){const lemma=typeof entry==='string'?entry:entry.lemma;if(!sceneByLemma.has(lemma))sceneByLemma.set(lemma,[]);sceneByLemma.get(lemma).push(scene)}
const matches=[];const counts={total:0,collocation:0,example:0,comparison:0,twoOrMore:0,allThree:0};
for(const [chunkIndex,chunk] of manifest.chunks.entries()){
 const encoded=readFileSync(new URL(chunk.file,root),'utf8').trim();
 const rows=JSON.parse(gunzipSync(Buffer.from(encoded,'base64')).toString('utf8'));
 for(const row of rows){
  for(const [ku,s] of Object.entries(row.s||{})){
   counts.total++;
   const c=typeof s.c==='string'&&s.c.trim().length>0;
   const e=Array.isArray(s.e)&&s.e.some(v=>typeof v==='string'&&v.trim());
   const cmp=s.compare;
   const d=Array.isArray(cmp?.items)?cmp.items.some(x=>x?.word&&x?.example_en):Array.isArray(cmp?.words)&&Array.isArray(cmp?.examples)&&cmp.words.length>0&&cmp.examples.length>0;
   if(c)counts.collocation++;if(e)counts.example++;if(d)counts.comparison++;
   const n=Number(c)+Number(e)+Number(d);
   if(n>=2)counts.twoOrMore++;if(n===3)counts.allThree++;
   if(n>=2)matches.push({lemma:row.w,rank:row.rank,ku,chunkIndex,fields:[c?'搭配':null,e?'例句':null,d?'辨析':null].filter(Boolean),scenes:sceneByLemma.get(row.w)||[],collocation:c?s.c.slice(0,140):null,example:e?s.e[0]:null,comparison:d?cmp:null});
  }
 }
}
matches.sort((a,b)=>b.fields.length-a.fields.length||(b.scenes.length-a.scenes.length)||a.rank-b.rank);
console.log(JSON.stringify({counts,top:matches.slice(0,60)},null,2));
