const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

function context(){
  const legacy=new Map();let replaced=null;
  const E={
    async exportProgress(){return {schema:'pai-word-progress-v2',exported_at:'2026-10-12T00:00:00Z',events:[],targets:[],sessions:[]}},
    validateProgressBundle(b){if(b?.schema!=='pai-word-progress-v2'||!Array.isArray(b.events)||!Array.isArray(b.targets)||!Array.isArray(b.sessions))throw new Error('invalid progress bundle');return true},
    async replaceProgress(b){replaced=b;return {restored:true,backupKey:'restore_backup::1',counts:{events:b.events.length,targets:b.targets.length,sessions:b.sessions.length}}}
  };
  const localStorage={getItem(k){return legacy.has(k)?legacy.get(k):null},setItem(k,v){legacy.set(k,String(v))},removeItem(k){legacy.delete(k)}};
  const ctx={console,window:null,Date,JSON,Blob:function(){},URL:{createObjectURL(){return 'blob:x'},revokeObjectURL(){}},document:{createElement(){return {click(){},remove(){}}},body:{appendChild(){}}},setTimeout(){},localStorage,state:{lexiconRelease:'Core-13000 V25.5'},PAI_CORE_QA:{release:'Core-13000 V25.5'},PAI_EVIDENCE:E};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('v21-backup.js'),ctx);return {ctx,legacy,getReplaced:()=>replaced};
}

test('backup excludes lexicon packs and includes progress plus legacy SRS',async()=>{
  const h=context();h.legacy.set('pai-word-mobile-v1',JSON.stringify({records:{ku1:{reps:2}}}));
  const b=await h.ctx.PAI_V21_BACKUP.createBundle();
  assert.equal(b.schema,'pai-word-backup-v1');assert.equal(b.lexicon_release,'Core-13000 V25.5');
  assert.deepEqual(b.legacy.value.records.ku1,{reps:2});
  assert.equal('packs' in b,false);assert.equal('lexicon' in b,false);
});

test('restore rejects wrong schema before any replacement',async()=>{
  const h=context();await assert.rejects(()=>h.ctx.PAI_V21_BACKUP.restoreBundle({schema:'wrong'}));assert.equal(h.getReplaced(),null);
});

test('restore preserves old localStorage recovery copy before replacing legacy state',async()=>{
  const h=context(),old={records:{old:{reps:3}}},fresh={records:{new:{reps:1}}};h.legacy.set('pai-word-mobile-v1',JSON.stringify(old));
  const bundle={schema:'pai-word-backup-v1',app:'PAI Word',created_at:'x',progress:{schema:'pai-word-progress-v2',events:[],targets:[],sessions:[]},legacy:{storage_key:'pai-word-mobile-v1',value:fresh}};
  const r=await h.ctx.PAI_V21_BACKUP.restoreBundle(bundle);
  assert.equal(JSON.parse(h.legacy.get('pai-word-mobile-v1')).records.new.reps,1);
  assert.ok(r.legacyBackupKey);assert.deepEqual(JSON.parse(h.legacy.get(r.legacyBackupKey)),old);
  assert.equal(h.getReplaced().schema,'pai-word-progress-v2');
});
