import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const cwd=new URL("../../",import.meta.url);
const load=p=>readFileSync(new URL(p,cwd),"utf8");
function parseCSV(data){
 const rows=[];let cells=[],cell="",quote=false;
 for(let i=0;i<data.length;i++){
  const c=data[i];
  if(quote){if(c==='"'&&data[i+1]==='"'){cell+='"';i++}else if(c==='"')quote=false;else cell+=c;}
  else if(c==='"')quote=true;
  else if(c===','){cells.push(cell);cell="";}
  else if(c==='\n'){cells.push(cell.replace(/\r$/,""));if(cells.some(Boolean))rows.push(cells);cells=[];cell="";}
  else cell+=c;
 }
 if(cells.length||cell){cells.push(cell);rows.push(cells);}
 const keys=rows.shift().map(x=>x.replace(/^\uFEFF/,""));
 return rows.map(r=>Object.fromEntries(keys.map((key,i)=>[key,r[i]??""])));
}
const source=parseCSV(load("tools/integration/scene1341-ranked/v51-ranked.csv"));
const ledger=parseCSV(load("tools/answer-enrichment/scene1341-v51-answer-only-2038-coverage.v2.csv"));
const pack=JSON.parse(load("tools/answer-enrichment/scene1341-v51-sc0001-answer-only-001-020.v2.json"));
assert.equal(source.length,2038);
assert.equal(ledger.length,2038);
assert.equal(pack.records.length,20);
assert.equal(pack.identity.core20k_ku_reused,false);
assert.equal(pack.release.activation_allowed,false);
const seen=new Set(),rankByScene=new Map(),bySense=new Map(),byKu=new Map(pack.records.map(k=>[k.scene_ku_id,k]));
assert.equal(byKu.size,20,"duplicate Scene KU IDs");
let authored=0,pending=0;
for(let i=0;i<source.length;i++){
 const s=source[i],l=ledger[i];
 assert.ok(!seen.has(s.sense_id),"duplicate source sense");
 seen.add(s.sense_id);bySense.set(s.sense_id,s);
 const next=(rankByScene.get(s.scene_id)??0)+1;
 assert.equal(Number(s.rank),next,"non-contiguous rank");
 rankByScene.set(s.scene_id,next);
 assert.equal(l.scene_id,s.scene_id);assert.equal(l.sense_id,s.sense_id);
 assert.equal(l.rank,s.rank);assert.equal(l.source_tier,s.tier);
 assert.equal(l.source_version,"V51");assert.equal(l.playable,"false");
 assert.equal(l.scene_ku_id,"SC1341-KU-"+s.sense_id.slice("SC-SENSE-".length));
 if(byKu.has(l.scene_ku_id)){authored++;assert.equal(l.production_state,"ANSWER_ONLY_DRAFT_QA_PENDING");}
 else {pending++;assert.equal(l.production_state,"NOT_GENERATED");}
}
assert.equal(rankByScene.size,10);
assert.equal(authored,20);assert.equal(pending,2018);
for(const k of pack.records){
 const s=bySense.get(k.source_sense_id);assert.ok(s);
 assert.equal(k.scene_id,s.scene_id);assert.equal(k.source_rank,Number(s.rank));
 assert.equal(k.expression,s.expression);assert.equal(k.sense_zh,s.sense_zh);
 assert.equal(k.source_tier,s.tier);assert.equal(k.source_version,"V51");
 assert.equal(k.activation_allowed,false);
 assert.ok(!Object.hasOwn(k,"question"),"question payload forbidden");
 assert.ok(!Object.hasOwn(k,"correct_choice_id"),"scoring forbidden");
 assert.ok(k.answer.example_en?.trim());
 assert.ok(k.answer.example_zh?.trim());
 assert.ok(k.answer.collocations?.length>0);
 assert.ok(k.answer.usage_note?.trim());
 assert.equal(k.display.w,k.expression);assert.equal(k.display.m,k.sense_zh);
 assert.ok(k.display.e?.trim());assert.ok(k.display.x?.trim());
}
console.log(JSON.stringify({result:"STRUCTURE_PASS",source:source.length,scenes:rankByScene.size,authored,pending,qa_approved:0,publishable:0}));
