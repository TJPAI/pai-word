// Trainable feature-hashed scene ranker prototype. No dependency, deterministic, int8 export.
// Training examples are generated ONLY from catalog source phrases; NOT blind certification.
import {terms} from './microrec.mjs';
function hash(t){let h=2166136261;for(let i=0;i<t.length;i++){h=Math.imul(h^t.charCodeAt(i),16777619);}return h>>>0;}
const tokenize=q=>[...new Set(terms(q))];
export function trainTinyRanker(catalog,{dimension=1024,epochs=2,learningRate=.2}={}){
 const sceneRows=Object.entries(catalog.scenes).sort(([a],[b])=>a.localeCompare(b));
 const ids=sceneRows.map(([id])=>id),size=ids.length,weights=new Float32Array(size*dimension);
 const pairs=[];
 for(let i=0;i<size;i++){const s=sceneRows[i][1];for(const q of [s.name,...(s.aliases||[]),...(s.example_queries||[])])if(q&&q.length>=2)pairs.push([i,q]);}
 const features=q=>tokenize(q).map(t=>hash(t)%dimension);
 const score=(i,features)=>features.reduce((sum,f)=>sum+weights[i*dimension+f],0)/(Math.sqrt(features.length)||1);
 for(let epoch=0;epoch<epochs;epoch++)for(const [positive,q] of pairs){
  const f=features(q);if(!f.length)continue;
  let negative=(positive+97+epoch*43)%size;if(negative===positive)negative=(negative+1)%size;
  const margin=1-score(positive,f)+score(negative,f);
  if(margin>0){const delta=learningRate/(Math.sqrt(f.length)||1);for(const feature of f){weights[positive*dimension+feature]+=delta;weights[negative*dimension+feature]-=delta;}}
 }
 let max=0;for(const w of weights)max=Math.max(max,Math.abs(w));
 const scale=max/127||1,quant=new Int8Array(weights.length);
 for(let i=0;i<weights.length;i++)quant[i]=Math.max(-127,Math.min(127,Math.round(weights[i]/scale)));
 return Object.freeze({scenes:size,dimension,quantizedBytes:quant.byteLength,trainingPairs:pairs.length,
 search(query,{limit=5,eligibleSceneIds=null}={}){const f=features(query);if(!f.length)return[];const allowed=eligibleSceneIds?new Set(eligibleSceneIds):null;return ids.filter(id=>!allowed||allowed.has(id)).map(id=>{const i=ids.indexOf(id);let score=0;for(const j of f)score+=quant[i*dimension+j];return {sceneId:id,name:catalog.scenes[id].name,score:+(score*scale/Math.sqrt(f.length)).toFixed(5)};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId)).slice(0,limit);},
 exportWeights(){return {dimension,scale,sceneIds:ids,base64:Buffer.from(quant.buffer).toString('base64')};}
 });
}
