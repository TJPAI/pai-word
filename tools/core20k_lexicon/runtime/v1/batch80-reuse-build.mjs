// Batch80: rebuild full immutable-ID legacy KU review queues from actual Core13K JSON + frozen V2.0.6 CSV.
// Usage: node batch80-reuse-build.mjs <master.json> <frozen.csv> <output.jsonl>
// Source file parsing happens locally. Does not certify or publish any KU.
import fs from 'node:fs';import assert from 'node:assert/strict';
const [master,freeze,out]=process.argv.slice(2);if(!out)throw Error('Usage: node batch80-reuse-build.mjs <Core13K-master.json> <frozen.csv> <out.jsonl>');
function csvRows(raw){const rows=[];let a=[],s='',quoted=false;for(let i=0;i<raw.length;i++){const ch=raw[i];if(ch==='"'){if(quoted&&raw[i+1]==='"'){s+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){a.push(s);s=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&raw[i+1]==='\n')i++;a.push(s);s='';if(a.length>1)rows.push(a);a=[]}else s+=ch}if(s||a.length){a.push(s);rows.push(a)}const h=rows.shift().map(x=>x.replace(/^\uFEFF/,''));return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])));}
const words=JSON.parse(fs.readFileSync(master,'utf8')).words,membership=csvRows(fs.readFileSync(freeze,'utf8'));
assert.equal(membership.length,20000);const map=new Map(membership.map(x=>[x.v2_0_6_lemma,Number(x.core20k_rank_final)]));assert.equal(map.size,20000);
const ids=new Set(),records=[];
for(const word of words){const rank=map.get(word.lemma);if(!rank)continue;const senses=new Map((word.senses??[]).map(s=>[s.id,s]));
for(const ku of word.knowledge_units??[]){if(!ku.id||ids.has(ku.id))continue;ids.add(ku.id);const sense=senses.get(ku.sense_id);
records.push({headword_id:'core20k:rank:'+rank,headword:word.lemma,rank,legacy_word_id:word.id,sense_id:ku.sense_id??null,ku_id:ku.id,ku_type_legacy:ku.type,pos:word.pos,gloss_en:sense?.en_cluster??null,gloss_zh:sense?.zh_core??null,us_ipa:word.us_ipa??null,teaching_text_zh:ku.content_zh??null,quality_status:'LEGACY_UNREVIEWED',evidence_status:'REVIEW_REQUIRED',production_ready:false,blockers:[...(!sense?['SENSE_ID_UNRESOLVED']:[]),'INDEPENDENT_SENSE_AND_BILINGUAL_QA_REQUIRED','POS_IPA_SIGNOFF_REQUIRED','ANSWER_QUALITY_SIGNOFF_REQUIRED','EDITORIAL_SIGNOFF_REQUIRED']});}}
records.sort((a,b)=>a.rank-b.rank||a.ku_id.localeCompare(b.ku_id));fs.writeFileSync(out,records.map(x=>JSON.stringify(x)).join('\n')+'\n');
console.log(JSON.stringify({records:records.length,top1000:records.filter(x=>x.rank<=1000).length,production_ready:0}));
