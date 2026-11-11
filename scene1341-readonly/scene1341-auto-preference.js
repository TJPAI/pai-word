/* Scene1341-only browsing UI preferences.
 * Mirrors native Scene500's saved autoBrowseEnabled/autoBrowseInterval without
 * sharing Scene500 app or SRS keys. Author-draft grades remain ephemeral.
 */
(function(root){
 'use strict';
 const KEY='pai-word-scene1341-readonly-auto-enabled-v1';
 const SPEED_KEY='pai-word-scene1341-readonly-auto-speed-v1';
 const speeds=[0.9,1.5,3,6];
 let fallback=false,volatile=false,speedFallback=1.5;
 function read(key){
  if(volatile)return null;
  try{return root.localStorage?.getItem(key)??null}
  catch(_){volatile=true;return null}
 }
 function write(key,value){
  if(volatile)return;
  try{
   if(value===null)root.localStorage?.removeItem(key);
   else root.localStorage?.setItem(key,value);
  }catch(_){volatile=true}
 }
 function get(){
  const stored=read(KEY);
  return volatile?fallback:stored==='1';
 }
 function set(enabled){
  fallback=enabled===true;
  write(KEY,fallback?'1':null);
  return fallback;
 }
 function getSpeed(){
  const stored=read(SPEED_KEY);
  if(volatile)return speedFallback;
  const speed=Number(stored);
  return stored!==null&&speeds.includes(speed)?speed:1.5;
 }
 function setSpeed(value){
  const speed=Number(value);
  if(!speeds.includes(speed))return false;
  speedFallback=speed;
  write(SPEED_KEY,String(speed));
  return true;
 }
 root.PAI_SCENE1341_AUTO_PREFERENCE=Object.freeze({get,set,getSpeed,setSpeed});
})(typeof window!=='undefined'?window:globalThis);
