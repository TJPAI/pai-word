import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(html.startsWith('<!doctype html>'));
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'demo must contain runnable script');
new vm.Script(script,{filename:'scene1341-readonly-inline.js'});
assert(script.includes("const SHA='2cecf85fdb1b6b73fcd4b96c11bcb872a30c92db'"),
 'static published demo must pin the exact authored source commit');
assert(!/localStorage\b|sessionStorage\b|indexedDB\b|navigator\.serviceWorker\b|\.commit\s*\(/.test(script),
 'read-only demo must not persist data or write SRS');
assert(html.includes('<button disabled>不知道</button>'));
assert(html.includes('<button disabled>模糊</button>'));
assert(html.includes('<button disabled>知道</button>'));
assert(!/\bquiz\b|cloze|multiple.choice/.test(html));
assert(script.includes("qa.counts?.release_approved!==0"));
const root='tools/integration/scene1341-teaching/';
const packs=['enteach-v51-first20-answer-only-v2.json',
'scene1341-v51-sc0001-answer-only-021-050.v2.json',
'scene1341-v51-sc0001-answer-only-051-100.v2.json',
'scene1341-v51-sc0001-answer-only-101-130.v2.json',
'scene1341-v51-sc0001-answer-only-131-180.v2.json',
'scene1341-v51-sc0001-answer-only-181-234.v2.json',
'scene1341-v51-sc0002-answer-only-001-020.v2.json',
'scene1341-v51-sc0002-answer-only-021-070.v2.json'];
for(const file of packs)assert(script.includes(file),file+' not loaded by preview');
const rows=packs.flatMap(f=>JSON.parse(fs.readFileSync(root+f,'utf8')).records);
assert.equal(rows.length,304);
assert(rows.every(x=>x.activation_allowed===false&&!Object.hasOwn(x,'question')));
const qa=JSON.parse(fs.readFileSync(root+'qa-304-status-staging.v1.json','utf8'));
assert.equal(qa.release_eligible,false);assert.equal(qa.counts.release_approved,0);
assert.equal(qa.flags.length,27);
assert.equal(rows.filter(x=>x.scene_id==='SC50-0001').length,234);
assert.equal(rows.filter(x=>x.scene_id==='SC50-0002').length,70);
console.log(JSON.stringify({status:'PASS',realKu:304,authorPacks:8,qaFlags:27,releaseApproved:0,readonly:true,inlineScriptSyntax:true}));
