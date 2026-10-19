// Preview-only, non-destructive readiness probe. Does not change runtime state
// or switch the learning writer until Command Store migration is approved.
import {openPreviewDB,readSnapshot,initializeSnapshot} from './transaction-store.mjs';
const STORAGE='pai-word-core20k-rebuild-preview-v21';
export async function inspectAndSeedPreview({storage=localStorage,dbName='pai-word-core20k-preview-v21'}={}){
 const raw=storage.getItem(STORAGE);
 if(raw===null)return {status:'no-legacy-state'};
 let legacy;
 try{legacy=JSON.parse(raw)}catch{return {status:'invalid-legacy-json'}}
 if(!legacy||typeof legacy!=='object'||Array.isArray(legacy)||!legacy.records||typeof legacy.records!=='object'||Array.isArray(legacy.records))
  return {status:'invalid-legacy-shape'};
 const db=await openPreviewDB(dbName);
 try{
  const current=await readSnapshot(db);
  if(current.state!==null)return {status:'existing-indexeddb',version:current.version};
  const outcome=await initializeSnapshot(db,structuredClone(legacy));
  return {status:outcome.status==='initialized'?'seeded-readonly':'existing-indexeddb',version:outcome.version};
 }finally{db.close()}
}
