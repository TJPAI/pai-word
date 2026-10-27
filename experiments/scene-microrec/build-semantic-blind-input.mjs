import fs from 'node:fs';
import {bilingualSeeds} from './bilingual-seeds.mjs';
const cat=JSON.parse(fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url))).scenes;
const rows=bilingualSeeds.map(x=>({scene_id:x.scene_id,chinese:cat[x.scene_id].name,description:cat[x.scene_id].description_enriched,english:x.candidate_en}));
if(rows.length!==500 || new Set(rows.map(x=>x.scene_id)).size!==500)throw Error('Bad scene coverage');
const pack={schema:'scene500-blind-review-input-v1',status:'PENDING_INDEPENDENT_BLIND_REVIEW',training_allowed:false,rows};
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./semantic-blind-input-500.json',import.meta.url),JSON.stringify(pack,null,2));
console.log(JSON.stringify({status:pack.status,rows:rows.length,firstPassConclusionsIncluded:false}));
