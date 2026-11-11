/* Scene500 preference contract for isolated Scene1341 read-only author preview.
 * Source of defaults/options: rebuild-preview/learning-runtime.js native Settings.
 * UI preferences persist in a dedicated Scene1341 namespace ONLY;
 * never imports Scene500 KU/SRS or App state.
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
 const KEY='pai-word-scene1341-readonly-preferences-v1';
 const normalize=source=>{
  const out=clone();if(!source||typeof source!=='object'||Array.isArray(source))return out;
  for(const key of Object.keys(choices)){
   const value=source[key];
   if(choices[key].includes(value))out[key]=value;
  }
  for(const key of booleanKeys)if(typeof source[key]==='boolean')out[key]=source[key];
  if(source.autoPronounce&&typeof source.autoPronounce==='object'){
   for(const key of ['question','swipe'])
    if(typeof source.autoPronounce[key]==='boolean')out.autoPronounce[key]=source.autoPronounce[key];
  }
  return out;
 };
 const read=()=>{
  try{const raw=root.localStorage?.getItem(KEY);return raw?normalize(JSON.parse(raw)):clone()}
  catch(_){return clone()}
 };
 const save=values=>{
  try{root.localStorage?.setItem(KEY,JSON.stringify(values))}catch(_){/* Safari private-mode fallback */}
 };
 function createReadOnlySettings({onChange=()=>{}}={}){
  let values=read();
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
   save(values);onChange(key,snapshot());return true;
  }
  function reset(){values=clone();onChange('reset',snapshot());return snapshot()}
  return Object.freeze({snapshot,get:key=>key.startsWith('autoPronounce.')?values.autoPronounce[key.slice(14)]:values[key],set,reset});
 }
 root.PAI_SCENE500_READONLY_SETTINGS=Object.freeze({defaults,choices,createReadOnlySettings});
})(typeof window!=='undefined'?window:globalThis);
