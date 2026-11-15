#!/usr/bin/env node
// V212: cross-artifact identity, evidence, and non-release integrity checks.
import fs from "node:fs";
import path from "node:path";
const root=path.resolve("tools/scene1341_master/qa_reports");
const load=(name)=>JSON.parse(fs.readFileSync(path.join(root,name),"utf8"));
const a=load("CGMASTER_V208_TWO_CANDIDATE_EDITORIAL_SENSE_PROPOSALS_20261115.json");
const b=load("CGMASTER_V209_38_EDITORIAL_SENSE_PAGE_SKELETONS_UNREVIEWED_20261115.json");
const c=load("CGMASTER_V211_13_NATIVE_EXAMPLE_BILINGUAL_EDITORIAL_DRAFT_20261115.json");
const check=(v,msg)=>{if(!v)throw new Error(msg)};
check(a.records.length===43,"V208 count");check(b.records.length===38,"V209 count");check(c.records.length===13,"V211 count");
const proposals=new Map(a.records.filter(r=>r.editorial_candidate_index!==null).map(r=>[r.record_id,r]));
check(proposals.size===38,"V208 proposals unique");
const skeletons=new Map(b.records.map(r=>[r.record_id,r]));
check(skeletons.size===38,"V209 IDs unique");
for(const [id,r] of skeletons){
 const p=proposals.get(id);check(!!p,"V209 has no V208 proposal: "+id);
 check(r.source_final_row===p.source_final_row && r.expression===p.expression && r.scene_id===p.scene_id,"V209 identity drift "+id);
 check(r.proposed_native_sense.raw_source_line===p.editorial_candidate_native_line && r.proposed_native_sense.sense_index_in_native_entry===p.editorial_candidate_sense_index,"native evidence drift "+id);
 check(r.qa_stage_label==="待审" && r.formal_ready===0 && r.release_allowed===false,"V209 premature release "+id);
 check(r.question_page.complete===false && r.answer_page.complete===false,"V209 incomplete page incorrectly complete "+id);
}
let translated=0,held=0;
for(const r of c.records){
 const p=proposals.get(r.record_id);check(!!p,"V211 no source proposal");
 check(r.source_final_row===p.source_final_row && r.native_source_line===p.editorial_candidate_native_line && r.native_sense_index===p.editorial_candidate_sense_index,"V211 evidence drift");
 check(r.qa_stage_label==="待审" && r.release_allowed===false,"V211 premature release");
 for(const e of r.examples){
  check(e.example_en && e.example_zh_editorial_draft && e.qa_stage_label==="待审","V211 translation missing");
  translated++;if(e.scene_fit.startsWith("HOLD"))held++;
 }
}
check(translated===14 && held===2,"V211 example/HOLD counts");
const holdRows=a.records.filter(r=>r.editorial_candidate_index===null).map(r=>r.source_final_row).sort((x,y)=>x-y);
check(JSON.stringify(holdRows)===JSON.stringify([137,343,436,651,1037]),"V208 HOLD identity");
console.log(JSON.stringify({status:"PASS",v208:43,v209:38,v211:13,translated_examples:translated,scene_fit_held_examples:held,unreviewed:true,release_allowed:false}));
