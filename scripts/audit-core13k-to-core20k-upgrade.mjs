// Static upgrade contract audit. No production data or UI mutations.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const legacy=JSON.parse(fs.readFileSync('data/learning-v3/manifest.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/learning-v3/content-audit.json','utf8'));
const overlap=JSON.parse(fs.readFileSync('data/core20k-final-v206/scene500-v40-intersection-audit.json','utf8'));
const adapter=fs.readFileSync('scripts/core20k-unified-runtime-adapter.mjs','utf8');
const boot=fs.readFileSync('scripts/core20k-dev-boot.mjs','utf8');
assert.equal(legacy.wordCount,13000);
assert.equal(legacy.kuCount,16616);
assert.equal(legacy.chunkSize,250);
assert.equal(overlap.coverage['100'].total_hits,49931);
assert.equal(overlap.coverage['100'].total_slots,50000);
assert(adapter.includes('e:[],c:\'\',x:\'\''),'Expect current adapter to discard rich learning fields');
assert(boot.includes('window.downloadOfflineLexicon=async()=>{}'),'Expect Core20K offline download still stubbed');
const report={
 schema:'pai-core20k-vs-core13000-static-audit-v1',
 status:'FAIL_NONLOSSY_UPGRADE_NOT_ESTABLISHED',
 baseline:{release:legacy.release,headwords:legacy.wordCount,kus:legacy.kuCount,chunkSize:legacy.chunkSize,contentAudit:{examplesRemoved:audit.examplesRemoved,collocationsRemoved:audit.collocationsRemoved,usageRemoved:audit.usageRemoved}},
 target:{headwords:20000,runtime:'data/core20k-runtime.json.gz',richContentPreserved:false,offlineDownloadImplemented:false},
 scene500:{top100IntersectionSlots:overlap.coverage['100'].total_hits,top100TotalSlots:overlap.coverage['100'].total_slots,sceneSenseVerified:false},
 blockers:[
  'Core20K adapter initializes examples/collocations/usage as empty; compare by lemma plus KU identity and sense to determine true losses',
  'Core20K boot replaces offline downloader with a no-op; restore real local persistence and chunking',
  'Legacy V26.7I has already removed placeholder content; only count verified meaningful text as content to preserve',
  'KU identities and SRS records must be compared across old and new vocabularies before migration'
 ],
 caveat:'Static manifest/code audit only; does not quantify actual cross-version lost examples or retention, nor run Safari.'
};
console.log(JSON.stringify(report,null,2));
