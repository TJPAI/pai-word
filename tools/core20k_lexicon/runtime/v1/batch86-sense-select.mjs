// Batch86 reproducible 200 distinct headword structural candidate selection.
// Args: <core13k_master.json> <frozen_membership_V2.0.6.csv> <output_200.jsonl>
// This DOES NOT certify lexical sense, pedagogical priority, Chinese meaning or IPA.
import fs from 'node:fs';import assert from 'node:assert/strict';
const [masterPath,frozenPath,out]=process.argv.slice(2);
if(!out)throw Error('Usage: node batch86-sense-select.mjs master.json frozen.csv out.jsonl');
const words=JSON.parse(fs.readFileSync(masterPath,'utf8')).words;
const csv=fs.readFileSync(frozenPath,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/);
const headers=csv.shift().split(',');const lemmaIdx=headers.indexOf('v2_0_6_lemma'),rankIdx=headers.indexOf('core20k_rank_final');
assert(lemmaIdx>=0&&rankIdx>=0);
const frozen=new Map(csv.filter(Boolean).map(l=>{const c=l.split(',');return [c[lemmaIdx].toLowerCase(),Number(c[rankIdx])]}));
assert.equal(frozen.size,20000);
const pool=[],kuSeen=new Set();
for(const word of words){
 const rank=frozen.get(word.lemma.toLowerCase());
 if(!rank||rank>5000||!/^[a-z]{4,}$/.test(word.lemma)||!/^(n\.|v\.|adj\.|adv\.)$/.test(word.pos))continue;
 for(const ku of word.knowledge_units||[]){
 if(ku.type!=='sense'||kuSeen.has(ku.id))continue;
 const sense=(word.senses||[]).find(s=>s.id===ku.sense_id);
 if(!sense)continue;
 const en=sense.en_cluster||'',zh=sense.zh_core||'',ipa=word.us_ipa||'';
 if(en.length<5||en.length>95||zh.length<2||zh.length>40||!ipa.startsWith('/')||!ipa.endsWith('/')||ipa.length<4)continue;
 kuSeen.add(ku.id);
 const flags=[];
 if(/^\/[a-zbcdfghjklmnpqrstvwxyzθðʃʒŋ]+[ˈˌ]/.test(ipa))flags.push('IPA_STRESS_POSITION');
 if(['state','work','thing','do','make','set','be','get','use','take'].includes(en.toLowerCase()))flags.push('EN_GLOSS_AMBIGUOUS');
 if(!sense.external_verification||sense.external_verification==='pending')flags.push('SOURCE_SENSE_UNVERIFIED');
 if(zh.includes('；'))flags.push('CHINESE_SENSE_BROAD');
 pool.push({headword_id:'core20k:rank:'+rank,headword:word.lemma,rank,legacy_word_id:word.id,sense_id:sense.id,ku_id:ku.id,ku_type:'Sense',pos:word.pos,gloss_en:en,gloss_zh:zh,legacy_us_ipa:ipa,legacy_ku_status:ku.status,example_en:ku.pattern_or_example,flags,quality_status:'L1_CANDIDATE_ONLY',evidence_status:'SOURCE_REVIEW_REQUIRED',content_certified:false,production_ready:false});
 }}
pool.sort((a,b)=>a.flags.length-b.flags.length||a.rank-b.rank||a.ku_id.localeCompare(b.ku_id));
const heads=new Set(),outRows=[];
for(const r of pool){if(heads.has(r.headword))continue;heads.add(r.headword);outRows.push(r);if(outRows.length===200)break}
assert.equal(outRows.length,200);assert.equal(new Set(outRows.map(x=>x.ku_id)).size,200);
fs.writeFileSync(out,outRows.map(r=>JSON.stringify(r)).join('\n')+'\n');
console.log(JSON.stringify({structural_candidates:pool.length,selected:outRows.length,content_certified:0,production_ready:0}));
