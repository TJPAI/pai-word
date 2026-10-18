// Explicit test-only queue injection. NEVER invoke on production origin.
export function injectIsolatedDailyQueue({core,state,scenes,pack,dateKey}) {
 if(pack?.activation_allowed!==false||pack?.runtime_accepted!==false||!Array.isArray(pack?.records))throw Error('NOT_TEST_PACK');
 if(!core?.byKU||!state||!scenes)throw Error('MISSING_RUNTIME');
 const keys=pack.records.map(r=>r.ku_id);
 if(new Set(keys).size!==keys.length||keys.some(k=>!core.byKU.has(k)||!core.byKU.get(k).core20kIncremental))throw Error('UNMOUNTED_KU');
 if(typeof dateKey!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateKey))throw Error('INVALID_DAY');
 if(!('unclassified' in scenes))throw Error('SCENE_NOT_MOUNTED');
 const quota=state.newPerDay,reinforcementQuota=Math.max(3,Math.round(quota*.30));
 const fresh=keys.filter(k=>!state.records?.[k]),assigned=Object.fromEntries(Object.keys(scenes).map(k=>[k,[]]));assigned.unclassified=fresh;
 state.selectedScene='unclassified';state.daily={date:dateKey,scene:'unclassified',assigned,quota,wordQuota:quota,reinforcementQuota,newWordKeys:fresh,reinforcementKeys:[],lexiconLimit:13000,policy:'selected-scene-words-v3'};
 return {keys:fresh.slice(),scene:'unclassified',testOnly:true};
}
