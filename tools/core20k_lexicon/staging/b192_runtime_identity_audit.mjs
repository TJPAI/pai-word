// B192: read-only, fail-closed identity audit against pinned formal Core20K Runtime.
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
const [runtimePath,candidatePath]=process.argv.slice(2);
if(!runtimePath||!candidatePath)throw Error('USAGE: node b192_runtime_identity_audit.mjs <runtime.json.gz> <b184.jsonl>');
const gz=fs.readFileSync(runtimePath);
const sha=crypto.createHash('sha256').update(gz).digest('hex');
const EXPECTED='e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b';
if(sha!==EXPECTED)throw Error('RUNTIME_SHA_MISMATCH:'+sha);
const runtime=JSON.parse(zlib.gunzipSync(gz).toString('utf8'));
if(runtime.schema!=='pai-core20k-runtime-v1'||runtime.headwords?.length!==20000)throw Error('UNEXPECTED_RUNTIME_SCHEMA');
const cbytes=fs.readFileSync(candidatePath);const csha=crypto.createHash('sha256').update(cbytes).digest('hex');
if(csha!=='ce69a6686107697d9a5b07e3fb06c2e308811d51afbef7f03729398c2151095c')throw Error('B184_SHA_MISMATCH:'+csha);
const cs=cbytes.toString('utf8').trim().split(/\r?\n/).map(JSON.parse);
if(cs.length!==4)throw Error('CANDIDATE_COUNT');
const used=new Map(),ranks=new Map(),lemmas=new Set();
for(const row of runtime.headwords){
 const [rank,lemma,pos,ipa,kus]=row;
 if(!Number.isInteger(rank)||rank<1||rank>20000||ranks.has(rank)||typeof lemma!=='string'||!lemma.trim()||lemmas.has(lemma.toLowerCase())||!Array.isArray(kus))throw Error('INVALID_HEADWORD_ROW');
 lemmas.add(lemma.toLowerCase());
 ranks.set(rank,{lemma,pos,kus});
 for(const ku of kus){const id=ku[0];if(used.has(id))throw Error('DUPLICATE_OFFICIAL_KU:'+id);used.set(id,{rank,lemma,ku});}
}
for(let i=1;i<=20000;i++)if(!ranks.has(i))throw Error('MISSING_RUNTIME_RANK:'+i);
const records=cs.map(c=>{
 const rank=Number(c.rank),w=ranks.get(rank);
 const lemmaMatch=!!w&&w.lemma.toLowerCase()===c.headword.toLowerCase();
 const exactPhraseKUs=w?.kus.filter(k=>[k[2],k[3]].some(v=>typeof v==='string'&&v.toLowerCase().includes(c.collocation_en.toLowerCase())))||[];
 return {candidate_id:c.provisional_candidate_id,phrase:c.collocation_en,candidate_rank:rank,candidate_headword:c.headword,
   runtime_lemma:w?.lemma??null,rank_lemma_match:lemmaMatch,
   existing_ku_count:w?.kus.length??null,
   possible_existing_ku_matches:exactPhraseKUs.map(k=>({ku_id:k[0],type:k[1],gloss_zh:k[2],gloss_en:k[3]})),
   formal_sense_id:null,
   identity_verdict:lemmaMatch?'HEADWORD_RANK_VERIFIED_SENSE_OWNER_UNRESOLVED':'HEADWORD_RANK_MISMATCH',
   status:'NO_ID_ALLOCATED'};
});
const out={schema:'pai-core20k-b192-readonly-runtime-identity-audit-v1',runtime_sha256:sha,
  runtime_headwords:runtime.headwords.length,official_ku_ids:used.size,candidate_sha256:csha,
  records,registration_allowed:0,production_ready:0};
console.log(JSON.stringify(out,null,2));
if(records.some(r=>!r.rank_lemma_match))process.exitCode=2;
