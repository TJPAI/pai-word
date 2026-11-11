/* Scene1341 isolated, non-SRS display bookmark. Only UI navigation state.
 * No grading, progress totals, memory scheduler, or KU state is persisted here.
 */
(function(root){
 'use strict';
 const KEY='pai-word-scene1341-readonly-display-bookmark-v1';
 const validScene=key=>typeof key==='string'&&/^SC50-\d{4}$/.test(key);
 const normalize=record=>{
  const out={lastScene:'SC50-0001',cursors:{}};
  if(!record||typeof record!=='object')return out;
  if(validScene(record.lastScene))out.lastScene=record.lastScene;
  if(record.cursors&&typeof record.cursors==='object'){
   for(const [id,entry] of Object.entries(record.cursors).slice(0,1341)){
    if(!validScene(id)||!entry||typeof entry!=='object')continue;
    if(!Number.isSafeInteger(entry.index)||entry.index<0||entry.index>20000)continue;
    if(!['question','answer'].includes(entry.face))continue;
    out.cursors[id]={index:entry.index,face:entry.face};
   }
  }
  return out;
 };
 let memory=normalize(null);
 function load(){
  try{const raw=root.localStorage?.getItem(KEY);if(raw)memory=normalize(JSON.parse(raw))}
  catch(_){}
  return normalize(memory);
 }
 function save(scene,index,face){
  if(!validScene(scene)||!Number.isSafeInteger(index)||index<0||index>20000||!['question','answer'].includes(face))return false;
  const next=load();next.lastScene=scene;next.cursors[scene]={index,face};memory=next;
  try{root.localStorage?.setItem(KEY,JSON.stringify(next))}catch(_){}
  return true;
 }
 root.PAI_SCENE1341_DISPLAY_BOOKMARK=Object.freeze({load,save});
})(typeof window!=='undefined'?window:globalThis);
