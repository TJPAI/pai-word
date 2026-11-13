#!/usr/bin/env node
// CI/readback validator; no new lexical claims or release approvals.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const [dir,targetPath]=process.argv.slice(2);
if(!dir||!targetPath)throw Error('Usage: node validate-kaikki-ipa-output.mjs <outdir> <targets.json>');
const targets=JSON.parse(fs.readFileSync(targetPath,'utf8')).targets;
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const results=fs.readFileSync(path.join(dir,'ipa-candidates.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const ids=new Set(targets.map(x=>x.id));
assert.equal(targets.length,1778,'1778-target invariant');
assert.equal(ids.size,1778,'KU stable ID uniqueness');
assert.equal(manifest.target_count,1778);
assert.equal(manifest.release_allowed,false);
assert.equal(manifest.master_approved,0);
assert.equal(manifest.qa_pass,0);
assert.equal(manifest.muse_certified,0);
const seen=new Set(),native=new Set(),none=new Set(),region={us:new Set(),uk:new Set(),generic:new Set(),other:new Set(),both:new Set()};
const scopes={phrase:new Set(),word:new Set()};
let suspicious=0;
for(const row of results){
 assert(ids.has(row.id),'foreign output KU');
 assert.equal(row.release_allowed,false,'candidate must never auto release');
 seen.add(row.id);
 if(row.status==='NOT_FOUND'){
  none.add(row.id);
  assert.equal(row.ipa_us,null);assert.equal(row.ipa_uk,null);assert.equal(row.ipa_generic,null);
  continue;
 }
 native.add(row.id);
 assert.equal(row.source,'Kaikki English Wiktionary extract');
 assert.equal(row.ipa_review_status,'CANDIDATE');
 assert(Number.isInteger(row.source_line)&&row.source_line>=1);
 assert(Array.isArray(row.source_tags));assert(Array.isArray(row.other_regional_tags));
 assert(row.ipa&&typeof row.ipa==='string');
 assert(['us','uk','generic','other','both'].includes(row.region));
 assert(['phrase','word'].includes(row.pronunciation_scope));
 assert.equal(row.master_approved,false);assert.equal(row.qa_pass,false);
 region[row.region].add(row.id);
 scopes[row.pronunciation_scope].add(row.id);
 if((row.region==='generic'||row.region==='other') && (row.ipa_us||row.ipa_uk))suspicious++;if(row.region==='other' && row.other_regional_tags.length===0)suspicious++;if(row.region==='generic' && row.other_regional_tags.length!==0)suspicious++;
}
assert.equal(suspicious,0,'do not infer US/UK from generic');
assert.equal(seen.size,1778);
assert.equal(native.size,manifest.targets_with_native_ipa);
assert.equal(none.size,manifest.targets_without_native_ipa);
assert.equal(native.size+none.size,1778);
assert.equal([...native].filter(x=>none.has(x)).length,0);
const summary={status:'PASS_SOURCE_CANDIDATE_ONLY',source_sha256:manifest.source_compressed_sha256,target_count:1778,unique_expressions:manifest.unique_expression_keys,native_ipa_ku_count:native.size,not_found_ku_count:none.size,direct_phrase_ku_count:scopes.phrase.size,direct_word_ku_count:scopes.word.size,explicit_us_ku_count:region.us.size,explicit_uk_ku_count:region.uk.size,both_us_uk_ku_count:region.both.size,generic_ku_count:region.generic.size,other_region_ku_count:region.other.size,all_uncertified:true,production_release:0};
fs.writeFileSync(path.join(dir,'validated-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
