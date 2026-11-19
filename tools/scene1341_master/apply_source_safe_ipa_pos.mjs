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
if(![start,end,max].every(Number.isInteger)||start<1||end>1341||start>end||max<1)throw Error('invalid range');
const base='tools/scene1341_master/production';
const indexPath=path.join(base,'SCENE1341_LIVE_INDEX.json');
const idx=JSON.parse(fs.readFileSync(indexPath,'utf8'));
if(idx.scene_count!==1341||idx.source_associations!==230289||idx.release_allowed!==false||idx.srs_eligible!==false)throw Error('index gate mismatch');
const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const trim=v=>typeof v==='string'?v.trim():'';
const unanimous=xs=>xs.length&&xs.every(Boolean)&&new Set(xs).size===1?xs[0]:null;
const changes=[],pending=[];
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
  if(touched>=max)break;
  const native=row.kaikki_full_native_evidence,expression=trim(row.question_page?.expression),c=native?.candidates;
  if(!expression||native?.expression_exact!==expression||!Array.isArray(c)||!c.length||c.some(x=>x.source_word!==expression))continue;
  const pos=unanimous(c.map(x=>trim(x.pos)));
  const ipa=unanimous(c.map(x=>Array.isArray(x.ipa_candidates)&&x.ipa_candidates.length===1?trim(x.ipa_candidates[0]):null));
  const patch={};
  if(!trim(row.question_page?.ipa_candidate)&&ipa)patch.ipa=ipa;
  if(!trim(row.answer_page?.pos)&&!trim(row.question_page?.pos)&&pos)patch.pos=pos;
  if(!Object.keys(patch).length)continue;
  if(patch.ipa)row.question_page.ipa_candidate=patch.ipa;
  if(patch.pos)row.answer_page.pos=patch.pos;
  // Provenance and review gates remain explicit; no first-review promotion.
  row.native_field_fill_provenance={schema:'cgmaster-native-ipa-pos/v1',archive_sha256:native.archive_sha256,source_lines:c.map(x=>x.source_line),fields:Object.keys(patch),qa_stage:'待审',first_review:false};
  changes.push({scene_id:id,source_final_row:row.source_final_row,fields:patch});
  touched++;changed=true;
 }
 if(changed)pending.push({id,file,scene});
 if(touched>=max)break;
}
if(write&&pending.length){
 // Revalidate the full original index before making any file changes.
 for(let n=1;n<=1341;n++){
  const id='SC50-'+String(n).padStart(4,'0'),meta=idx.scenes[id],raw=fs.readFileSync(meta.path);
  if(sha(raw)!==meta.git_blob_sha1)throw Error('concurrent modification '+id);
 }
 for(const p of pending){
  const raw=Buffer.from(JSON.stringify(p.scene,null,2)+'\n');
  fs.writeFileSync(p.file,raw);
  idx.scenes[p.id].git_blob_sha1=sha(raw);
 }
 fs.writeFileSync(indexPath,JSON.stringify(idx,null,2)+'\n');
}
console.log(JSON.stringify({mode:write?'LOCAL_WRITE':'DRY_RUN',changed_rows:touched,changed_scenes:pending.length,changes,qa_stage:'待审',release_allowed:false,srs_eligible:false},null,2));
