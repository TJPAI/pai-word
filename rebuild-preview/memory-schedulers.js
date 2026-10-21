// PAI Word scheduler registry v1. Default behavior intentionally matches legacy Basic SRS.
// All timestamps are absolute milliseconds. Algorithms must be pure; the caller persists KU events.
(function(){
 'use strict';
 const DAY=86400000;
 const registry=new Map();
 const freezeId=id=>String(id||'').trim().toLowerCase();
 function register(adapter){
  if(!adapter||!adapter.id||typeof adapter.review!=='function'||typeof adapter.predict!=='function')throw Error('Invalid memory scheduler');
  const id=freezeId(adapter.id);if(registry.has(id))throw Error('Duplicate memory scheduler: '+id);
  registry.set(id,Object.freeze({...adapter,id}));
 }
 register({
  id:'basic',version:'session-retrieval-v3',ready:true,
  review({previous=null,grade,now,repeat=false,sessionKind='scene'}){
   if(!['again','hard','good'].includes(grade)||!Number.isFinite(now))throw Error('Invalid basic review input');
   const prior=previous?.lastStableInterval||previous?.interval||0;
   const record={...(previous||{}),last:now,lastKnown:grade==='good',lastGrade:grade,
    reps:(previous?.reps||0)+1,learningPending:repeat,srsPolicy:'session-retrieval-v3'};
   if(repeat){record.due=now;record.interval=0}
   else{
    const days=sessionKind==='free'&&prior>0?prior/DAY:prior<DAY?1:prior<3*DAY?3:
     Math.max(3,Math.round(prior/DAY*(previous?.lastGrade==='hard'?1.5:2.3)));
    record.interval=days*DAY;record.lastStableInterval=record.interval;
    record.due=sessionKind==='free'&&previous?.due>now?previous.due:now+record.interval;
   }
   if(repeat&&previous?.interval>0)record.lastStableInterval=grade==='again'?0:previous.interval;
   return record;
  },
  predict({record,now}){return {dueAt:record?.due??null,overdue:typeof record?.due==='number'&&record.due<=now}}
 });
 const api=Object.freeze({
  version:'1',register,
  available:()=>[...registry.values()].map(a=>({id:a.id,version:a.version,ready:a.ready===true})),
  resolve:id=>registry.get(freezeId(id))||registry.get('basic'),
  review:(id,input)=>api.resolve(id).review(input),
  predict:(id,input)=>api.resolve(id).predict(input)
 });
 window.PAI_MEMORY_SCHEDULERS=api;
})();
