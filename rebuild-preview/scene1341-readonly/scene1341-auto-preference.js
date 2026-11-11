/* Isolated Scene1341 UI-only automatic browsing preference.
 * Mirrors native Scene500's saved autoBrowseEnabled flag without ever
 * reading or writing the Scene500 application/SRS storage namespace.
 * All author-draft grades, KU records and learning cursors stay ephemeral.
 */
(function(root){
 'use strict';
 const KEY='pai-word-scene1341-readonly-auto-enabled-v1';
 let fallback=false;
 function get(){
  try{
   const value=root.localStorage?.getItem(KEY);
   return value==='1';
  }catch(_){return fallback}
 }
 function set(enabled){
  fallback=enabled===true;
  try{
   if(root.localStorage){
    if(fallback)root.localStorage.setItem(KEY,'1');
    else root.localStorage.removeItem(KEY);
   }
  }catch(_){/* Private Safari mode: keep an in-memory fallback. */}
  return fallback;
 }
 root.PAI_SCENE1341_AUTO_PREFERENCE=Object.freeze({get,set});
})(typeof window!=='undefined'?window:globalThis);
