/* Scene500 preference contract for isolated Scene1341 read-only author preview.
 * Source of defaults/options: rebuild-preview/learning-runtime.js native Settings.
 * Kept in memory ONLY; never imports Scene500 SRS, persistence, or App state.
 */
(function(root){
 'use strict';
 const defaults=Object.freeze({
  wordsPerRound:10,autoBrowseInterval:1.5,speechSpeed:100,voiceAccent:'us',
  hideWord:false,showCollocations:true,showExamples:true,showCompare:true,
  autoPronounce:Object.freeze({question:true,swipe:true})
 });
 const choices=Object.freeze({
  wordsPerRound:Object.freeze([10,25,50]),
  autoBrowseInterval:Object.freeze([0.9,1.5,3,6]),
  speechSpeed:Object.freeze([80,100,120,150]),
  voiceAccent:Object.freeze(['us','gb'])
 });
 const booleanKeys=Object.freeze(['hideWord','showCollocations','showExamples','showCompare']);
 const clone=()=>({...defaults,autoPronounce:{...defaults.autoPronounce}});
 function createReadOnlySettings({onChange=()=>{}}={}){
  let values=clone();
  const snapshot=()=>Object.freeze({...values,autoPronounce:Object.freeze({...values.autoPronounce})});
  function set(key,value){
   if(key==='autoPronounce.question'||key==='autoPronounce.swipe'){
    const field=key.split('.')[1];
    if(typeof value!=='boolean')return false;
    values={...values,autoPronounce:{...values.autoPronounce,[field]:value}};
   }else if(booleanKeys.includes(key)){
    if(typeof value!=='boolean')return false;
    values={...values,[key]:value};
   }else if(Object.prototype.hasOwnProperty.call(choices,key)){
    const option=key==='voiceAccent'?String(value):Number(value);
    if(!choices[key].includes(option))return false;
    values={...values,[key]:option};
   }else return false;
   onChange(key,snapshot());return true;
  }
  function reset(){values=clone();onChange('reset',snapshot());return snapshot()}
  return Object.freeze({snapshot,get:key=>key.startsWith('autoPronounce.')?values.autoPronounce[key.slice(14)]:values[key],set,reset});
 }
 root.PAI_SCENE500_READONLY_SETTINGS=Object.freeze({defaults,choices,createReadOnlySettings});
})(typeof window!=='undefined'?window:globalThis);
