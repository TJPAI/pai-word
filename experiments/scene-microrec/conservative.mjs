// Independent negative-control and abstention candidate, not tuned on evaluation labels.
import {createIntentAware} from './intent-aware.mjs';
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().trim();
const education=/英语(?:口语|听力|发音|单词|语法|学习)|(?:english|pronunciation|accent|speaking english|english listening)/i;
const cs=/机器学习|深度学习|人工智能|machine learning|deep learning|neural network|\bAI\b/i;
export function createConservativeMicro(catalog,{minimumScore=0.18}={}){
 const inner=createIntentAware(catalog);
 return Object.freeze({search(query,{limit=5,eligibleSceneIds=null}={}){
  const q=norm(query);if(!q)return [];
  // A domain guard applies only to unambiguous language-learning intents; combined
  // intents must preserve genuine ML scenes rather than blanket banning their names.
  const learningOnly=education.test(q)&&!cs.test(q);
  const rows=inner.search(q,{limit:Math.max(20,limit),eligibleSceneIds});
  const filtered=rows.filter(x=>!(learningOnly&&/机器学习|深度学习/.test(catalog.scenes[x.sceneId].name)));
  // Score is not calibrated; no general abstention claim until independent calibration.
  return filtered.filter(x=>x.score>=minimumScore).slice(0,limit);
 }});
}
