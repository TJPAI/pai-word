// Versioned user-progress backup. Lexicon packs are intentionally excluded: they are re-downloadable.
(function(){
  const E=window.PAI_EVIDENCE,LEGACY_KEY='pai-word-mobile-v1',SCHEMA='pai-word-backup-v1';

  function parseLegacy(raw){
    if(raw==null)return null;
    const value=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('旧进度格式无效');
    if(value.records!=null&&(typeof value.records!=='object'||Array.isArray(value.records)))throw new Error('旧 SRS records 格式无效');
    return value;
  }

  async function createBundle(){
    return {
      schema:SCHEMA,
      created_at:new Date().toISOString(),
      app:'PAI Word',
      lexicon_release:window.PAI_CORE_QA?.release||state.lexiconRelease||null,
      progress:await E.exportProgress(),
      legacy:{storage_key:LEGACY_KEY,value:parseLegacy(localStorage.getItem(LEGACY_KEY))}
    };
  }

  function validateBundle(bundle){
    if(!bundle||bundle.schema!==SCHEMA||bundle.app!=='PAI Word')throw new Error('不是受支持的 PAI Word 备份');
    E.validateProgressBundle(bundle.progress);
    if(!bundle.legacy||bundle.legacy.storage_key!==LEGACY_KEY)throw new Error('旧进度标识不匹配');
    if(bundle.legacy.value!=null&&(!bundle.legacy.value||typeof bundle.legacy.value!=='object'||Array.isArray(bundle.legacy.value)))throw new Error('旧进度内容无效');
    return true;
  }

  async function restoreBundle(bundle){
    validateBundle(bundle);
    // Keep an independent localStorage recovery copy before changing legacy state.
    const stamp=Date.now(),legacyBefore=localStorage.getItem(LEGACY_KEY);
    if(legacyBefore!==null)localStorage.setItem(`${LEGACY_KEY}::before-v21-restore::${stamp}`,legacyBefore);
    const restored=await E.replaceProgress(bundle.progress);
    try{
      if(bundle.legacy.value==null)localStorage.removeItem(LEGACY_KEY);
      else localStorage.setItem(LEGACY_KEY,JSON.stringify(bundle.legacy.value));
    }catch(error){
      // Progress DB restore already created its own recovery backup. Restore legacy data immediately.
      if(legacyBefore===null)localStorage.removeItem(LEGACY_KEY);else localStorage.setItem(LEGACY_KEY,legacyBefore);
      throw error;
    }
    return {...restored,legacyBackupKey:legacyBefore===null?null:`${LEGACY_KEY}::before-v21-restore::${stamp}`};
  }

  async function download(){
    const bundle=await createBundle(),blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`pai-word-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    return bundle;
  }

  async function restoreFile(file){
    if(!file||file.size>50*1024*1024)throw new Error('备份文件无效或过大');
    const text=await file.text(),bundle=JSON.parse(text);return restoreBundle(bundle);
  }

  window.PAI_V21_BACKUP={SCHEMA,createBundle,validateBundle,restoreBundle,download,restoreFile,_test:{parseLegacy}};
})();
