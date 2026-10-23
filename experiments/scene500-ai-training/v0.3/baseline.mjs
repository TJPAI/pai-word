// Scene500 v0.3 standalone JS baseline, for Node >=18
// Run: node baseline.mjs ../v0.2/weak-semantic-seeds.jsonl ../v0.2/evaluation-draft.jsonl
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const trainPath = process.argv[2] || '../v0.2/weak-semantic-seeds.jsonl';
const evalPath = process.argv[3] || '../v0.2/evaluation-draft.jsonl';
const read = p => readFileSync(resolve(p),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const train=read(trainPath), test=read(evalPath);
const tokens=q=>{
 const s=q.toLowerCase().replace(/\s+/g,' ').trim(), out=new Set();
 for(let n=1;n<=3;n++)for(let i=0;i<=s.length-n;i++)out.add(n+':'+s.slice(i,i+n));
 return [...out];
};
const docs=train.map(r=>tokens(r.query)),df=new Map(),post=new Map(),norm=[];
for(const ts of docs)for(const t of ts)df.set(t,(df.get(t)||0)+1);
const idf=t=>Math.log((train.length+1)/(1+(df.get(t)||0)))+1;
docs.forEach((ts,i)=>{
 let square=0;
 for(const t of ts){const w=idf(t);square+=w*w;if(!post.has(t))post.set(t,[]);post.get(t).push([i,w]);}
 norm.push(Math.sqrt(square));
});
function recommend(query,threshold=.35,limit=10){
 const ts=tokens(query).filter(t=>df.has(t)), dot=new Map();let querySq=0;
 for(const t of ts){const w=idf(t);querySq+=w*w;for(const [i,v] of post.get(t))dot.set(i,(dot.get(i)||0)+w*v)}
 const nq=Math.sqrt(querySq)||1,scenes=new Map();
 for(const [i,value] of dot){const score=value/(nq*norm[i]);if(score<threshold)continue;
  for(const {scene_id} of train[i].labels)if(score>(scenes.get(scene_id)||0))scenes.set(scene_id,score);
 }
 return [...scenes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit);
}
const thresholds=[.15,.25,.35,.45,.55];
const sweep=thresholds.map(threshold=>{
 let hits=0,positives=0,unknownWithHits=0,unknown=0;
 for(const row of test){const found=recommend(row.query,threshold);if(row.expected_scene_ids.length){positives++;
 if(found.slice(0,5).some(([id])=>row.expected_scene_ids.includes(id)))hits++;
 }else{unknown++;if(found.length)unknownWithHits++}}
 return {threshold,hits,positives,unknownWithHits,unknown};
});
console.log(JSON.stringify({weakTrainingCount:train.length,unreviewedEvalCount:test.length,
 vocabularySize:df.size,sweep,
 warning:'diagnostic only; evaluation labels not independently reviewed'},null,2));
