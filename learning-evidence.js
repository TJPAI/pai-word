// PAI Word V2.1 learning evidence store.
// Progress is kept in a dedicated IndexedDB, separate from re-downloadable lexicon cache.
(function(){
  const DB_NAME='pai-word-progress-v2',DB_VERSION=1;
  const EVENTS='events',TARGETS='targets',SESSIONS='sessions',META='meta';
  let dbPromise=null;

  function openDB(){
    if(!('indexedDB' in window))return Promise.reject(new Error('IndexedDB unavailable'));
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(EVENTS))db.createObjectStore(EVENTS,{keyPath:'event_id'});
        if(!db.objectStoreNames.contains(TARGETS))db.createObjectStore(TARGETS,{keyPath:'target_id'});
        if(!db.objectStoreNames.contains(SESSIONS))db.createObjectStore(SESSIONS,{keyPath:'session_id'});
        if(!db.objectStoreNames.contains(META))db.createObjectStore(META);
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('progress db open failed'));
    });
    return dbPromise;
  }

  function reqValue(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>reject(req.error)});}
  function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('transaction aborted'))});}
  function nowIso(){return new Date().toISOString()}
  function makeId(prefix='evt'){return `${prefix}_${Date.now().toString(36)}_${crypto.getRandomValues(new Uint32Array(2)).join('_')}`}

  function baseTarget(target){
    return {
      target_id:target.target_id,
      ku_id:target.ku_id,
      type:target.type,
      status:'unmeasured',
      content_version:target.content_version||'Core-13000 V25.5',
      exposures:0,
      independent_successes:0,
      delayed_successes:0,
      objective_successes:0,
      failures:0,
      last_event_at:null,
      updated_at:nowIso()
    };
  }

  function applyEvidence(prev,event,target){
    const next={...(prev||baseTarget(target))};
    next.target_id=target.target_id;next.ku_id=target.ku_id;next.type=target.type;
    next.content_version=event.content_version||next.content_version;
    next.last_event_at=event.occurred_at;next.updated_at=nowIso();
    if(event.event_type==='exposure'){
      next.exposures=(next.exposures||0)+1;
      if(next.status==='unmeasured')next.status='exposed';
      return next;
    }
    const success=['recalled','correct'].includes(event.result)&&!event.hint_used;
    const failure=['not_recalled','incorrect'].includes(event.result);
    if(success){
      next.independent_successes=(next.independent_successes||0)+1;
      if(event.event_type==='objective_answer')next.objective_successes=(next.objective_successes||0)+1;
      if(String(event.evidence_type||'').startsWith('delayed_')){
        next.delayed_successes=(next.delayed_successes||0)+1;
        next.status='delayed_verified';
      }else if(next.status!=='delayed_verified')next.status='independent_recall';
    }else if(failure||event.result==='hinted_correct'){
      next.failures=(next.failures||0)+1;
      if(next.status!=='delayed_verified')next.status='learning';
    }
    return next;
  }

  async function getTarget(targetId){const db=await openDB();return reqValue(db.transaction(TARGETS,'readonly').objectStore(TARGETS).get(targetId));}
  async function getSession(sessionId){const db=await openDB();return reqValue(db.transaction(SESSIONS,'readonly').objectStore(SESSIONS).get(sessionId));}
  async function listEventsBySession(sessionId){
    const db=await openDB(),all=await reqValue(db.transaction(EVENTS,'readonly').objectStore(EVENTS).getAll());
    return (all||[]).filter(e=>e.session_id===sessionId).sort((a,b)=>String(a.occurred_at).localeCompare(String(b.occurred_at)));
  }

  // Atomic event append + target update + optional session checkpoint.
  // Duplicate event_id returns duplicate=true and performs no second update.
  async function commit({event,target,session}){
    if(!event?.event_id||!event?.ku_id||!event?.target_id||!event?.event_type||!event?.occurred_at)throw new Error('invalid learning event');
    if(!target?.target_id||target.target_id!==event.target_id||target.ku_id!==event.ku_id)throw new Error('target/event mismatch');
    const db=await openDB(),tx=db.transaction([EVENTS,TARGETS,SESSIONS],'readwrite');
    const eventStore=tx.objectStore(EVENTS),targetStore=tx.objectStore(TARGETS),sessionStore=tx.objectStore(SESSIONS);
    const existing=await reqValue(eventStore.get(event.event_id));
    if(existing){tx.abort();return {duplicate:true,event:existing,target:await getTarget(event.target_id)};}
    const previous=await reqValue(targetStore.get(event.target_id));
    const nextTarget=applyEvidence(previous,event,target);
    eventStore.add(event);targetStore.put(nextTarget);
    if(session)sessionStore.put({...session,updated_at:nowIso()});
    await txDone(tx);
    return {duplicate:false,event,target:nextTarget};
  }

  async function saveSession(session){
    if(!session?.session_id)throw new Error('session_id required');
    const db=await openDB(),tx=db.transaction(SESSIONS,'readwrite');
    tx.objectStore(SESSIONS).put({...session,updated_at:nowIso()});await txDone(tx);return session;
  }

  async function putMeta(key,value){const db=await openDB(),tx=db.transaction(META,'readwrite');tx.objectStore(META).put(value,key);await txDone(tx)}
  async function getMeta(key){const db=await openDB();return reqValue(db.transaction(META,'readonly').objectStore(META).get(key))}

  async function exportProgress(){
    const db=await openDB();
    const read=store=>reqValue(db.transaction(store,'readonly').objectStore(store).getAll());
    return {schema:'pai-word-progress-v2',exported_at:nowIso(),events:await read(EVENTS),targets:await read(TARGETS),sessions:await read(SESSIONS)};
  }

  window.PAI_EVIDENCE={
    DB_NAME,makeId,openDB,getTarget,getSession,listEventsBySession,commit,saveSession,putMeta,getMeta,exportProgress,
    makeEvent(fields){return {event_id:fields.event_id||makeId(),item_id:null,item_version:null,hint_used:false,active_duration:0,content_version:'Core-13000 V25.5',...fields,occurred_at:fields.occurred_at||nowIso()}}
  };
})();
