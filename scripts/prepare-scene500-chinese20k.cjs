#!/usr/bin/env node
// Stage 1: deterministic intake of a user-provided Chinese 20K list.
// It intentionally does NOT generate or claim AI-verified term/scene relevance.
const fs=require('node:fs'),crypto=require('node:crypto');
const [,,input,output]=process.argv;
if(!input||!output){console.error('Usage: node scripts/prepare-scene500-chinese20k.cjs INPUT.json OUTPUT.json');process.exit(2)}
const raw=fs.readFileSync(input);
const data=JSON.parse(raw.toString('utf8'));
const words=data.words;
if(!Array.isArray(words)||words.length!==20000)throw Error('Expected exactly 20000 entries in .words');
const seen=new Set();
for(const term of words){
 if(typeof term!=='string'||!term.trim()||term!==term.trim()||seen.has(term))
  throw Error('Invalid or duplicate word: '+String(term));
 seen.add(term);
}
const out={
 schema:'pai-scene500-chinese20k-intake-v0.1',
 provenance:{input_sha256:crypto.createHash('sha256').update(raw).digest('hex'),source_version:data.meta?.version||null,
 quality_status:data.meta?.quality_status||'unverified',independent_coverage_verified:data.meta?.independent_coverage_verified===true},
 word_count:words.length,
 stage:'membership_intake_only_no_scene_links',
 words:words.map((term,i)=>({term,source_rank:i+1,scene_links:[],association_status:'not_generated'}))
};
fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',words:words.length,links:0,sha256:out.provenance.input_sha256}));
