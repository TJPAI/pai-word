import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createChineseV094Index} from './zh-v094-runtime-bridge.mjs';
const source=process.env.ZH_CORE20K_V094_MIN_PATH;
test('real 20K V0.9.4 optional integration (requires published source asset)',{skip:!source},()=>{
 const raw=fs.readFileSync(source,'utf8'),payload=JSON.parse(raw);
 const idx=createChineseV094Index(payload,{aliases:{'帐号':'账号'}});
 assert.equal(idx.size,20000);
 assert.equal(idx.candidates('帐号')[0]?.term,'帐号');
 assert.equal(idx.candidates('账号')[0]?.term,'账号');
 assert.ok(idx.candidates('帐号').some(x=>x.term==='账号'));
 assert.ok(idx.extract('出国旅游订酒店过海关和问路').length>0);
 assert.equal(idx.candidates('不可能存在的测试词QXY').length,0);
});
