// Scene MicroRec isolated experiment: three dependency-free baselines.
// No change to production Scene500 engine, catalog or learning state.
import { performance } from 'node:perf_hooks';
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const words=s=>(norm(s).match(/[\p{Script=Han}]+|[a-z0-9]+/gu)||[]);
const terms=s=>{const t=[];for(const w of words(s)){if(/[\p{Script=Han}]/u.test(w)){for(let i=0;i<w.length;i++){if(i+1<w.length)t.push('c2:'+w.slice(i,i+2));if(i+2<w.length)t.push('c3:'+w.slice(i,i+3));}if(w.length<=4)t.push('w:'+w);}else{t.push('w:'+w);if(w.length>=5)for(let i=0;i+3<=w.length;i++)t.push('e3:'+w.slice(i,i+3));}}return t;};
const fields=s=>[['name',s.name,5],['aliases',(s.aliases||[]).join(' '),4],['actions',(s.actions||[]).join(' '),3],['objects',(s.objects||[]).join(' '),2],['description',s.description_enriched||'',1],['examples',(s.example_queries||[]).join(' '),0.75]];
function prepare(catalog){const docs=Object.entries(catalog.scenes).sort(([a],[b])=>a.localeCompare(b)).map(([id,s])=>({id,name:s.name,scene:s,tf:new Map(),length:0}));const df=new Map();
for(const d of docs){for(const [,value,boost] of fields(d.scene))for(const token of terms(value)){d.tf.set(token,(d.tf.get(token)||0)+boost);d.length+=boost;}for(const t of d.tf.keys())df.set(t,(df.get(t)||0)+1);}
return {docs,df,avg:docs.reduce((n,d)=>n+d.length,0)/docs.length};}
function rank(docs,scores,limit,eligible){const allowed=eligible==null?null:new Set(eligible);return docs.map((d,i)=>({sceneId:d.id,name:d.name,score:+scores[i].toFixed(5)})).filter(r=>r.score>0&&(!allowed||allowed.has(r.sceneId))).sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId)).slice(0,limit);}
function lexical(index,query){const t=[...new Set(terms(query))],N=index.docs.length;return index.docs.map(d=>{let z=0;for(const w of t){const f=d.tf.get(w)||0;if(!f)continue;const df=index.df.get(w)||0,idf=Math.log(1+(N-df+0.5)/(df+0.5));z+=idf*(f*2.2)/(f+1.2*(0.25+0.75*d.length/index.avg));}return z;});}
// Hash projection, inspired by fastText subword features; NOT pretrained embeddings.
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function embed(str,dim=128){const out=new Float32Array(dim);for(const t of terms(str)){const h=hash(t),i=h%dim;out[i]+=h&0x100?1:-1;}let n=Math.hypot(...out);if(n)for(let i=0;i<dim;i++)out[i]/=n;return out;}
function dot(a,b){let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s;}
function semantic(index,query){const q=embed(query);return index.vectors.map(v=>Math.max(0,dot(q,v)));}
function build(catalog){if(!catalog||!catalog.scenes)throw Error('Missing scene catalog');const index=prepare(catalog);index.vectors=index.docs.map(d=>embed(fields(d.scene).map(([,value])=>value).join(' ')));return Object.freeze({size:index.docs.length,
 search(query,{method='hybrid',limit=5,eligibleSceneIds=null}={}){if(!norm(query))return[];const lex=lexical(index,query),sem=semantic(index,query);const max=Math.max(1e-9,...lex),score=lex.map((x,i)=>method==='lexical'?x:method==='hashed-semantic'?sem[i]:0.7*x/max+0.3*sem[i]);return rank(index.docs,score,limit,eligibleSceneIds);},
 describe(){return {scenes:index.docs.length,vectorBytes:index.docs.length*128*4,methods:['lexical','hashed-semantic','hybrid']};}
});}
export {build as createMicroRec,terms};
