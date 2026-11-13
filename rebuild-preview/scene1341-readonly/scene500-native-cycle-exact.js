/* Source-exact native Scene500 cycleKeys for isolated Scene1341 navigation.
 * The function body is copied VERBATIM from learning-runtime.js and verified
 * by CI; its dependencies are injected as a read-only Scene1341 projection.
 * No study queue, PAI_CORE, native records or SRS are accessed.
 */
(function(root){
 'use strict';
 function nextIndex(rows,current,direction,wordsPerRound){
  if(!Array.isArray(rows)||!rows.length)return -1;
  const all=rows.map(r=>r?.scene_ku_id);
  if(all.some(k=>typeof k!=='string'||!k)||new Set(all).size!==all.length)
   throw Error('SC1341_NATIVE_CYCLE_BAD_KU_IDENTITY');
  const currentIndex=Math.max(0,Math.min(rows.length-1,Math.trunc(Number(current)||0)));
  const state={learningSession:{kind:'scene'},wordsPerRound};
  const browsedUnit={k:all[currentIndex]};
  const unit=()=>browsedUnit;
  const byKey=k=>all.includes(k);
  const sceneBrowseKeys=()=>all;
 const cycleKeys=()=>{
   if(state.learningSession?.kind!=='scene')return [...new Set([...(state.learningSession?.completed||[]),...(state.learningSession?.queue||[])])].filter(byKey);
   const all=sceneBrowseKeys(),size=[10,25,50].includes(Number(state.wordsPerRound))?Number(state.wordsPerRound):10;
   const visible=browsedUnit?.k||unit()?.k;
   const index=Math.max(0,all.indexOf(visible)),start=Math.floor(index/size)*size;
   return all.slice(start,start+size);
 };
  const keys=cycleKeys();
  if(!keys.length)return -1;
  // Exactly native browseAnswer's modulo wrap within native cycleKeys().
  const index=Math.max(0,keys.indexOf(browsedUnit.k));
  const next=(index+direction%keys.length+keys.length)%keys.length;
  return all.indexOf(keys[next]);
 }
 root.PAI_SCENE1341_NATIVE_CYCLE=Object.freeze({nextIndex,
  source:'rebuild-preview/learning-runtime.js::cycleKeys'});
})(typeof window!=='undefined'?window:globalThis);
