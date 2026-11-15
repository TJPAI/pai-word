import assert from 'node:assert/strict';
import fs from 'node:fs';
const contract=fs.readFileSync('docs/scene1341-phase1-sc0001-sc0005-acceptance.md','utf8');
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const quarantine=fs.readFileSync('rebuild-preview/scene1341-readonly/scene1341-selected-ipa-quarantine.mjs','utf8');
const source=[
 ['SC50-0001',294,103,223,33],['SC50-0002',206,70,157,25],
 ['SC50-0003',237,86,172,25],['SC50-0004',245,94,184,24],
 ['SC50-0005',259,96,104,29]
];
const totals=source.reduce((x,s)=>x.map((v,i)=>v+s[i+1]),[0,0,0,0]);
assert.deepEqual(totals,[1241,449,740,136]);
for(const [scene,total,ipa,examples,pos] of source){
 assert(contract.includes('| '+scene+' | '+total+' | '+ipa+' | '+examples+' | '+pos+' |'));
}
assert(contract.includes('CG-MASTER')&&contract.includes('CG-QA')&&contract.includes('CG-MAIN'));
assert(contract.includes('without a new frontend build'));
assert(contract.includes('NOT QUALITY CERTIFIED'));
assert(contract.includes('remaining 1,336 scenes'));
assert(quarantine.includes('SC50-0003')&&quarantine.includes('source_final_row:506'));
assert(quarantine.includes("reason:'WRONG_HEADWORD_PUT_ON_SELECTED_FOR_TAKE_OFF'"));
assert(html.includes("applyMasterSelectedIpaQuarantine(items)"));
assert(html.includes("feedModule.resolveLiveFeed()"));
assert(html.includes('sceneFeedCache.clear()'));
assert(html.includes('data-srs-write="disabled"'));
console.log(JSON.stringify({status:'PASS',phase1Scenes:5,associationBaseline:totals[0],testIpa:totals[1],bilingualExamples:totals[2],glossAndPos:totals[3],formalReady:0,canWriteSrs:false}));
