#!/usr/bin/env node
/**
 * Scene500 E5 retrieval failure investigation: inspect canonical descriptions.
 * Read-only, no threshold calibration and no changes to training labels.
 * Run at repository root: node experiments/scene500-ai-training/v1.3/scene-description-audit.mjs
 */
import {readFileSync} from 'node:fs';
const scenes=JSON.parse(readFileSync('scene500-recommendation/catalog-v0.2.json','utf8')).scenes;
const cases=[
 {id:'H035',query:'我要让聊天机器人回答得更好',expected:'S278',retrieved:'S034'},
 {id:'H041',query:'Could you help me polish my CV',expected:'S203',retrieved:'S208'},
 {id:'H046',query:'This supplier delivered the wrong items',expected:'S236',retrieved:'S238'},
 {id:'H057',query:'请帮我比较两个产品的优缺点',expected:'S491',retrieved:'S227'},
 {id:'H070',query:'我想学高等数学',expected:null,retrieved:'S161'}
];
for(const item of cases){
 const e=item.expected?scenes[item.expected]:null,r=scenes[item.retrieved];
 if(!r||(item.expected&&!e))throw Error('Unknown scene ID in audit '+item.id);
 console.log(JSON.stringify({id:item.id,query:item.query,
  expected:item.expected?{id:item.expected,name:e.name,description:e.description_enriched}:null,
  top1:{id:item.retrieved,name:r.name,description:r.description_enriched},
  note:'No automatic label correction; taxonomy-aware independent review required.'},null,2));
}
const generic=Object.entries(scenes).filter(([id,s])=>
 typeof s.description_enriched==='string'&&s.description_enriched.includes('用于理解、描述或讨论相关情境'));
console.log(JSON.stringify({schema:'scene500-description-audit-v1',sceneCount:Object.keys(scenes).length,
 genericDescriptionCount:generic.length,genericDescriptionIds:generic.map(([id])=>id),
 warning:'Generic template descriptions are a corpus-quality risk; not evidence of individual model failure.'},null,2));
