// Exact, read-only projection of the existing daily policy and learning-app due().
const validated=new WeakMap();
export function validateHomeKuMetadata(m){
 if(validated.has(m))return m;
 if(m?.schema!=='pai-word-v21-home-ku-metadata-v1'||m.headwords!==20000||m.sceneCount!==500||m.top100Candidates!==50000||m.top100Entries!==22227||!Array.isArray(m.entries)||!Array.isArray(m.words)||!Array.isArray(m.sceneOccurrences)||!(/^[a-f0-9]{64}$/).test(m.sourceHash))throw Error('HOME_KU_METADATA_INCOMPLETE');
 const ids=new Set(m.entries),playable=new Set();
 if(ids.size!==m.entries.length||m.entries.some(k=>typeof k!=='string'||!k))throw Error('HOME_KU_METADATA_ENTRY');
 const ranks=new Set();
 for(const [rank,keys] of m.words){if(!Number.isInteger(rank)||rank<1||rank>20000||ranks.has(rank)||!keys.length)throw Error('HOME_KU_WORD');ranks.add(rank);for(const k of keys){if(!ids.has(k)||playable.has(k))throw Error('HOME_KU_PLAYABLE');playable.add(k)}}
 if(playable.size!==m.playableKU)throw Error('HOME_KU_PLAYABLE_COUNT');
 const seen=new Set();let total=0;
 for(const [k,n] of m.sceneOccurrences){if(!playable.has(k)||seen.has(k)||!Number.isInteger(n)||n<1||n>500)throw Error('HOME_KU_OCCURRENCE');seen.add(k);total+=n}
 if(total!==22227)throw Error('HOME_KU_OCCURRENCE_COUNT');
 validated.set(m,ids);return m;
}
export function countDueFromHomeMetadata(records,m,{now=Date.now()}={}){
 validateHomeKuMetadata(m);const ids=validated.get(m);
 return Object.entries(records||{}).filter(([k,r])=>ids.has(k)&&r&&(r.learningPending||r.lastKnown===false||r.due<=now)).length;
}
export function inspectHomeBudget(state,{now=new Date(),kuMetadata:m}={}){
 validateHomeKuMetadata(m);const ids=validated.get(m),records=state.records||{};
 const dailyLimit=[25,50,100,200].includes(Number(state.newPerDay))?Number(state.newPerDay):50;
 const roundLimit=[10,25,50].includes(Number(state.wordsPerRound))?Number(state.wordsPerRound):10;
 const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const p=state.dailyNewProgress?.date===date?state.dailyNewProgress:{};
 const dailyCompleted=(p.newWordsCompleted||p.completed||[]).length;
 const quota=Math.max(3,Math.round(dailyLimit*.30)),scene=state.selectedScene||'daily',d=state.daily;
 let reinforcementRemaining;
 if(d?.date===date&&d.wordQuota===dailyLimit&&d.reinforcementQuota===quota&&d.lexiconLimit===20000&&d.policy==='selected-scene-words-v3'&&d.scene===scene&&d.assigned){
  reinforcementRemaining=(d.reinforcementKeys||[]).filter(k=>ids.has(k)&&!records[k]).length;
 }else{
  // Adapter assigns every sense to daily; Top100 adds membership without changing it.
  const candidates=scene==='daily'?m.words.filter(([,keys])=>keys.some(k=>records[k])&&keys.slice(1).some(k=>!records[k])).length:0;
  reinforcementRemaining=Math.min(candidates,Math.max(0,quota-(p.reinforcementCompleted||[]).length));
 }
 return {dailyLimit,dailyCompleted,dailyRemaining:Math.max(0,dailyLimit-dailyCompleted),roundLimit,reinforcementRemaining,due:countDueFromHomeMetadata(records,m,{now:now.getTime()}),studied:Object.keys(records).filter(k=>ids.has(k)).length,complete:true,missing:[],date};
}
