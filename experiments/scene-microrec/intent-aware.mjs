// Browser-compatible Scene1500 candidate: intent-aware reranking (experimental).
import {createMicroRec} from './microrec.mjs';
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const patterns=[
 {negative:/不(?:坐|乘|搭)(?:地铁|subway|metro)|地铁(?:停运|不开|取消)/i,blocked:/地铁|metro|subway/i},
 {negative:/不(?:坐|乘|搭)(?:公交|公共汽车|bus)/i,blocked:/公交|公共汽车|\bbus\b/i},
 {negative:/不是机器学习|不是学机器学习|not machine learning/i,blocked:/机器学习|machine learning/i},
 {negative:/不是深度学习|not deep learning/i,blocked:/深度学习|deep learning/i}
];
const substitutions=[
 [/公交车|公共汽车|乘公交|坐公交|\bbus\b/gi,' 公交 '],
 [/地铁|\bmetro\b|\bsubway\b/gi,' 地铁 '],
 [/预订|订房|订酒店|\bbooking\b|\bbook\b|reservation/gi,' 预订 '],
 [/入住|\bcheck[ -]?in\b/gi,' 入住 '],
 [/咖啡|\bcoffee\b/gi,' 咖啡 '],
 [/点餐|\border\b/gi,' 点餐 '],
 [/修理|故障|\bcrash(?:ing)?\b|\bissue\b|\bproblem\b/gi,' 故障 '],
 [/人工智能|\bAI\b/gi,' 人工智能 ']
];
export function createIntentAware(catalog){
 const micro=createMicroRec(catalog);
 return Object.freeze({
 search(query,{limit=5,eligibleSceneIds=null}={}){
  if(!normalize(query))return [];
  const expanded=substitutions.reduce((s,[re,rep])=>s.replace(re,rep),normalize(query));
  const candidates=micro.search(expanded,{method:'hybrid',limit:Math.min(100,micro.size),eligibleSceneIds});
  const blocked=patterns.filter(p=>p.negative.test(query));
  return candidates.map(r=>{
   const scene=catalog.scenes[r.sceneId];
   const label=[scene.name,...(scene.aliases||[]),scene.description_enriched||''].join(' ');
   const exclude=blocked.some(p=>p.blocked.test(label));
   return {...r,score:exclude?0:+r.score.toFixed(5)};
  }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId)).slice(0,limit);
 }
 });
}
