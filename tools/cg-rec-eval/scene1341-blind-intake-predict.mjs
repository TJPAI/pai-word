// Blind-ready, QUERY ONLY holdout: no ranking-aware target labels; no accuracy is computed.
import fs from 'node:fs';
import path from 'node:path';
import {buildCatalog as integrated} from '../../rebuild-preview/scene1341-search-core.mjs';
import {buildCatalog as upstream} from '../../../candidate-current/scene500-recommendation/scene1341-search-core.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestSha,queryPath]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestSha,queryPath].every(Boolean))throw Error('MISSING_PINNED_INPUT');
const intake=JSON.parse(fs.readFileSync(queryPath,'utf8'));
if(intake.status!=='QUERY_ONLY_UNADJUDICATED_NO_GOLD'||intake.labelsVisible!==false||
 intake.expectedSceneIds!==null||intake.queries?.length!==24||
 intake.queries.some(q=>Object.hasOwn(q,'expected')||Object.hasOwn(q,'target')||Object.hasOwn(q,'gold')))
 throw Error('BLIND_INTAKE_CONTAMINATED');
const ids=intake.queries.map(q=>q.id);
if(new Set(ids).size!==24||intake.queries.filter(q=>q.group==='zh').length!==8||
 intake.queries.filter(q=>q.group==='en').length!==8||intake.queries.filter(q=>q.group==='mixed').length!==8)throw Error('BLIND_GROUP_INTEGRITY_FAILED');
const csv=fs.readFileSync(catalogPath,'utf8');
const ranked=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv'),'utf8'));
const meta={sourceCommit,manifestSha};
const a=integrated(csv,ranked,meta),b=upstream(csv,ranked,meta);
if(a.sceneCount!==1341||b.sceneCount!==1341||a.expressionCount!==19371||b.expressionCount!==19371)throw Error('SOURCE_COUNTS_INVALID');
const rows=intake.queries.map(({id,group,query})=>{
 const i=a.search(query,{limit:10,experimentalIntentAliases:false});
 const u=b.search(query,{limit:10,experimentalIntentAliases:false});
 const safe=rs=>rs.every(r=>r.cg_qa==='NOT_REVIEWED_FOR_THIS_INDEX'&&r.release_status==='BLOCKED_PENDING_CG_QA_AND_MUSE');
 if(!safe(i)||!safe(u))throw Error('UNREVIEWED_RELEASE_GATE_CHANGED '+id);
 return {id,group,query,integrationTop10:i.map(x=>({scene_id:x.scene_id,score:x.score})),
 upstreamTop10:u.map(x=>({scene_id:x.scene_id,score:x.score})),
 top1Equal:(i[0]?.scene_id??null)===(u[0]?.scene_id??null),
 fullOrderAndScoresEqual:JSON.stringify(i.map(x=>[x.scene_id,x.score]))===JSON.stringify(u.map(x=>[x.scene_id,x.score]))};
});
const result={schema:'cg-rec-eval-scene1341-blind-intake-predictions-v1',
 status:'PREDICTIONS_SEPARATED_FROM_UNADJUDICATED_QUERY_SET',
 sourceCommit,manifestSha,integratedCommit:process.env.CG_MAIN_SHA??null,
 upstreamCommit:process.env.CG_REC_SHA??null,
 queryCount:24,labeledCount:0,blindGoldCount:0,releaseAllowed:false,
 allEquivalent:rows.every(x=>x.fullOrderAndScoresEqual),
 groups:Object.fromEntries(['zh','en','mixed'].map(g=>[g,{n:8,agreement:rows.filter(x=>x.group===g&&x.fullOrderAndScoresEqual).length}])),
 rows};
if(result.queryCount!==24||result.labeledCount!==0)throw Error('GOLD_NOT_AVAILABLE');
console.log(JSON.stringify(result,null,2));
