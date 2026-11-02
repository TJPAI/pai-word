import assert from 'node:assert/strict';
import {inspectFrozenEnlexV2} from './enlex-v2-staging-loader.mjs';
import fs from 'node:fs';
const intake=JSON.parse(fs.readFileSync('tools/integration/enlex-v2-staging-intake-20261102.json','utf8'));
assert.throws(()=>inspectFrozenEnlexV2({}),/ENLEX_V2_SOURCE_REQUIRED/);
const root=process.argv[2];
if(!root){console.log('PASS loader rejects implicit source; full source test requires explicit frozen checkout');process.exit(0);}
const r=inspectFrozenEnlexV2({root,manifestRelativePath:intake.source.manifest,expectedCommit:intake.source.commit});
assert.equal(r.records,27471);assert.equal(r.shards,6);
assert.equal(r.stagingOnly,true);assert.equal(r.productionEligible,false);
assert.equal(r.semanticReview,83);assert.equal(r.questionRebuild,84);
assert.equal(Object.hasOwn(r,'candidateRows'),false);
console.log(JSON.stringify({test:'ENLEX_V2_STAGING_LOADER',status:'PASS',records:r.records,shards:r.shards,semanticReview:r.semanticReview,questionRebuild:r.questionRebuild,productionEligible:false}));
