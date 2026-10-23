// Reproduce v0.6 candidate-metric comparison with Node.js 18+.
// Run from repository root:
// node experiments/scene500-ai-training/v0.6/verify-holdout.mjs
import {readFileSync} from 'node:fs';
const base='experiments/scene500-ai-training/';
const read=p=>readFileSync(base+p,'utf8');
const jsonl=p=>read(p).trim().split(/\r?\n/).map(JSON.parse);
const train=jsonl('v0.2/weak-semantic-seeds.jsonl');
const other=[...jsonl('v0.2/evaluation-draft.jsonl'),...jsonl('v0.4/hardcases-editorial.jsonl')];
const cases=jsonl('v0.6/unseen-evaluation-draft.jsonl');
const anchors=JSON.parse(read('v0.5/semantic-anchor-rules.json')).rules;
const norm=s=>s.toLowerCase().normalize('NFKC').replace(/\s+/g,' ').trim();
const seen=new Set([...train,...other].map(x=>norm(x.query)));
if(cases.some(x=>seen.has(norm(x.query))))throw Error('holdout exact-query leakage');
const tokens=q=>{const s=norm(q),out=new Set();for(let n=1;n<=3;n++)for(let i=0;i<=s.length-n;i++)out.add(n+':'+s.slice(i,i+n));return [...out]};
const docs=train.map(x=>tokens(x.query)),df=new Map(),posting=new Map(),mag=[];
for(const arr of docs)for(const t of arr)df.set(t,(df.get(t)||0)+1);
const idf=t=>Math.log((train.length+1)/(1+(df.get(t)||0)))+1;
docs.forEach((ts,i)=>{let sq=0;for(const t of ts){const w=idf(t);sq+=w*w;if(!posting.has(t))posting.set(t,[]);posting.get(t).push([i,w])}mag.push(Math.sqrt(sq))});
function baseline(q,threshold=.35){const ts=tokens(q).filter(t=>df.has(t));let sq=0;const dot=new Map();for(const t of ts){const w=idf(t);sq+=w*w;for(const [i,v] of posting.get(t))dot.set(i,(dot.get(i)||0)+w*v)}const by=new Map(),den=Math.sqrt(sq)||1;for(const [i,value] of dot){const score=value/(den*mag[i]);if(score<threshold)continue;for(const {scene_id} of train[i].labels)by.set(scene_id,Math.max(by.get(scene_id)||0,score))}return [...by].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5).map(x=>x[0])}
const matches=(q,t)=>/^[a-z0-9 ]+$/.test(t)?new RegExp('(^|[^a-z0-9])'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])').test(q):q.includes(t);
function hybrid(q){const normalized=norm(q),anchored=anchors.filter(r=>r.terms.some(t=>matches(normalized,norm(t)))).map(x=>x.scene_id);return [...new Set([...anchored,...baseline(q)])].slice(0,5)}
function metric(fn){const yes=cases.filter(x=>x.expected_scene_ids.length),no=cases.filter(x=>!x.expected_scene_ids.length);return{hits:yes.filter(x=>fn(x.query).some(id=>x.expected_scene_ids.includes(id))).length,positive:yes.length,unknownRecommended:no.filter(x=>fn(x.query).length).length,unknown:no.length,byLanguage:Object.fromEntries(['zh','en'].map(language=>[language,{hits:yes.filter(x=>x.language===language&&fn(x.query).some(id=>x.expected_scene_ids.includes(id))).length,count:yes.filter(x=>x.language===language).length}]))}}
console.log(JSON.stringify({cases:cases.length,train:train.length,baseline:metric(baseline),hybrid:metric(hybrid),note:'unreviewed draft labels: not gold metrics'},null,2));
