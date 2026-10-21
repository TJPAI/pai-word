import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
const code=source.slice(source.indexOf(' const ensureAttempt=()=>'),source.indexOf('\n const due=',source.indexOf(' const ensureAttempt=()=>')))+'\nglobalThis.prepare=ensureAttempt;';
const u={k:'ku-new',w:{w:'Example',s:{'ku-new':{},'ku-other':{}}}};
let checks=0;
for(const quota of [25,50,100,200])for(const mode of ['new','known-other-ku','introduced','full','save-failure']){
 const s={newPerDay:quota,records:mode==='known-other-ku'?{'ku-other':{due:0}}:{},dailyNewProgress:{date:'today',newWordsCompleted:Array.from({length:mode==='full'?quota:quota-1},(_,i)=>'past-'+i)},learningSession:{queue:[u.k],currentAttempt:null},introducedHeadwords:mode==='introduced'?{example:{kuId:u.k}}:{}};
 const before=JSON.stringify(s);let writes=0;
 const c={state:s,byKey:()=>u,date:()=> 'today',newAttemptId:()=> 'attempt-one',structuredClone,Date,persist:()=>{writes++;if(mode==='save-failure')throw Error('disk full')}};
 vm.runInNewContext(code,c);
 if(mode==='full'||mode==='save-failure'){assert.throws(()=>c.prepare());assert.equal(JSON.stringify(c.state),before)}
 else{const a=c.prepare();assert.equal(a.attemptId,'attempt-one');assert.equal(c.state.dailyNewProgress.newWordsCompleted.length,mode==='new'?quota:quota-1);assert.equal(c.prepare().attemptId,a.attemptId);assert.equal(writes,1)}
 checks++;
}
console.log('PASS',checks,'real ensureAttempt cases: all quotas, KU/headword dedup, durable rollback');
