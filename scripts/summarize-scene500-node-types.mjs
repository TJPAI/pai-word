#!/usr/bin/env node
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const taxonomy=read('data/scene-taxonomy-v2.json');
const docs=[read('data/scene500-node-types-s001-s250-v1.json'),read('data/scene500-node-types-s251-s500-v1.json')];
const typeById=new Map();
for(const doc of docs) for(const [type,v] of Object.entries(doc.types||{})) for(const id of v.sceneIds||[]) typeById.set(id,type);
const global={};
const byCategory={};
for(const s of taxonomy.scenes||[]){
 const type=typeById.get(s.id)||'UNCLASSIFIED';
 global[type]=(global[type]||0)+1;
 byCategory[s.categoryId]??={total:0,types:{}};
 byCategory[s.categoryId].total++;
 byCategory[s.categoryId].types[type]=(byCategory[s.categoryId].types[type]||0)+1;
}
for(const [cid,row] of Object.entries(byCategory)){
 const entries=Object.entries(row.types).sort((a,b)=>b[1]-a[1]);
 row.dominantType=entries[0]?.[0]||null;
 row.dimensionHeavy=(row.types.function||0)+(row.types.cognitive_facet||0)+(row.types.place||0)+(row.types.task||0) > row.total/2;
}
console.log(JSON.stringify({taxonomyId:taxonomy.taxonomyId,totalScenes:(taxonomy.scenes||[]).length,global,byCategory},null,2));
