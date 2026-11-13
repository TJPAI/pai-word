#!/usr/bin/env node
// CG-ENLEX: source-backed Kaikki IPA extraction, candidate only.
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import readline from 'node:readline';
import path from 'node:path';
const [src,targetFile,outDir]=process.argv.slice(2);
if(!src||!targetFile||!outDir){console.error('Usage: node extract-kaikki-ipa.mjs <English.jsonl.gz> <targets.json> <outdir>');process.exit(2)}
const j=JSON.parse(fs.readFileSync(targetFile,'utf8')), targets=Array.isArray(j)?j:j.targets;
if(!Array.isArray(targets)||!targets.every(t=>typeof t.id==='string'&&t.id&&typeof t.expression==='string'&&t.expression))throw Error('Invalid target id/expression');
const norm=s=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
const index=new Map();for(const t of targets){const k=norm(t.expression);if(!index.has(k))index.set(k,[]);index.get(k).push(t)}
if(new Set(targets.map(t=>t.id)).size!==targets.length)throw Error('Duplicate target IDs');
fs.mkdirSync(outDir,{recursive:true});
const hash=crypto.createHash('sha256'), input=fs.createReadStream(src);
input.on('data',chunk=>hash.update(chunk));
const lines=readline.createInterface({input:input.pipe(zlib.createGunzip()),crlfDelay:Infinity});
const rows=new Map(),matched=new Set(),ambiguous=new Set();let line=0,malformed=0,entries=0,readings=0;
function region(tags){const t=tags.map(x=>String(x).toLowerCase().trim().replace(/[\\s_]+/g,'-'));const us=t.some(x=>['us','usa','united-states','american','general-american','en-us'].includes(x));const uk=t.some(x=>['uk','united-kingdom','british','received-pronunciation','rp','en-gb'].includes(x));const other=t.filter(x=>['australia','australian','new-zealand','india','canada','canadian','scotland','irish','ireland','south-africa','singapore','philippines','nigeria','newfoundland'].includes(x));return {label:us&&uk?'both':us?'us':uk?'uk':other.length?'other':'generic',other}}
for await(const raw of lines){line++;let e;try{e=JSON.parse(raw)}catch{malformed++;continue}if(typeof e.word!=='string')continue;const ts=index.get(norm(e.word));if(!ts)continue;entries++;
for(const [si,s] of (Array.isArray(e.sounds)?e.sounds:[]).entries()){if(typeof s?.ipa!=='string'||!s.ipa.trim())continue;readings++;const tags=Array.isArray(s.tags)?s.tags:[], classification=region(tags),r=classification.label;for(const t of ts){const arr=rows.get(t.id)||[];arr.push({id:t.id,scene_ku_id:t.id,scene_id:t.scene_id??null,source_sense_id:t.source_sense_id??null,source_rank:t.source_rank??null,source_qa_blob:t.source_qa_blob??null,source_pack_blob:t.source_pack_blob??null,expression:t.expression,entry_word:e.word,part_of_speech:e.pos??null,source_line:line,sound_index:si,ipa:s.ipa,ipa_us:(r==='us'||r==='both')?s.ipa:null,ipa_uk:(r==='uk'||r==='both')?s.ipa:null,ipa_generic:r==='generic'?s.ipa:null,source_tags:tags,region:r,other_regional_tags:classification.other,source:'Kaikki English Wiktionary extract',pronunciation_scope:/\s/.test(e.word.trim())?'phrase':'word',review_status:'CANDIDATE',ipa_review_status:'CANDIDATE',master_approved:false,qa_pass:false,muse_certified:false,release_allowed:false});rows.set(t.id,arr);matched.add(t.id)}}}
if(malformed)throw Error('MALFORMED_KAIKKI_JSONL_LINES '+malformed);
const out=fs.createWriteStream(path.join(outDir,'ipa-candidates.jsonl'),{encoding:'utf8'});
for(const t of targets){const arr=rows.get(t.id)||[];if(new Set(arr.map(x=>x.ipa+'|'+x.region)).size>1)ambiguous.add(t.id);if(arr.length)for(const r of arr)out.write(JSON.stringify(r)+'\n');else out.write(JSON.stringify({id:t.id,scene_ku_id:t.id,scene_id:t.scene_id??null,source_sense_id:t.source_sense_id??null,expression:t.expression,status:'NOT_FOUND',ipa_us:null,ipa_uk:null,ipa_generic:null,review_status:'NEEDS_REVIEW',ipa_review_status:'NEEDS_REVIEW',release_allowed:false})+'\n')}
await new Promise(resolve=>out.end(resolve));
const manifest={schema:'cg-enlex-kaikki-ipa-candidate-extraction-v1',source_file:path.basename(src),target_file_sha256:crypto.createHash('sha256').update(fs.readFileSync(targetFile)).digest('hex'),target_source_author_git_blob:j.source_author_git_blob??null,source_compressed_sha256:hash.digest('hex'),target_count:targets.length,unique_target_ids:targets.length,unique_expression_keys:index.size,scanned_jsonl_lines:line,malformed_jsonl_lines:malformed,matching_source_entries:entries,matching_ipa_readings:readings,targets_with_native_ipa:matched.size,targets_without_native_ipa:targets.length-matched.size,targets_with_multiple_readings:ambiguous.size,review_status:'CANDIDATE_ONLY',master_approved:0,qa_pass:0,muse_certified:0,release_allowed:false,notes:['Only exact NFKC/casefold source entry.word matches','Explicit US/UK tags only; known other regions recorded separately; unmarked/nonregional tags classified generic','Native phrase IPA not composed from word fragments','source_line is decompressed JSONL line number','Master Sense identity and CG-QA/Muse audit still required']};
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest));
