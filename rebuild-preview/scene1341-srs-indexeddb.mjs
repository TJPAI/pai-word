/* Browser IndexedDB backing store for Scene1341 only.
 * Separate DB name, object store and key prefix from the legacy learning app.
 * Only the authorized Scene1341 SRS wrapper should call commit().
 */
import {SCENE1341_SRS_SCOPE,SCENE1341_DURABLE_STORE,sceneKuKey} from './scene1341-srs-v2.mjs';
export const SCENE1341_SRS_DB_NAME='pai-word-scene1341-srs-v2';
export const SCENE1341_SRS_OBJECT_STORE='records';
export function createScene1341IndexedDbStore({indexedDBApi=globalThis.indexedDB}={}){
  if(!indexedDBApi||typeof indexedDBApi.open!=='function')throw Error('SCENE1341_INDEXEDDB_UNAVAILABLE');
  let dbPromise;
  const open=()=>{
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDBApi.open(SCENE1341_SRS_DB_NAME,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(SCENE1341_SRS_OBJECT_STORE))
          db.createObjectStore(SCENE1341_SRS_OBJECT_STORE);
      };
      req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db)};
      req.onerror=()=>reject(req.error||Error('SCENE1341_INDEXEDDB_OPEN_FAILED'));
      req.onblocked=()=>reject(Error('SCENE1341_INDEXEDDB_BLOCKED'));
    }).catch(e=>{dbPromise=null;throw e});
    return dbPromise;
  };
  const assertKey=key=>{
    const id=String(key).split(':')[1];
    if(key!==sceneKuKey(id))throw Error('SCENE1341_SRS_KEY_OUT_OF_SCOPE');
  };
  const read=async key=>{
    assertKey(key);
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(SCENE1341_SRS_OBJECT_STORE,'readonly');
      const req=tx.objectStore(SCENE1341_SRS_OBJECT_STORE).get(key);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error||Error('SCENE1341_INDEXEDDB_READ_FAILED'));
      tx.onabort=()=>reject(tx.error||Error('SCENE1341_INDEXEDDB_READ_ABORTED'));
    });
  };
  const commit=async (key,value,{expectedAttemptId=null}={})=>{
    assertKey(key);
    if(value?.storageKey!==key||value.namespace!==SCENE1341_SRS_SCOPE||
       value.kuId!==key.slice(SCENE1341_SRS_SCOPE.length+1)||
       typeof value.lastAttemptId!=='string')throw Error('SCENE1341_SRS_INVALID_RECORD');
    const db=await open();
    return new Promise((resolve,reject)=>{
      let tx;
      try{tx=db.transaction(SCENE1341_SRS_OBJECT_STORE,'readwrite')}catch(e){reject(e);return}
      const store=tx.objectStore(SCENE1341_SRS_OBJECT_STORE);
      const req=store.get(key);
      req.onsuccess=()=>{
        const before=req.result||null;
        if((before?.lastAttemptId||null)!==expectedAttemptId){
          tx.abort();return;
        }
        store.put(value,key);
      };
      req.onerror=()=>tx.abort();
      tx.oncomplete=()=>resolve();
      tx.onabort=()=>reject(tx.error||Error('SCENE1341_SRS_CONCURRENT_COMMIT_REJECTED'));
      tx.onerror=()=>{}; // onabort reports the transaction failure.
    });
  };
  return Object.freeze({namespace:SCENE1341_SRS_SCOPE,storeName:SCENE1341_DURABLE_STORE,
    databaseName:SCENE1341_SRS_DB_NAME,read,commit});
}
