import fs from 'node:fs';
import assert from 'node:assert/strict';
// Read-only Core-13000 V25.5 master audit, not the reduced runtime pack.
// Usage: node scripts/audit-master-rich.mjs <path-to-master.json> [report.json]
const input=process.argv[2];
if(!input)throw Error('Provide Core13000 master path');
const raw=JSON.parse(fs.readFileSync(input,'utf8'));
assert(Array.isArray(raw.words)&&raw.words.length===13000,'Expected 13000 master records');
const fields=['examples','collocations','grammar_patterns','usage_notes','synonym_contrasts','word_family'];
const c={wordCount:raw.words.length,distinctLemmas:0,kuIds:0,distinctKuIds:0,duplicateLemmas:[],duplicateKuIds:[],richFieldEntryCounts:{},richFieldItemCounts:{},kuTypes:{},kuStatuses:{},missingRequired:[]};
const lemmas=new Map(),ids=new Set();
for(const w of raw.words){
 const lemma=String(w.lemma||'').trim().toLowerCase();
 if(!lemma||!Number.isInteger(w.rank))c.missingRequired.push(w.id||lemma);
 const a=lemmas.get(lemma)||[];a.push({id:w.id,rank:w.rank});lemmas.set(lemma,a);
 for(const field of fields){const value=w[field];
 const n=Array.isArray(value)?value.length:(value&&typeof value==='object'?Object.keys(value).length:value?1:0);
 c.richFieldEntryCounts[field]=(c.richFieldEntryCounts[field]||0)+(n>0?1:0);
 c.richFieldItemCounts[field]=(c.richFieldItemCounts[field]||0)+n;
 }
 for(const ku of w.knowledge_units||[]){
 c.kuIds++;if(ids.has(ku.id))c.duplicateKuIds.push(ku.id);ids.add(ku.id);
 c.kuTypes[ku.type]=(c.kuTypes[ku.type]||0)+1;
 c.kuStatuses[ku.status||'unspecified']=(c.kuStatuses[ku.status||'unspecified']||0)+1;
 }
}
c.distinctLemmas=lemmas.size;c.distinctKuIds=ids.size;
c.duplicateLemmas=[...lemmas].filter(([,a])=>a.length>1).map(([lemma,records])=>({lemma,records}));
c.source={schema_version:raw.schema_version,base_release:raw.base_release,dataset:raw.dataset};
c.status='MASTER_INVENTORY_ONLY_NOT_RELEASE_CERTIFICATION';
assert.equal(c.kuIds,c.distinctKuIds,'Duplicate KU ID in master');
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(c,null,2)+'\n');
console.log(JSON.stringify(c,null,2));
