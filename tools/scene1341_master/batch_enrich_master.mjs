#!/usr/bin/env node
/**
 * CG-MASTER repeatable Kaikki native evidence enrichment.
 * Usage: node tools/scene1341_master/batch_enrich_master.mjs --start 126 --end 1341 --batch-size 3000
 * Run from a FULL Git checkout; never overwrite independent QA or frozen source identities.
 * Each run writes changed scene files, then a single live index generated from final file bytes.
 * Changes are test-only, not certified or SRS eligible.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve('tools/scene1341_master/production');
const indexPath = path.join(root, 'SCENE1341_LIVE_INDEX.json');
const args = process.argv.slice(2);
const opt = (key, fallback) => { const i = args.indexOf(key); return i >= 0 ? Number(args[i+1]) : fallback; };
const start = opt('--start', 126), end = opt('--end', 1341), batchSize=opt('--batch-size', 3000);
const dryRun = args.includes('--dry-run');
if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end>1341||start>end||!Number.isInteger(batchSize)||batchSize<1) throw Error('invalid ranges');
const shaBlob=(buf)=>crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
const index=JSON.parse(fs.readFileSync(indexPath,'utf8'));
if(index.scene_count!==1341||index.source_associations!==230289)throw Error('immutable master totals mismatch');
const outcomes={scenes_scanned:0,records_scanned:0,records_enriched:0,english_examples_enriched:0,pos_enriched:0,ipa_enriched:0,ipa_conflicts:0,already_present:0,ambiguous_hold:0,no_native_match:0,gloss_candidate_diagnostics:{no_evidence:0,identity_mismatch:0,no_candidates:0,multiple_entries:0,multiple_senses:0,multiple_glosses:0,gloss_filtered:0,source_identity_missing:0,eligible:0},diagnostics:{evidence_missing:0,expression_mismatch:0,row_mismatch:0,candidates_missing:0,source_word_mismatch:0,source_line_missing:0,pos_missing_or_unsupported:0,pos_conflict:0,pos_already_present:0},batches:[],source_associations:0,hash_mismatches_before:[],hash_mismatches_after:[]};
let batch={start_scene:null,end_scene:null,records:0,glosses:0};
const glossScenePriority=[];
const flush=()=>{if(batch.records){outcomes.batches.push(batch);batch={start_scene:null,end_scene:null,records:0,glosses:0};}};
const changes=new Map();
const seenSourceRows=new Set();
function eligible(record){
  const evidence=record.kaikki_full_native_evidence;
  if(!evidence||evidence.expression_exact!==record.question_page?.expression||evidence.source_final_row!==record.source_final_row) return null;
  const entries=evidence.candidates;
  if(!Array.isArray(entries)||entries.length!==1||entries[0]?.source_word!==evidence.expression_exact)return null;
  const e=entries[0];
  if(!Array.isArray(e.senses)||e.senses.length!==1)return null;
  const sense=e.senses[0], glosses=sense.glosses;
  if(!Array.isArray(glosses)||glosses.length!==1||typeof glosses[0]!=='string')return null;
  const g=glosses[0].trim();
  if(g.length<16||g.length>850||/[<>\[\]{}]/.test(g)||/^((inflection|form|plural|past tense|alternative spelling|misspelling|translation) of)\b/i.test(g))return null;
  if(!Number.isInteger(e.source_line)||!Number.isInteger(sense.source_sense_index))return null;
  return {gloss:g,line:e.source_line,sense:sense.source_sense_index,archive:evidence.archive_sha256};
}
for(let i=1;i<=1341;i++){
 const id='SC50-'+String(i).padStart(4,'0'), ent=index.scenes[id];
 if(!ent?.path)throw Error('missing scene index '+id);
 const p=path.resolve(ent.path);
 if(!p.startsWith(root+path.sep))throw Error('unsafe scene path '+id);
 const before=fs.readFileSync(p), actual=shaBlob(before);
 if(actual!==ent.git_blob_sha1)outcomes.hash_mismatches_before.push(id);
 const scene=JSON.parse(before);
 if(scene.scene_id!==id||!Array.isArray(scene.records)||scene.records.length!==ent.records||scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('contract mismatch '+id);
 outcomes.source_associations+=scene.records.length;
 for(const record of scene.records){
  if(record.scene_id!==id || !Number.isInteger(record.source_final_row) || seenSourceRows.has(record.source_final_row))throw Error('invalid or duplicate frozen source identity '+id);
  seenSourceRows.add(record.source_final_row);
 }
 const inside=i>=start&&i<=end;
 if(inside){
  outcomes.scenes_scanned++;
  const beforeGloss={...outcomes.gloss_candidate_diagnostics};
  if(batch.start_scene===null)batch.start_scene=id;
  batch.end_scene=id;
  for(const record of scene.records){
   outcomes.records_scanned++;batch.records++;
   if(record.release_allowed!==false||record.srs_eligible!==false||record.scene_id!==id||!Number.isInteger(record.source_final_row))throw Error('record identity or release violation '+id);
   if(record.answer_page?.gloss_en){outcomes.already_present++;}
   // POS is an entry-level property: all exact-word native candidates must
   // agree before it can be imported, even when gloss senses remain ambiguous.
   if(!record.answer_page?.pos){
    const ev=record.kaikki_full_native_evidence;
    const entries=ev?.candidates;
    const posMap={noun:'n.',verb:'v.',adjective:'adj.',adverb:'adv.',pronoun:'pron.',preposition:'prep.',conjunction:'conj.',interjection:'interj.',determiner:'det.',numeral:'num.'};
    const diag=outcomes.diagnostics;
    if(!ev)diag.evidence_missing++;
    else if(ev.expression_exact!==record.question_page?.expression)diag.expression_mismatch++;
    else if(ev.source_final_row!==record.source_final_row)diag.row_mismatch++;
    else if(!Array.isArray(entries)||entries.length===0)diag.candidates_missing++;
    else if(entries.some(e=>e.source_word!==ev.expression_exact))diag.source_word_mismatch++;
    else if(entries.some(e=>!Number.isInteger(e.source_line)))diag.source_line_missing++;
    else if(entries.some(e=>!Object.hasOwn(posMap,String(e.pos||'').trim().toLowerCase())))diag.pos_missing_or_unsupported++;
    else if(new Set(entries.map(e=>posMap[e.pos.trim().toLowerCase()])).size>1)diag.pos_conflict++;
    if(ev?.expression_exact===record.question_page?.expression&&ev?.source_final_row===record.source_final_row&&Array.isArray(entries)&&entries.length>0&&entries.every(e=>e.source_word===ev.expression_exact&&Number.isInteger(e.source_line)&&Object.hasOwn(posMap,String(e.pos||'').trim().toLowerCase()))){
     const values=[...new Set(entries.map(e=>posMap[e.pos.trim().toLowerCase()]))];
     if(values.length===1){
      record.answer_page.pos=values[0];
      record.answer_page.pos_provenance={source:'Kaikki English',archive_sha256:ev.archive_sha256,source_lines:entries.map(e=>e.source_line),selection_rule:'EXACT_WORD_ALL_NATIVE_ENTRIES_POS_CONSENSUS',qa_stage:'待审'};
      outcomes.pos_enriched++;
     }
    }
   }
   else outcomes.diagnostics.pos_already_present++;
   // IPA is an expression-level field. Import only when every native entry is
   // exact-word and source-line pinned, and all nonempty string candidates agree.
   // Object-shaped or unknown IPA evidence is intentionally held for review.
   if(!record.question_page?.ipa_candidate){
    const ev=record.kaikki_full_native_evidence, entries=ev?.candidates;
    if(ev?.expression_exact===record.question_page?.expression&&ev?.source_final_row===record.source_final_row&&typeof ev.archive_sha256==='string'&&ev.archive_sha256.length>0&&Array.isArray(entries)&&entries.length>0&&entries.every(e=>e.source_word===ev.expression_exact&&Number.isInteger(e.source_line)&&Array.isArray(e.ipa_candidates))){
     const all=entries.flatMap(e=>e.ipa_candidates);
     const valid=all.length>0&&all.every(x=>typeof x==='string'&&x.trim().length>0&&x.trim().length<120);
     const distinct=valid?[...new Set(all.map(x=>x.trim()))]:[];
     if(distinct.length===1){
      record.question_page.ipa_candidate=distinct[0];
      record.question_page.ipa_provenance={source:'Kaikki English',archive_sha256:ev.archive_sha256,source_lines:entries.map(e=>e.source_line),selection_rule:'EXACT_WORD_ALL_NATIVE_IPA_CANDIDATES_CONSENSUS',qa_stage:'待审'};
      outcomes.ipa_enriched++;
     }else if(all.length>0)outcomes.ipa_conflicts++;
    }
   }
   if(!record.answer_page?.gloss_en){
    const d=outcomes.gloss_candidate_diagnostics,ev=record.kaikki_full_native_evidence,es=ev?.candidates;
    if(!ev)d.no_evidence++;
    else if(ev.expression_exact!==record.question_page?.expression||ev.source_final_row!==record.source_final_row)d.identity_mismatch++;
    else if(!Array.isArray(es)||!es.length)d.no_candidates++;
    else if(es.length!==1||es[0]?.source_word!==ev.expression_exact)d.multiple_entries++;
    else if(!Array.isArray(es[0].senses)||es[0].senses.length!==1)d.multiple_senses++;
    else if(!Array.isArray(es[0].senses[0].glosses)||es[0].senses[0].glosses.length!==1)d.multiple_glosses++;
    else if(!Number.isInteger(es[0].source_line)||!Number.isInteger(es[0].senses[0].source_sense_index))d.source_identity_missing++;
    else if(!eligible(record))d.gloss_filtered++;
    else d.eligible++;
   }
   const candidate=eligible(record);
   if(!candidate){if(record.kaikki_full_native_evidence)outcomes.ambiguous_hold++;else outcomes.no_native_match++;continue;}
   if(!record.answer_page.gloss_en){
    record.answer_page.gloss_en=candidate.gloss;
    record.answer_page.gloss_en_provenance={source:'Kaikki English',archive_sha256:candidate.archive,source_line:candidate.line,source_sense_index:candidate.sense,selection_rule:'EXACT_SINGLE_ENTRY_SINGLE_SENSE',qa_stage:'待审'};
    outcomes.records_enriched++;batch.glosses++;
   }
   const sense=record.kaikki_full_native_evidence.candidates[0].senses[0];
   const examples=Array.isArray(sense.examples)?sense.examples:[];
   const clean=examples.map(e=>typeof e==='string'?e:(e&&typeof e.text==='string'?e.text:null)).filter(x=>typeof x==='string').map(x=>x.trim()).filter(x=>x.length>=12&&x.length<=400&&!/[<>\\[\\]{}]/.test(x));
   if(!record.answer_page.example_en&&clean.length===1){
    record.answer_page.example_en=clean[0];
    record.answer_page.example_en_provenance={source:'Kaikki English',archive_sha256:candidate.archive,source_line:candidate.line,source_sense_index:candidate.sense,selection_rule:'EXACT_SINGLE_ENTRY_SINGLE_SENSE_SINGLE_EXAMPLE',qa_stage:'待审'};
    outcomes.english_examples_enriched++;
   }
  }
  if(outcomes.gloss_candidate_diagnostics){
   const deltas=Object.fromEntries(Object.entries(outcomes.gloss_candidate_diagnostics).map(([k,v])=>[k,v-(beforeGloss[k]||0)]));
   glossScenePriority.push({scene_id:id,records:scene.records.length,...deltas});
  }
  if(batch.records>=batchSize)flush();
  const oldExisting=JSON.parse(before);
  if(JSON.stringify(scene)!==JSON.stringify(oldExisting)){
   const rendered=before.toString('utf8').startsWith('{\n') ? JSON.stringify(scene,null,2)+'\n' : JSON.stringify(scene);
   changes.set(p,Buffer.from(rendered));
  }
 }
 const finalBytes=changes.get(p)||before;
 ent.git_blob_sha1=shaBlob(finalBytes);
 if(ent.git_blob_sha1!==shaBlob(finalBytes))outcomes.hash_mismatches_after.push(id);
}
flush();
outcomes.gloss_priority_scenes=glossScenePriority.sort((a,b)=>(b.no_evidence+b.multiple_senses+b.multiple_entries)-(a.no_evidence+a.multiple_senses+a.multiple_entries)).slice(0,30);
if(outcomes.source_associations!==230289)throw Error('source association total corrupted');
if(outcomes.hash_mismatches_after.length)throw Error('post-write hash mismatch');
if(!dryRun){
 if(changes.size===0){
  console.log(JSON.stringify({...outcomes,changed_scenes:0,dry_run:false,status:'NOOP_NO_ELIGIBLE_SOURCE_GLOSSES',release_unchanged:index.master_release?.version},null,2));
  process.exit(0);
 }
 for(const [p,b] of changes)fs.writeFileSync(p,b);
 index.master_release={metadata_schema:'scene1341-master-release/v1',version:'V278',content_baseline:'FULL1341_BULK_KAIKKI_EXACT_GLOSS',published_date:new Date().toISOString().slice(0,10),stage:'TEST_ONLY_QA_PENDING',headline:'自动批量填充Kaikki唯一义项英文释义（未经独立审核）',changes:[{category:'answer_page_gloss_en_source_pinned',count:outcomes.records_enriched},{category:'scene_documents_updated',count:changes.size}],changed_scene_ids:[...changes.keys()].map(x=>path.basename(x,'.json')),qa_stage:'待审',release_allowed:false,srs_eligible:false};
 fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
 const cpPath=path.resolve('tools/scene1341_master/CGMASTER_CURRENT_STATE.json');
 const checkpoint=JSON.parse(fs.readFileSync(cpPath,'utf8'));
 checkpoint.version='V278_BULK_KAIKKI_AUTO_TEST_ONLY';
 checkpoint.updated_at=new Date().toISOString().slice(0,10);
 checkpoint.handoff_id='SC1341-V278-BULK-KAIKKI-SOURCE-GLOSS';
 checkpoint.v278={start_scene:start,end_scene:end,batch_size:batchSize,scenes_scanned:outcomes.scenes_scanned,records_scanned:outcomes.records_scanned,new_english_glosses:outcomes.records_enriched,scenes_updated:changes.size,preexisting_index_sha_mismatches:outcomes.hash_mismatches_before,post_write_index_sha_mismatches:outcomes.hash_mismatches_after,qa_stage:'待审',first_review_confirmed:0,release_allowed:false,srs_eligible:false,status:'TEST_ONLY_PENDING_INDEPENDENT_QA'};
 checkpoint.next_tasks=['Verify full 1341 index↔blob contract and update CG-MAIN handoff.','Independent CG-QA source/content review, no automatic 1审.','Expand IPA/POS, example, collocation and usage coverage after English-gloss batch.'];
 fs.writeFileSync(cpPath,JSON.stringify(checkpoint,null,2)+'\n');
}
console.log(JSON.stringify({...outcomes,changed_scenes:changes.size,dry_run:dryRun},null,2));
