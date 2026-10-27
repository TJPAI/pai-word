// Shared query encoder with per-scene prototype index. Browser ESM, no Node imports.
// Feature hashing is NOT pretrained semantic knowledge.
import {terms} from './microrec.mjs';
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
function enc(s,dim){const v=new Float32Array(dim);for(const t of new Set(terms(s))){const h=hash(t);v[h%dim]+=(h&256)?1:-1;}let z=Math.hypot(...v)||1;for(let i=0;i<dim;i++)v[i]/=z;return v;}
export function createPrototypeRetriever(catalog,{dimension=128}={}){
 const entries=Object.entries(catalog.scenes).sort(([a],[b])=>a.localeCompare(b)),N=entries.length;
 const matrix=new Int8Array(N*dimension),scale=new Float32Array(N);
 entries.forEach(([,s],i)=>{const v=enc([s.name,...(s.aliases||[]),...(s.actions||[]),...(s.objects||[]),s.description_enriched||''].join(' '),dimension);let max=0;for(const x of v)max=Math.max(max,Math.abs(x));scale[i]=max/127||1;for(let j=0;j<dimension;j++)matrix[i*dimension+j]=Math.round(v[j]/scale[i]);});
 return Object.freeze({sceneCount:N,dimension,prototypeBytes:matrix.byteLength+scale.byteLength,
 search(query,{limit=5,eligibleSceneIds=null}={}){if(!String(query??'').trim())return [];const v=enc(query,dimension),allowed=eligibleSceneIds?new Set(eligibleSceneIds):null,rows=[];for(let i=0;i<N;i++){const [id,s]=entries[i];if(allowed&&!allowed.has(id))continue;let score=0;for(let j=0;j<dimension;j++)score+=v[j]*matrix[i*dimension+j]*scale[i];if(score>0)rows.push({sceneId:id,name:s.name,score:+score.toFixed(6)});}return rows.sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId)).slice(0,limit);}
 });
}
