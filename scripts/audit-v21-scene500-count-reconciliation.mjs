// Run: node scripts/audit-v21-scene500-count-reconciliation.mjs
// Read-only audit. Does NOT alter scene data, user state or GitHub branches.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(path.join(root,p),'utf8'));
const index=read('rebuild-preview/data/home-scene-index-v1.json');
if(index.schema!=='pai-word-v21-home-index-v1')throw Error('Unexpected home index schema');
const errors=[],scenes=[],allIds=new Set(),uniqueKuIds=new Set();
for(let group=1;group<=20;group++){
 const name=String(group).padStart(2,'0');
 const file=read('data/scene500-top100-v40/group-'+name+'.json');
 if(file.schema!=='pai-scene500-top100-v40-v1')throw Error('Invalid shard '+name);
 if(Object.keys(file.scenes||{}).length!==25)errors.push({group,reason:'shard_scene_count',actual:Object.keys(file.scenes||{}).length});
 for(const [id,rows] of Object.entries(file.scenes||{})){
  if(allIds.has(id))errors.push({scene:id,reason:'duplicate_scene'});allIds.add(id);
  const home=index.scenes[id]?.counts;
  if(!home){errors.push({scene:id,reason:'home_scene_missing'});continue}
  if(rows.length!==100)errors.push({scene:id,reason:'top100_size',actual:rows.length});
  let counted=[0,0,0,0],seenLemmas=new Set(),seenKu=new Set(),duplicates=[],badRanks=[];
  rows.forEach(([rank,lemma,coreRank,kuId],i)=>{
   if(rank!==i+1)badRanks.push({rank,index:i+1});
   const norm=String(lemma).toLowerCase();
   if(seenLemmas.has(norm))duplicates.push({kind:'lemma',value:lemma});
   seenLemmas.add(norm);
   if(!kuId)return;
   if(seenKu.has(kuId))duplicates.push({kind:'ku',value:kuId});
   seenKu.add(kuId);uniqueKuIds.add(kuId);
   if(!Number.isInteger(coreRank)||coreRank<1||coreRank>20000){errors.push({scene:id,reason:'invalid_core_rank',coreRank});return}
   counted[coreRank<=4000?0:coreRank<=8000?1:coreRank<=11000?2:3]++;
  });
  const actual={all:seenKu.size,basic:counted[0],common:counted[1],advanced:counted[2],high:counted[3]};
  const diff=Object.fromEntries(Object.keys(actual).filter(k=>actual[k]!==home[k]).map(k=>[k,{home:home[k],top100:actual[k]}]));
  if(Object.keys(diff).length)errors.push({scene:id,reason:'count_mismatch',diff});
  if(duplicates.length)errors.push({scene:id,reason:'duplicate_candidates',duplicates});
  if(badRanks.length)errors.push({scene:id,reason:'rank_order',badRanks});
  scenes.push({id,home,top100NonNull:actual});
 }
}
for(let i=1;i<=500;i++){const id='S'+String(i).padStart(3,'0');if(!allIds.has(id))errors.push({scene:id,reason:'shard_scene_missing'})}
const summary={sceneCount:allIds.size,shardCount:20,homeCountTotal:Object.values(index.scenes).reduce((n,s)=>n+s.counts.all,0),
 top100NonNullTotal:scenes.reduce((n,s)=>n+s.top100NonNull.all,0),uniqueNonNullKuIds:uniqueKuIds.size,
 discrepancies:errors.length,byReason:errors.reduce((m,e)=>(m[e.reason]=(m[e.reason]||0)+1,m),{})};
const report={description:'Index vs non-null Top100 KU-ID audit; runtime core.byKU existence, canStudy and unique playable sense NOT verified',summary,errors};
if(process.argv.includes('--json'))writeFileSync(path.join(root,'scene500-reconciliation-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
