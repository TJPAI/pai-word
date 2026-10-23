// C2-intent-priority ablation. Deterministic corpus builder, no model inference.
// Usage: node experiments/scene500-ai-training/v1.6/build-c2-intent-priority.mjs
import {readFileSync,writeFileSync,mkdirSync,createHash} from 'node:fs';
const root=process.cwd(),base='experiments/scene500-ai-training/v1.4/';
const catalogText=readFileSync('scene500-recommendation/catalog-v0.2.json','utf8');
const catalog=JSON.parse(catalogText).scenes;
const overrides={};
for(const file of ['semantic-overrides.json','semantic-overrides-batch2.json','semantic-overrides-batch3.json','semantic-overrides-batch4.json']){
 const obj=JSON.parse(readFileSync(base+file,'utf8')).scenes;
 for(const [id,v] of Object.entries(obj)){if(overrides[id])throw Error('Duplicate override '+id);overrides[id]=v}
}
const ids=Array.from({length:500},(_,i)=>'S'+String(i+1).padStart(3,'0'));
if(Object.keys(catalog).length!==500||Object.keys(overrides).length!==229||catalog.S001.name!=='起床与晨间准备')throw Error('Catalog/override contract mismatch');
const clamp=(parts,n=12)=>[...new Set(parts.filter(Boolean))].slice(0,n);
const rich=(s,d,extra=[])=>[s.name,d,...(s.aliases||[]),...(s.actions||[]),...(s.objects||[]),...(s.example_queries||[]),...extra];
const text=parts=>'passage: '+clamp(parts).join('；').slice(0,360);
function build(s,v,kind){
 const desc=v?.description||s.description_enriched;
 if(!v)return text(rich(s,s.description_enriched));
 if(kind==='C2')return text(rich(s,desc,v.query_intents));
 // Preserve name + description; reserve slots for intents before long-tail examples.
 const intents=clamp(v.query_intents,kind==='P1'?2:kind==='P2'?4:12);
 if(kind==='P1')return text([s.name,desc,...intents,...(s.aliases||[]),...(s.actions||[]),...(s.objects||[]),...(s.example_queries||[])]);
 if(kind==='P2')return text([s.name,desc,...(s.aliases||[]),...intents,...(s.actions||[]),...(s.objects||[]),...(s.example_queries||[])]);
 if(kind==='P3')return text([s.name,desc,...(s.aliases||[]),...(s.actions||[]),...intents,...(s.objects||[]),...(s.example_queries||[])]);
 throw Error('Unknown variant '+kind);
}
const variants=['C2','P1','P2','P3'];
const corpora=Object.fromEntries(variants.map(k=>[k,[]]));
const diagnostics={};
for(const id of ids){
 const s=catalog[id],v=overrides[id];
 if(!s?.name)throw Error('Missing scene '+id);
 if(v&&(!Array.isArray(v.query_intents)||!v.query_intents.length||v.name!==s.name))throw Error('Invalid override '+id);
 for(const k of variants){
  const passage=build(s,v,k);
  if(passage.length>369)throw Error('Length cap violated '+id);
  corpora[k].push({id,passage});
 }
}
for(const k of variants){
 const arr=corpora[k];
 const intentIncluded=ids.filter((id,i)=>overrides[id]&&overrides[id].query_intents.some(q=>arr[i].passage.includes(q))).length;
 const intentExcluded=ids.filter((id,i)=>overrides[id]&&!overrides[id].query_intents.some(q=>arr[i].passage.includes(q)));
 const unchanged=ids.filter((id,i)=>!overrides[id]&&arr[i].passage!==corpora.C2[i].passage);
 if(unchanged.length)throw Error('Unchanged scene drift '+k);
 diagnostics[k]={scenes:arr.length,changedScenes:229,intentIncludedScenes:intentIncluded,intentExcludedScenes:intentExcluded.length,intentExcludedSample:intentExcluded.slice(0,20)};
}
const fingerprintPayload=ids.map(id=>[id,catalog[id].name]);
const identityFingerprint=createHash('sha256').update(JSON.stringify(fingerprintPayload)).digest('hex');
const catalogFileSha256=createHash('sha256').update(catalogText).digest('hex');
const out={schema:'scene500-c2-intent-priority-ablation-v1',taxonomyVersion:'scene500-taxonomy-20x25-v1',taxonomyFingerprint:identityFingerprint,catalogFileSha256,variants:corpora,diagnostics};
const dest='experiments/scene500-ai-training/v1.6/c2-intent-priority-corpora.json';
mkdirSync('experiments/scene500-ai-training/v1.6',{recursive:true});
writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({taxonomyFingerprint:identityFingerprint,catalogFileSha256,diagnostics},null,2));
