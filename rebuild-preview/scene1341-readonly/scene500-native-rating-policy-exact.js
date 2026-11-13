/* Exact Scene500 rating defaults/config and repeat plan, for isolated preview.
 * CI checks copied source text byte-for-byte against learning-runtime.js.
 * No import of native state, durable KU, registry or SRS.
 */
(function(root){
 'use strict';
 const state={tapTiming:{}};
 const defaults={goodWithin:2,hardWithin:5,goodShow:2,hardShow:4,againShow:6,repeatCount:3,repeatGap:1};
 const labels={goodWithin:'想起了：点击阈值（秒）',hardWithin:'模糊：点击阈值（秒）',goodShow:'想起了：答案展示（秒）',hardShow:'模糊：答案展示（秒）',againShow:'没想起：答案展示（秒）',repeatCount:'重读次数',repeatGap:'每遍读完后的间隔（秒）'};
 const config=()=>{const c={...defaults,...state.tapTiming};for(const k in defaults){const n=Number(c[k]);c[k]=Number.isFinite(n)?Math.max(k==='repeatCount'?1:k==='repeatGap'?0:0.1,Math.min(k==='repeatCount'?10:60,n)):defaults[k]}c.repeatCount=Math.max(1,Math.round(c.repeatCount));c.hardWithin=Math.max(c.goodWithin,c.hardWithin);return c};
 function ratingPlan(grade){
  if(!['again','hard','good'].includes(grade))return null;
  const score=grade;
  const count={again:3,hard:2,good:1}[score];
  const c=config();
  return Object.freeze({grade,showMs:Math.round(c[grade+'Show']*1000),
   repeatCount:count,repeatGapMs:Math.round(c.repeatGap*1000)});
 }
 root.PAI_SCENE500_NATIVE_RATING_POLICY=Object.freeze({
  ratingPlan,source:'rebuild-preview/learning-runtime.js::tap-flow.js'
 });
})(typeof window!=='undefined'?window:globalThis);
