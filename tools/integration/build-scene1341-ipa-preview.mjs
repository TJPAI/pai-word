/* Build a preview-only IPA index from the existing released Core20K
 * 20,000-word runtime, and the seven CG-QA SHA-verified 1778 answer records.
 * DO NOT call generated token concatenations verified whole-phrase IPA.
 * No mutable services, external TTS or production storage.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
const qaDir=path.resolve(process.env.SCENE1341_QA_SOURCE_DIR||'qa-source');
const qaPrefix='tools/core20k_lexicon/qa/';
const manifestName='CG_QA_SCENE1341_V51_STAGING_ANSWER_PROVISIONAL_1778_MANIFEST_20261112.v2.json';
const coreFile='data/core20k-runtime.json.gz';
const coreBlob='56cd4ba51ecc99ce56e4d73c69bae305b68aab5c';
const qaManifestBlob='f8967fb97573bbccd89b4c645303dd2c983bb1da';
const shaBlob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
function pinnedFile(root,relative,sha){
 const raw=fs.readFileSync(path.join(root,relative));
 if(shaBlob(raw)!==sha)throw Error('IPA_SOURCE_SHA_MISMATCH_'+relative);
 return raw;
}
const core=JSON.parse(zlib.gunzipSync(pinnedFile('.',coreFile,coreBlob)).toString('utf8'));
if(core.headwords?.length!==20000)throw Error('IPA_CORE20K_COUNT');
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().trim().replace(/\s+/gu,' ');
const lexical=new Map();
for(const word of core.headwords){
 if(!Array.isArray(word)||!Number.isInteger(word[0]))throw Error('IPA_LEXICON_ROW');
 const lemma=normalize(word[1]),raw=String(word[3]||'').trim();
 if(!lemma||!/^(\/)[^/]+\/$/u.test(raw)||/[\n\r]/.test(raw))continue;
 if(!lexical.has(lemma))lexical.set(lemma,{rank:word[0],ipa:raw});
}
const qa=JSON.parse(pinnedFile(qaDir,qaPrefix+manifestName,qaManifestBlob));
if(qa.counts?.included_cg_pass_no_known_mu_objection!==1778||qa.shards?.length!==7)
 throw Error('IPA_QA_SOURCE_COUNT');
let total=0,exact=0,phrase=0,missing=0;
const entries={},ids=new Set();
for(const shard of qa.shards){
 const pack=JSON.parse(pinnedFile(qaDir,shard.path,shard.blob));
 if(pack.records?.length!==shard.counts.included)throw Error('IPA_QA_SHARD_COUNT');
 for(const row of pack.records){
  if(ids.has(row.scene_ku_id)||row.cg_qa!=='PASS'||row.production_release_allowed!==false)
   throw Error('IPA_QUARANTINED_ROW');
  ids.add(row.scene_ku_id);total++;
  const expression=normalize(row.expression);
  const direct=lexical.get(expression);
  if(direct){
   entries[row.scene_ku_id]={ipa:direct.ipa,kind:'word',source:'Core20K',wordRanks:[direct.rank]};
   exact++;continue;
  }
  const tokens=expression.split(' ');
  if(tokens.length<2||tokens.length>8||tokens.some(t=>!/^[a-z]+(?:[-'][a-z]+)*$/u.test(t))){
   missing++;continue;
  }
  const words=tokens.map(t=>lexical.get(t));
  if(words.some(x=>!x)){missing++;continue}
  // No cross-word stress inference. This is explicitly only a word-by-word
  // learner reference, not a certified connected-speech transcription.
  const ipa='/'+words.map(x=>x.ipa.slice(1,-1).replace(/[ˈˌ]/gu,'')).join(' ')+'/';
  entries[row.scene_ku_id]={ipa,kind:'word_by_word',source:'Core20K',wordRanks:words.map(x=>x.rank)};
  phrase++;
 }
}
if(total!==1778||exact+phrase+missing!==1778)throw Error('IPA_COVERAGE_TOTAL');
const output={
 schema:'pai-scene1341-core20k-ipa-preview-v1',
 sourceCore20kBlob:coreBlob,
 sourceQAmanifestBlob:qaManifestBlob,
 sourceCore20kWords:20000,
 sourceQAprovisionalKU:1778,
 coveredWords:exact,
 coveredCompositionalPhrases:phrase,
 missing,
 disclaimer:'Multiword IPA is a sequence of word-level readings, not verified connected-speech IPA.',
 productionRelease:false,
 canWriteSrs:false,
 entries
};
const text=JSON.stringify(output);
const destination='rebuild-preview/scene1341-readonly/scene1341-ipa-preview.json';
if(fs.existsSync(destination)&&fs.readFileSync(destination,'utf8')!==text)
 throw Error('IPA_PINNED_PROJECTION_DRIFT');
console.log('IPA_SUMMARY '+JSON.stringify({exact,phrase,missing,covered:exact+phrase,coverage:((exact+phrase)/1778*100).toFixed(1)+'%',bytes:Buffer.byteLength(text),wakeUp:Object.values(entries).find(x=>x.kind==='word_by_word'&&x.ipa.includes('weɪk'))||null}));
if(process.env.IPA_EMIT_JSON==='1'){
 console.log('IPA_JSON_BEGIN');
 for(let i=0;i<text.length;i+=6000)console.log('IPA_CHUNK '+(i/6000)+':'+text.slice(i,i+6000));
 console.log('IPA_JSON_END');
}
