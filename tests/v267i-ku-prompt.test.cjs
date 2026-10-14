const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(ROOT,'ku-content-ui.js'),'utf8');
function unit(id,type,title,scene='daily',pos='n.') {return {k:id,w:{w:'test',pos},s:{ku_id:id,kuType:type,kuTitle:title,scene,pos,m:'答案'},kuContent:{content_zh:'教学规则'}}}
function renderCase({view,active,units=[active],records={},freeKeys=[],idx=0,revealed=false}){
  const added=[],hint={};
  const hero={querySelector(s){return s==='.tap-hint'?hint:s==='.ku-front-prompt'?added[0]||null:null},insertBefore(x){added.push(x)},appendChild(x){added.push(x)}};
  const document={head:{appendChild(){}},createElement(){return {className:'',innerHTML:'',textContent:''}},querySelector(s){return s==='.word-hero'?hero:null}};
  const byKU=new Map(units.filter(Boolean).map(u=>[u.k,u]));
  const ctx={console,Date,document,SCENES:{daily:'日常生活',work:'职场商务'},state:{view,records,freeKeys,reviewBrowseIndex:idx,revealed},PAI_CORE:{byKU},currentUnit:()=>active,answerHtml:()=>'<base/>',render:()=>{}};ctx.window=ctx;
  vm.runInNewContext(source,ctx);ctx.render();return {cue:added[0]?.innerHTML||'',answer:ctx.answerHtml(active)};
}
test('study cue identifies the exact non-Sense KU without revealing its answer',()=>{const u=unit('g','grammar','定冠词核心');const r=renderCase({view:'study',active:u});assert.match(r.cue,/语法/);assert.match(r.cue,/定冠词核心/);assert.doesNotMatch(r.cue,/教学规则/);assert.match(r.answer,/教学规则/)});
test('Sense cue gives POS and scene but not Chinese gloss',()=>{const u=unit('s','sense','释义','work','v.');const r=renderCase({view:'study',active:u});assert.match(r.cue,/v\. · 职场商务/);assert.match(r.cue,/释义/);assert.doesNotMatch(r.cue,/答案/);assert.equal(r.answer,'<base/>')});
test('review and free-review cues resolve the same KU that will be scored',()=>{const early=unit('early','contrast','区别 A/B'),late=unit('late','usage','特殊用法');let r=renderCase({view:'review',active:null,units:[early,late],records:{early:{due:1},late:{due:2}}});assert.match(r.cue,/辨析/);assert.match(r.cue,/区别 A\/B/);r=renderCase({view:'freeReview',active:null,units:[early,late],freeKeys:['late']});assert.match(r.cue,/用法/);assert.match(r.cue,/特殊用法/)});
test('revealed cards do not repeat the front cue',()=>{const u=unit('g','grammar','定冠词核心');assert.equal(renderCase({view:'study',active:u,revealed:true}).cue,'')});
test('cache busts point to KU cue v2 bootstrap',()=>{const bootstrap=fs.readFileSync(path.join(ROOT,'core-bootstrap.js'),'utf8'),index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');assert.match(bootstrap,/ku-content-ui\.js\?v=v267i-kucontent-2/);assert.match(index,/core-bootstrap\.js\?v=v267i-2/)});
