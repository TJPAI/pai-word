#!/usr/bin/env node
/**
 * Safe multi-field teaching draft intake (JSONL).
 * node tools/scene1341_master/import_teaching_fields.mjs --input /tmp/teaching.jsonl [--write]
 * Each line: {scene_id,source_final_row,expression,fields:{example_en,example_zh,collocations,usage_note},provenance:{source,source_id}}
 * Dry-run by default. --write is allowed only inside an atomic publisher context.
 * Does NOT publish an index/release: the atomic publisher must update hashes and verify the catalog.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const args=process.argv.slice(2),arg=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};
const input=arg('--input'),write=args.includes('--write');
if(!input||!fs.existsSync(input))throw Error('Provide an existing --input JSONL');
if(write&&(!args.includes('--atomic-release-context')||!/^V[0-9]+$/.test(process.env.CGMASTER_NEXT_RELEASE||'')))throw Error('write requires atomic release context and next version');
const base='tools/scene1341_master/production';
const idx=JSON.parse(fs.readFileSync(base+'/SCENE1341_LIVE_INDEX.json','utf8'));
if(idx.scene_count!==1341||idx.source_associations!==230289||idx.release_allowed!==false||idx.srs_eligible!==false)throw Error('frozen catalog invariant');
const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\\0')).update(b).digest('hex');
const allowed=['example_en','example_zh','collocations','usage_note'];
const valid=v=>typeof v==='string'&&v.trim().length>=3&&v.trim().length<=800&&!/[<>]/.test(v);
const lines=fs.readFileSync(input,'utf8').split(/\r?\n/).filter(Boolean);
const seen=new Set(),byScene=new Map();
for(const [i,line] of lines.entries()){
 const r=JSON.parse(line),key=r.scene_id+':'+r.source_final_row;
 if(!/^SC50-(0[0-9]{3}|1[0-2][0-9]{2}|13[0-3][0-9]|134[01])$/.test(r.scene_id)||!idx.scenes[r.scene_id]||!Number.isInteger(r.source_final_row)||seen.has(key))throw Error('invalid/duplicate identity line '+(i+1));
 seen.add(key);
 if(!r.provenance||typeof r.provenance.source!=='string'||!r.provenance.source.trim()||typeof r.provenance.source_id!=='string'||!r.provenance.source_id.trim())throw Error('missing source provenance line '+(i+1));
 if(!r.fields||!Object.keys(r.fields).length||Object.keys(r.fields).some(k=>!allowed.includes(k)||!valid(r.fields[k])))throw Error('invalid teaching fields line '+(i+1));
 if(!byScene.has(r.scene_id))byScene.set(r.scene_id,[]);
 byScene.get(r.scene_id).push(r);
}
const result={mode:write?'LOCAL_ATOMIC_STAGE':'DRY_RUN',input_rows:lines.length,changed_records:0,changed_fields:Object.fromEntries(allowed.map(k=>[k,0])),already_present:0,scenes_changed:0,identity_errors:0,qa_stage:'待审',release_allowed:false,srs_eligible:false};
const pending=[];
for(const [id,items] of byScene){
 const meta=idx.scenes[id],raw=fs.readFileSync(meta.path);
 if(sha(raw)!==meta.git_blob_sha1)throw Error('stale index '+id);
 const scene=JSON.parse(raw),rows=new Map(scene.records.map(r=>[r.source_final_row,r]));
 if(scene.scene_id!==id||scene.record_count!==meta.records||scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('scene contract '+id);
 let changed=false;
 for(const item of items){
  const row=rows.get(item.source_final_row);
  if(!row||row.scene_id!==id||row.question_page?.expression!==item.expression||row.release_allowed!==false||row.srs_eligible!==false)throw Error('frozen row/expression mismatch '+id+':'+item.source_final_row);
  if(!row.answer_page||typeof row.answer_page!=='object')throw Error('missing answer page');
  let rowChanged=false;
  for(const [field,value] of Object.entries(item.fields)){
   if(row.answer_page[field]){result.already_present++;continue;}
   row.answer_page[field]=value.trim();
   row.answer_page[field+'_provenance']={...item.provenance,qa_stage:'待审',first_review:false};
   result.changed_fields[field]++;changed=true;rowChanged=true;
  }
  if(rowChanged)result.changed_records++;
 }
 if(changed){result.scenes_changed++;pending.push({path:meta.path,bytes:Buffer.from(JSON.stringify(scene,null,2)+'\\n')});}
}
if(write)for(const p of pending)fs.writeFileSync(p.path,p.bytes);
console.log(JSON.stringify(result,null,2));
