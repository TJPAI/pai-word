// Corpus-fitted sparse multilingual-character retrieval prototype. Training happens offline.
// This is not a pretrained embedding model and training examples from catalog are NOT blind evidence.
import {terms} from './microrec.mjs';
const tokenize=s=>[...new Set(terms(s))];
export function trainSparse(catalog,{dimension=4096}={}){
 const scenes=Object.entries(catalog.scenes).sort(([a],[b])=>a.localeCompare(b));
 const rows=new Map(),idf=new Map();
 for(const [id,s] of scenes){
  const surfaces=[s.name,...(s.aliases||[]),...(s.example_queries||[]),...(s.actions||[]),...(s.objects||[])];
  const tf=new Map();
  for(const [i,surface] of surfaces.entries())for(const token of tokenize(surface)){tf.set(token,(tf.get(token)||0)+(i===0?4:i<=s.aliases?.length?2:1));}
  rows.set(id,tf);for(const token of tf.keys())idf.set(token,(idf.get(token)||0)+1);
 }
 const sceneIds=scenes.map(([id])=>id);
 const N=scenes.length,weights=new Map();
 for(const [id,row] of rows){let norm=0;const v=new Map();for(const [t,count] of row){const z=(1+Math.log(count))*Math.log(1+N/(idf.get(t)||1));v.set(t,z);norm+=z*z;}norm=Math.sqrt(norm)||1;for(const [t,w] of v)v.set(t,w/norm);weights.set(id,v);}
 return Object.freeze({modelKind:'catalog-fitted-sparse-prototype',scenes:N,featureDimension:dimension,
  search(query,{limit=5,eligibleSceneIds=null}={}){
   const toks=tokenize(query);if(!toks.length)return[];
   const allowed=eligibleSceneIds?new Set(eligibleSceneIds):null;
   let qnorm=0;const qw=new Map();for(const t of toks){const w=Math.log(1+N/(idf.get(t)||N));qw.set(t,w);qnorm+=w*w;}qnorm=Math.sqrt(qnorm)||1;
   return sceneIds.filter(id=>!allowed||allowed.has(id)).map(id=>{let score=0;const v=weights.get(id);for(const [t,w] of qw)score+=(v.get(t)||0)*w/qnorm;return {sceneId:id,name:catalog.scenes[id].name,score:+score.toFixed(6)};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId)).slice(0,limit);
  }
 });
}
