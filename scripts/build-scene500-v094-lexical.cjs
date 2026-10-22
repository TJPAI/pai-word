#!/usr/bin/env node
// Reproducible Chinese Core20K v0.9.4 → Scene500 lexical candidates.
// Not AI-generated semantic links. No false frequency or confidence assertions.
// Usage: node scripts/build-scene500-v094-lexical.cjs CORE20K.min.json catalog-v0.2.json OUTPUT.json
import fs from 'node:fs';
import crypto from 'node:crypto';
const [,,lexPath,catalogPath,outPath]=process.argv;
if(!lexPath||!catalogPath||!outPath)throw Error('Expected 3 file paths');
const raw=fs.readFileSync(lexPath),catRaw=fs.readFileSync(catalogPath);
const lex=JSON.parse(raw),catalog=JSON.parse(catRaw);
if(!Array.isArray(lex.terms)||lex.terms.length!==20000||Object.keys(catalog.scenes||{}).length!==500)throw Error('Invalid source dimensions');
const normalize=s=>String(s??'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const byTerm=new Map(),ids=new Set();
for(const row of lex.terms){
 const term=row.t??row.term,id=row.id??row.term_id;
 if(typeof term!=='string'||typeof id!=='string'||ids.has(id)||byTerm.has(term))throw Error('Invalid term identity');
 byTerm.set(term,id);ids.add(id);
}
const postings=new Map();
const add=(term,sceneId,score,evidence_type)=>{
 const term_id=byTerm.get(term);
 if(!term_id)return;
 const k=term_id+'\0'+sceneId,old=postings.get(k);
 if(!old||old.score<score)postings.set(k,{term_id,term,scene_id:sceneId,score,evidence_type,confidence:null,review_status:'lexical_candidate_unverified'});
};
for(const [sceneId,scene] of Object.entries(catalog.scenes)){
 if(!/^S(00[1-9]|0[1-9]\d|[1-4]\d\d|500)$/.test(sceneId))throw Error('Bad scene ID');
 const fields=[['scene_title',[scene.name],1],['alias',scene.aliases||[],.9],['action',scene.actions||[],.8],['object',scene.objects||[],.7]];
 for(const [kind,items,weight] of fields)for(const rawText of items){
  const value=normalize(rawText);
  if(!value)continue;
  // Exact field hit gets stronger evidence. Embedded hits must be >=2 Han characters.
  if(byTerm.has(value))add(value,sceneId,weight,kind+'_exact');
  for(const word of byTerm.keys()){
   if(word.length<2||word.length>=value.length)continue;
   if(value.includes(normalize(word)))add(word,sceneId,Math.round(weight*.65*1000)/1000,kind+'_substring');
  }
 }
}
const buckets=new Map();
for(const link of postings.values()){
 if(!buckets.has(link.term_id))buckets.set(link.term_id,[]);
 buckets.get(link.term_id).push(link);
}
const links=[];
for(const [,rows] of buckets){
 rows.sort((a,b)=>b.score-a.score||a.scene_id.localeCompare(b.scene_id));
 for(const [i,row] of rows.slice(0,50).entries())links.push({...row,rank:i+1,association_version:'v094-lexical-v0.2'});
}
links.sort((a,b)=>a.term_id.localeCompare(b.term_id)||a.rank-b.rank);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const output={schema:'pai-scene500-v094-lexical-associations-v0.2',association_version:'v094-lexical-v0.2',scene_count:500,quality:'lexical_candidate_unverified',source:{lexicon_version:lex.version||null,lexicon_sha256:sha(raw),catalog_sha256:sha(catRaw)},stats:{terms:20000,linked_terms:buckets.size,links:links.length,unlinked_terms:20000-buckets.size},links};
fs.writeFileSync(outPath,JSON.stringify(output)+'\n');
console.log(JSON.stringify(output.stats));
