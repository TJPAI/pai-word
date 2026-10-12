const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

function evidenceReducer(){
  const ctx={console,window:null,Date,Map,Set,Uint32Array,crypto:{getRandomValues(a){a[0]=1;a[1]=2;return a}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('learning-evidence.js'),ctx);return ctx.PAI_EVIDENCE._test.applyEvidence;
}

test('legacy SRS snapshot is historical self-report, not independent mastery',()=>{
  const reduce=evidenceReducer(),target={target_id:'ku1::meaning',ku_id:'ku1',type:'meaning',content_version:'v1'};
  const state=reduce(null,{event_type:'legacy_srs_snapshot',result:'self_report_known',evidence_type:'legacy_self_report',occurred_at:'2026-09-01T00:00:00Z',content_version:'v1'},target);
  assert.equal(state.status,'legacy_self_report');
  assert.equal(state.legacy_self_report,'self_report_known');
  assert.equal(state.independent_successes,0);
  assert.equal(state.objective_successes,0);
  assert.equal(state.delayed_successes,0);
});

function plannerContext(targetStates){
  let seq=0,lastSession=null;const app={innerHTML:''};
  const E={makeId(p='id'){return `${p}_${++seq}`},async getTarget(id){return targetStates.get(id)||null},async saveSession(s){lastSession=structuredClone(s);return s},async putMeta(){},async getMeta(){return null},async getSession(){return null},async openDB(){},makeEvent(x){return x},async commit(x){lastSession=structuredClone(x.session);return {duplicate:false}},async listEventsBySession(){return []}};
  const ctx={console,window:null,document:{hidden:false,addEventListener(){},getElementById(){return app}},performance:{now(){return 1000}},structuredClone,Date,Map,Set,Promise,state:{voiceAccent:'us'},speechSynthesis:{cancel(){},speak(){}},SpeechSynthesisUtterance:function(){},PAI_EVIDENCE:E};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('v21-content.js'),ctx);vm.runInContext(read('v21-app-v2.js'),ctx);return {ctx,getSession:()=>lastSession};
}

test('seeing a practice item without successful evidence does not unlock transfer item',async()=>{
  const states=new Map([
    ['w_0619_apply_ku01::meaning',{status:'learning',seen_item_ids:['apply01_meaning_ctx_a']}],
    ['w_0619_apply_ku01::usage::apply_for',{status:'learning',seen_item_ids:['apply01_usage_a']}],
    ['w_0144_interest_ku03::meaning',{status:'learning',seen_item_ids:['interest03_meaning_ctx_a']}],
    ['w_1981_plot_ku_s01::meaning',{status:'learning',seen_item_ids:['plot01_meaning_ctx_a']}]
  ]);
  const h=plannerContext(states);await h.ctx.PAI_V21_APP.startSession();const ids=h.getSession().tasks.map(t=>t.item_id).filter(Boolean);
  assert.ok(ids.includes('apply01_meaning_ctx_a'));assert.ok(!ids.includes('apply01_meaning_ctx_b'));
  assert.ok(ids.includes('apply01_usage_a'));assert.ok(!ids.includes('apply01_usage_b'));
});

test('legacy importer is deterministic and marks completion without touching original records',async()=>{
  const commits=[],meta=new Map(),state={records:{kuA:{last:1234,lastKnown:true,due:9999,interval:5000,reps:2}}};
  const E={async getMeta(k){return meta.get(k)||null},async putMeta(k,v){meta.set(k,v)},makeEvent(x){return x},async commit(x){commits.push(x);return {duplicate:false}}};
  const ctx={console,window:null,Date,Object,state,PAI_EVIDENCE:E,PAI_CORE:{byKU:new Map([['kuA',{}]])}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('v21-legacy-import.js'),ctx);
  const before=JSON.stringify(state.records);const first=await ctx.PAI_V21_LEGACY_IMPORT.run();const second=await ctx.PAI_V21_LEGACY_IMPORT.run();
  assert.equal(first.imported,1);assert.equal(commits.length,1);assert.equal(second.complete,true);
  assert.equal(commits[0].event.result,'self_report_known');assert.equal(commits[0].event.evidence_type,'legacy_self_report');
  assert.equal(JSON.stringify(state.records),before,'import must not rewrite legacy records');
});
