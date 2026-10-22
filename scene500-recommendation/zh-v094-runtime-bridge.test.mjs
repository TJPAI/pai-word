import test from 'node:test';
import assert from 'node:assert/strict';
import {createChineseV094Index} from './zh-v094-runtime-bridge.mjs';
const rows=Array.from({length:20000},(_,i)=>({id:'zh_'+i.toString(16).padStart(20,'0'),t:'模拟词'+i,n:'模拟词'+i,s:0}));
rows[0]={id:rows[0].id,t:'帐号',n:'账号',s:0};
rows[1]={id:rows[1].id,t:'账号',n:'账号',s:0};
rows[2]={id:rows[2].id,t:'机场值机',n:'机场值机',s:0};
rows[3]={id:rows[3].id,t:'值机',n:'值机',s:0};
rows[4]={id:rows[4].id,t:'酒店入住',n:'酒店入住',s:0};
const payload={version:'0.9.4-rc.2',terms:rows};
test('20K compact payload and exact-first stable identity',()=>{
 const x=createChineseV094Index(payload,{aliases:{'帐号':'账号'}});
 assert.equal(x.size,20000);
 const a=x.candidates('帐号');
 assert.equal(a[0].term,'帐号');assert.equal(a[0].term_id,rows[0].id);assert.equal(a[0].match_type,'exact');
 assert.equal(a[1].term,'账号');assert.equal(a[1].term_id,rows[1].id);
 assert.equal(x.find('帐号').term_id,rows[0].id);
 assert.equal(x.candidates('不存在的词').length,0);
 assert.equal(x.getById(rows[0].id).term,'帐号');
 assert.equal(x.getById(rows[0].id).frequency_rank,null);
});
test('overlap candidates preserve longer phrases and nested terms',()=>{
 const x=createChineseV094Index(payload);
 const spans=x.extract('机场值机后去酒店入住');
 assert.ok(spans.some(s=>s.term==='机场值机'));
 assert.ok(spans.some(s=>s.term==='值机'));
 assert.ok(spans.some(s=>s.term==='酒店入住'));
});
test('reject duplicate IDs and malformed aliases',()=>{
 const bad={...payload,terms:rows.slice()};bad.terms[1]={...bad.terms[1],id:rows[0].id};
 assert.throws(()=>createChineseV094Index(bad),/INVALID_IDENTITY/);
 assert.throws(()=>createChineseV094Index(payload,{aliases:{'不存在':'没有目标'}}),/INVALID_ALIAS/);
});
