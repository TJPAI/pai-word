const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

function loadEvidence(){
  const ctx={console,window:null,Date,Map,Set,Uint32Array,crypto:{getRandomValues(a){a[0]=1;a[1]=2;return a}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('learning-evidence.js'),ctx);return ctx.PAI_EVIDENCE;
}

test('exposure, recall, objective evidence and later failure remain distinct',()=>{
  const E=loadEvidence(),reduce=E._test.applyEvidence;
  const meaning={target_id:'ku1::meaning',ku_id:'ku1',type:'meaning',content_version:'v1'};
  const usage={target_id:'ku1::usage::core',ku_id:'ku1',type:'usage',content_version:'v1'};
  let m=reduce(null,{event_type:'exposure',result:'exposed',occurred_at:'2026-10-01T00:00:00Z',content_version:'v1'},meaning);
  assert.equal(m.status,'exposed');assert.equal(m.independent_successes,0);
  m=reduce(m,{event_type:'recall',result:'recalled',evidence_type:'self_recall',occurred_at:'2026-10-01T00:05:00Z',content_version:'v1',hint_used:false,item_id:'m1'},meaning);
  assert.equal(m.status,'independent_recall');assert.equal(m.independent_successes,1);

  let u=reduce(null,{event_type:'objective_answer',result:'incorrect',evidence_type:'objective',occurred_at:'2026-10-01T00:06:00Z',content_version:'v1',hint_used:false,item_id:'u1'},usage);
  assert.equal(u.status,'learning');assert.equal(u.objective_successes,0);
  assert.equal(m.status,'independent_recall','usage failure must not reset meaning evidence');

  u=reduce(u,{event_type:'objective_answer',result:'correct',evidence_type:'delayed_objective',occurred_at:'2026-10-02T00:06:00Z',content_version:'v1',hint_used:false,item_id:'u2'},usage);
  assert.equal(u.status,'delayed_verified');assert.equal(u.delayed_successes,1);
  u=reduce(u,{event_type:'objective_answer',result:'incorrect',evidence_type:'objective',occurred_at:'2026-10-03T00:06:00Z',content_version:'v1',hint_used:false,item_id:'u3'},usage);
  assert.equal(u.status,'learning','a later failure must remain visible');assert.equal(u.delayed_successes,1,'historical delayed evidence remains auditable');
});

function pilotContext(targetStates=new Map()){
  let seq=0,lastSession=null;const commits=[],sessions=new Map(),appNode={innerHTML:''};
  const E={
    makeId(prefix='id'){return `${prefix}_${++seq}`},
    async getTarget(id){return targetStates.get(id)||null},
    async saveSession(s){lastSession=structuredClone(s);sessions.set(s.session_id,structuredClone(s));return s},
    async putMeta(){},async getMeta(){return null},async getSession(id){return sessions.get(id)||null},async openDB(){},
    makeEvent(x){return {...x}},
    async commit(x){commits.push(structuredClone(x));lastSession=structuredClone(x.session);sessions.set(x.session.session_id,structuredClone(x.session));await new Promise(r=>setImmediate(r));return {duplicate:false,event:x.event,target:{}}},
    async listEventsBySession(id){return commits.filter(x=>x.event.session_id===id).map(x=>x.event)}
  };
  const ctx={console,window:null,document:{hidden:false,addEventListener(){},getElementById(){return appNode}},performance:{now(){return 1000}},structuredClone,Date,Map,Set,Promise,setImmediate,state:{voiceAccent:'us'},speechSynthesis:{cancel(){},speak(){}},SpeechSynthesisUtterance:function(t){this.text=t},PAI_EVIDENCE:E};
  ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('v21-content.js'),ctx);vm.runInContext(read('v21-app-v2.js'),ctx);
  return {ctx,E,commits,getSession:()=>lastSession};
}

test('first session protects transfer items and double tap records one exposure',async()=>{
  const h=pilotContext();await h.ctx.PAI_V21_APP.startSession();
  const s=h.getSession(),ids=s.tasks.map(t=>t.item_id).filter(Boolean);
  assert.ok(ids.includes('apply01_meaning_ctx_a'));assert.ok(ids.includes('apply01_usage_a'));
  assert.ok(!ids.includes('apply01_meaning_ctx_b'),'held-out context must not be shown before practice');
  assert.ok(!ids.includes('apply01_usage_b'),'held-out usage item must not be shown before practice');

  await Promise.all([h.ctx.PAI_V21_APP.completeLearn(),h.ctx.PAI_V21_APP.completeLearn()]);
  assert.equal(h.commits.length,1,'rapid duplicate action must not create two events');
  assert.equal(h.commits[0].event.event_type,'exposure');
  assert.equal(h.commits[0].event.result,'exposed');
});

test('a later session can use an unseen context after the practice item was seen',async()=>{
  const states=new Map([
    ['w_0619_apply_ku01::meaning',{status:'independent_recall',seen_item_ids:['apply01_meaning_ctx_a']}],
    ['w_0619_apply_ku01::usage::apply_for',{status:'independent_recall',seen_item_ids:['apply01_usage_a']}],
    ['w_0144_interest_ku03::meaning',{status:'independent_recall',seen_item_ids:['interest03_meaning_ctx_a']}],
    ['w_1981_plot_ku_s01::meaning',{status:'independent_recall',seen_item_ids:['plot01_meaning_ctx_a']}]
  ]);
  const h=pilotContext(states);await h.ctx.PAI_V21_APP.startSession();const ids=h.getSession().tasks.map(t=>t.item_id).filter(Boolean);
  assert.ok(ids.includes('apply01_meaning_ctx_b'));assert.ok(ids.includes('apply01_usage_b'));
  assert.ok(ids.includes('interest03_meaning_ctx_b'));assert.ok(ids.includes('plot01_meaning_ctx_b'));
});

test('failed meaning recall schedules reteaching and a spaced retry, and defers usage for that KU',async()=>{
  const h=pilotContext();await h.ctx.PAI_V21_APP.startSession();
  await h.ctx.PAI_V21_APP.completeLearn();
  await h.ctx.PAI_V21_APP.completeLearn();
  await h.ctx.PAI_V21_APP.revealRecall();
  await h.ctx.PAI_V21_APP.rateRecall(false);
  const s=h.getSession(),current=s.index;
  assert.equal(h.commits.at(-1).event.result,'not_recalled');
  assert.equal(s.tasks[current].kind,'learn');assert.equal(s.tasks[current].ku_id,'w_0619_apply_ku01');
  const retryIndex=s.tasks.findIndex((t,i)=>i>current&&t.retry_for&&t.ku_id==='w_0619_apply_ku01'&&t.kind==='recall');
  assert.ok(retryIndex>current+1,'retry must not be an immediate answer echo');
  assert.equal(s.tasks.some((t,i)=>i>=current&&t.ku_id==='w_0619_apply_ku01'&&t.target_type==='usage'),false,'usage testing is deferred after meaning failure');
});

test('pilot scored items have explicit editorial review status and separate practice/transfer prompts',()=>{
  const h=pilotContext(),units=h.ctx.PAI_V21_CONTENT.units,items=units.flatMap(u=>u.items);
  assert.equal(new Set(items.map(i=>i.item_id)).size,items.length);
  for(const u of units)assert.equal(u.quality_status,'editorial_reviewed_v2.1');
  const scored=items.filter(i=>i.type==='choice');assert.ok(scored.length>=2);
  const p=scored.find(i=>i.role==='practice'),t=scored.find(i=>i.role==='transfer');assert.ok(p&&t);assert.notEqual(p.prompt,t.prompt);
});
