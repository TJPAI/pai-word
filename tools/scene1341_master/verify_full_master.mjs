#!/usr/bin/env node
/** Fail-closed all-scene source identity and Git blob/index verifier (read-only).
 * Usage: node tools/scene1341_master/verify_full_master.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve('tools/scene1341_master/production');
const index=JSON.parse(fs.readFileSync(path.join(root,'SCENE1341_LIVE_INDEX.json'),'utf8'));
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const failures=[],coverage={source_associations:0,scenes:0,english_gloss:0,meaning_zh:0,ipa_candidates:0,english_examples:0,paired_bilingual_examples:0,collocations:0,usage_note:0,source_pinned_glosses:0,reviewed_claims:0};
const identities=new Set();
if(index.schema_version!=='scene1341-master-index/v1'&&index.schema_version!=='scene1341-live-index/v1')failures.push('unexpected schema_version '+index.schema_version);
if(index.scene_count!==1341||index.source_associations!==230289||Object.keys(index.scenes||{}).length!==1341)failures.push('index totals wrong');
if(index.release_allowed!==false||index.srs_eligible!==false)failures.push('index release/SRS gates wrong');
for(let n=1;n<=1341;n++){
 const id='SC50-'+String(n).padStart(4,'0'),meta=index.scenes?.[id];
 if(!meta){failures.push('missing index '+id);continue;}
 const expected='tools/scene1341_master/production/scenes/'+id+'.json';
 if(meta.path!==expected){failures.push('unsafe scene path '+id);continue;}
 const fp=path.resolve(meta.path);
 if(!fp.startsWith(root+path.sep)||!fs.existsSync(fp)){failures.push('missing scene file '+id);continue;}
 const b=fs.readFileSync(fp);
 if(blob(b)!==meta.git_blob_sha1)failures.push('SHA_MISMATCH '+id+' '+meta.git_blob_sha1+' actual '+blob(b));
 let sc;try{sc=JSON.parse(b)}catch{failures.push('invalid JSON '+id);continue;}
 if(sc.scene_id!==id||sc.records?.length!==meta.records||sc.record_count!==meta.records)failures.push('scene count '+id);
 if(sc.release_allowed!==false||sc.srs_eligible!==false)failures.push('scene release gates '+id);
 coverage.scenes++;coverage.source_associations+=(sc.records||[]).length;
 for(const r of sc.records||[]){
  if(r.scene_id!==id||!Number.isInteger(r.source_final_row)||identities.has(r.source_final_row))failures.push('source identity '+id+':'+r.source_final_row);
  identities.add(r.source_final_row);
  if(r.release_allowed!==false||r.srs_eligible!==false)failures.push('record release gate '+id);
  const a=r.answer_page||{},q=r.question_page||{},e=r.kaikki_full_native_evidence;
  if(a.meaning_zh)coverage.meaning_zh++;
  if(a.gloss_en)coverage.english_gloss++;
  if(q.ipa_candidate)coverage.ipa_candidates++;
  if(a.example_en)coverage.english_examples++;
  if(a.example_en&&a.example_zh||Array.isArray(a.examples)&&a.examples.some(x=>x.example_en&&x.example_zh||x.en&&x.zh))coverage.paired_bilingual_examples++;
  if(a.collocations?.length)coverage.collocations++;
  if(a.usage_note)coverage.usage_note++;
  if(a.gloss_en_provenance?.source==='Kaikki English'){
    coverage.source_pinned_glosses++;
    if(e?.archive_sha256!==a.gloss_en_provenance.archive_sha256 || e?.expression_exact!==q.expression)failures.push('gloss provenance '+id+':'+r.source_final_row);
  }
  if(e?.qa_stage==='1审'||a.gloss_en_provenance?.qa_stage==='1审')coverage.reviewed_claims++;
 }
}
if(coverage.scenes!==1341||coverage.source_associations!==230289||identities.size!==230289)failures.push('source totals incomplete');
const report={status:failures.length?'FAIL':'PASS',coverage,failures:failures.slice(0,100),failure_count:failures.length,master_release:index.master_release?.version,verified_at:new Date().toISOString()};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
