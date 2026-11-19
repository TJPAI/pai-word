#!/usr/bin/env node
/**
 * Apply only exact-source, unanimous native IPA/POS candidates to missing fields.
 * Local staging only; never pushes or promotes QA. Run in a disposable checkout.
 * Usage: node tools/scene1341_master/apply_source_safe_ipa_pos.mjs --start 1 --end 1341 --max-rows 3000 [--write]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const argv=process.argv.slice(2);
const number=(flag,def)=>{const i=argv.indexOf(flag);return i<0?def:Number(argv[i+1]);};
const start=number('--start',1),end=number('--end',1341),max=number('--max-rows',3000),write=argv.includes('--write');
if(write&&!argv.includes('--atomic-release-context'))throw Error('write requires --atomic-release-context; use controlled atomic publisher, not standalone mutation');
if(write&&!/^V[0-9]+$/.test(process.env.CGMASTER_NEXT_RELEASE||''))throw Error('atomic write requires CGMASTER_NEXT_RELEASE=V<number>');
if(![start,end,max].every(Number.isInteger)||start<1||end>1341||start>end||max<1)throw Error('invalid range');
const base='tools/scene1341_master/production';
const indexPath=path.join(base,'SCENE1341_LIVE_INDEX.json');
const idx=JSON.parse(fs.readFileSync(indexPath,'utf8'));
if(idx.scene_count!==1341||idx.source_associations!==230289||idx.release_allowed!==false||idx.srs_eligible!==false)throw Error('index gate mismatch');
const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const originalIndex=fs.readFileSync(indexPath);
const originalIndexSha=sha(originalIndex);
const trim=v=>typeof v==='string'?v.trim():'';
const unanimous=xs=>xs.length&&xs.every(Boolean)&&new Set(xs).size===1?xs[0]:null;
const changes=[],pending=[],seenRows=new Set();
let verifiedRows=0;
let touched=0;
for(let n=start;n<=end;n++){
 const id='SC50-'+String(n).padStart(4,'0'),meta=idx.scenes[id];
 if(!meta)throw Error('missing scene '+id);
 const file=meta.path,raw=fs.readFileSync(file);
 if(sha(raw)!==meta.git_blob_sha1)throw Error('stale index '+id);
 const scene=JSON.parse(raw);
 if(scene.scene_id!==id||scene.records.length!==meta.records||scene.record_count!==meta.records||scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('scene contract '+id);
 let changed=false;
 for(const row of scene.records){
  if(row.scene_id!==id||!Number.isInteger(row.source_final_row)||row.release_allowed!==false||row.srs_eligible!==false||seenRows.has(row.source_final_row))throw Error('row identity/gate mismatch '+id);
  seenRows.add(row.source_final_row);verifiedRows++;
  if(touched>=max)continue;
  const native=row.kaikki_full_native_evidence,expression=trim(row.question_page?.expression),c=native?.candidates;
  if(!expression||native?.expression_exact!==expression||native?.source_final_row!==row.source_final_row||!Array.isArray(c)||!c.length||c.some(x=>x.source_word!==expression||!Number.isInteger(x.source_line)))continue;
  const pos=unanimous(c.map(x=>trim(x.pos)));
  const ipa=unanimous(c.map(x=>Array.isArray(x.ipa_candidates)&&x.ipa_candidates.length===1?trim(x.ipa_candidates[0]):null));
  const patch={};
  if(!trim(row.question_page?.ipa_candidate)&&ipa)patch.ipa=ipa;
  if(!trim(row.answer_page?.pos)&&!trim(row.question_page?.pos)&&pos)patch.pos=pos;
  if(!Object.keys(patch).length||row.native_field_fill_provenance)continue;
  if(patch.ipa)row.question_page.ipa_candidate=patch.ipa;
  if(patch.pos)row.answer_page.pos=patch.pos;
  // Provenance and review gates remain explicit; no first-review promotion.
  row.native_field_fill_provenance={schema:'cgmaster-native-ipa-pos/v1',archive_sha256:native.archive_sha256,source_lines:c.map(x=>x.source_line),fields:Object.keys(patch),qa_stage:'待审',first_review:false};
  changes.push({scene_id:id,source_final_row:row.source_final_row,fields:patch});
  touched++;changed=true;
 }
 if(changed)pending.push({id,file,scene});
}
if(verifiedRows!==Array.from({length:end-start+1},(_,i)=>idx.scenes['SC50-'+String(i+start).padStart(4,'0')].records).reduce((a,b)=>a+b,0))throw Error('selected scene identity count mismatch');
if(write&&pending.length){
 const previous=idx.master_release?.version;
 if(!/^V[0-9]+$/.test(previous)||Number(process.env.CGMASTER_NEXT_RELEASE.slice(1))!==Number(previous.slice(1))+1)throw Error('release must advance exactly one version');
 // Revalidate the full original index before making any file changes.
 if(sha(fs.readFileSync(indexPath))!==originalIndexSha)throw Error('concurrent index modification');
 for(let n=1;n<=1341;n++){
  const id='SC50-'+String(n).padStart(4,'0'),meta=idx.scenes[id],raw=fs.readFileSync(meta.path);
  if(sha(raw)!==meta.git_blob_sha1)throw Error('concurrent modification '+id);
 }
 for(const p of pending){
  const raw=Buffer.from(JSON.stringify(p.scene,null,2)+'\n');
  fs.writeFileSync(p.file,raw);
  idx.scenes[p.id].git_blob_sha1=sha(raw);
 }
 idx.master_release={metadata_schema:'scene1341-master-release/v1',version:process.env.CGMASTER_NEXT_RELEASE,content_baseline:'SOURCE_SAFE_KAIKKI_IPA_POS',published_date:new Date().toISOString().slice(0,10),stage:'TEST_ONLY_QA_PENDING',headline:'Kaikki来源严格一致的音标与词性候选增补（待审）',changes:[{category:'native_ipa_pos_source_pinned',count:changes.length},{category:'scene_documents_updated',count:pending.length}],changed_scene_ids:pending.map(p=>p.id),qa_stage:'待审',release_allowed:false,srs_eligible:false};
 fs.writeFileSync(indexPath,JSON.stringify(idx,null,2)+'\n');
 const checkpointPath='tools/scene1341_master/CGMASTER_CURRENT_STATE.json';
 const checkpoint=JSON.parse(fs.readFileSync(checkpointPath,'utf8'));
 checkpoint.version=process.env.CGMASTER_NEXT_RELEASE+'_ATOMIC_SOURCE_SAFE_IPA_POS';
 checkpoint.updated_at=new Date().toISOString().slice(0,10);
 checkpoint.handoff_id='SC1341-'+process.env.CGMASTER_NEXT_RELEASE+'-IPA-POS';
 checkpoint.latest_ipa_pos_fill={release:process.env.CGMASTER_NEXT_RELEASE,changed_rows:changes.length,changed_scenes:pending.length,qa_stage:'待审',release_allowed:false,srs_eligible:false};
 fs.writeFileSync(checkpointPath,JSON.stringify(checkpoint,null,2)+'\n');
}
console.log(JSON.stringify({mode:write?'LOCAL_WRITE':'DRY_RUN',verified_rows:verifiedRows,changed_rows:touched,changed_scenes:pending.length,changes,qa_stage:'待审',release_allowed:false,srs_eligible:false},null,2));
