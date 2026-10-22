#!/usr/bin/env node
// Build-time Scene500 recommendation catalog; never edits original inputs.
// 250 drafted semantic profiles + 250 explicitly marked name-only fallbacks.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const home=read('rebuild-preview/data/home-scene-index-v1.json');
const overlay=read('data/scene500-semantic-overlay-v1.1.json');
const dest=path.join(root,'data/scene500-recommendation-catalog-v0.1.json');
const ids=Object.keys(home.scenes).sort();
if(ids.length!==500)throw Error('Expected 500 canonical scenes, got '+ids.length);
const scenes={};
for(const id of ids){
 const h=home.scenes[id],s=overlay.scenes[id];
 if(s&&s.name!==h.name)throw Error('Scene name mismatch '+id);
 scenes[id]=s?{...s,quality:'draft_unverified',counts:h.counts}:
  {name:h.name,description_enriched:'',aliases:[],actions:[],objects:[],
   example_queries:[],quality:'name_only_fallback',review_status:'not_started',counts:h.counts};
}
for(const id of Object.keys(overlay.scenes))if(!home.scenes[id])throw Error('Unknown overlay scene '+id);
const output={schema:'pai-scene500-recommendation-catalog-v0.1',
 source:'home-scene-index-v1 + semantic-overlay-v1.1',
 policy:'Build-time catalog only; do not substitute for Core20K/KU or production learning data',
 scene_count:ids.length,scenes};
fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
console.log('Wrote',dest,'with',ids.length,'scenes;',Object.keys(overlay.scenes).length,'draft profiles');

// Separate the deployable recommendation asset from home counts and learning data.
const liteScenes={};
for(const [id,s] of Object.entries(scenes)){
 const v={name:s.name};
 for(const k of ['description_enriched','aliases','actions','objects','example_queries','negative_terms','quality'])
  if(s[k]!==undefined&&(typeof s[k]!=='string'||s[k]))v[k]=s[k];
 liteScenes[id]=v;
}
const lite={schema:'pai-scene500-recommendation-catalog-v0.2',scene_count:500,scenes:liteScenes};
const liteDest=path.join(root,'scene500-recommendation/catalog-v0.2.json');
fs.writeFileSync(liteDest,JSON.stringify(lite));
console.log('Wrote compact recommendation catalog',liteDest);
