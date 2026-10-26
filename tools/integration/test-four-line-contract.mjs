// Run from repository root: node tools/integration/test-four-line-contract.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateFourLineIntegration} from '../../scripts/four-line-integration-contract.mjs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const catalog=read('scene500-recommendation/catalog-v0.2.json');
const membership=read('data/scene500-playable-membership-v2.json');
const english={words:Array(20000),byKU:new Map(),byRank:new Map()};
const input={catalog,english,activeSceneMembership:membership};
assert.equal(Object.keys(catalog.scenes).length,500);
assert.equal(catalog.scenes.S113.name,'预订酒店');
assert.equal(membership.scenes.S113,undefined);
const base=validateFourLineIntegration(input);
assert.equal(base.status,'PARTIAL');
assert.deepEqual(base.errors,[]);
assert(base.warnings.includes('CHINESE_V0101_NOT_DELIVERED'));
assert(base.warnings.includes('ASSOCIATIONS_NOT_DELIVERED'));
assert(base.warnings.includes('S113_NOT_PLAYABLE_TAXONOMY_CONFLICT'));
assert.equal(base.capabilities.recommendationSceneNavigation,false);
assert.equal(base.capabilities.certifiedTeaching,false);
const zh=read('scene500-recommendation/zh-core20k-v0101-scene500-runtime.json');
const withChinese=validateFourLineIntegration({...input,zhRuntime:zh});
assert.equal(withChinese.status,'PARTIAL');
assert.deepEqual(withChinese.errors,[]);
assert.equal(withChinese.capabilities.chineseV0101,true);
assert.equal(withChinese.capabilities.recommendationHybrid,false,'associations and hybrid QA are independent prerequisites');
assert(!withChinese.warnings.includes('CHINESE_V0101_NOT_DELIVERED'));
assert(withChinese.warnings.includes('ASSOCIATIONS_NOT_DELIVERED'));
const emptyAssociations=validateFourLineIntegration({...input,zhRuntime:zh,associations:{association_version:'unverified-test',links:[]}});
assert(emptyAssociations.errors.includes('INVALID_SCENE_ASSOCIATIONS'),'empty association list must be rejected');
assert.equal(emptyAssociations.capabilities.recommendationHybrid,false,'empty association asset cannot enable Hybrid');
for(const invalidMappings of [null,{},'S113',42]){
 const rejected=validateFourLineIntegration({...input,sceneMappings:invalidMappings});
 assert(rejected.errors.includes('MAPPING_SCHEMA'),'invalid mapping type must reject instead of throw');
 assert.equal(rejected.capabilities.recommendationSceneNavigation,false);
 assert.deepEqual(rejected.sceneMappings,[]);
}
// Reject plausible but incorrectly versioned associations before Hybrid can activate.
const validTerm=zh.terms[0].term_id;
const sampleAssociations={association_version:'integration-qa-only',source_data_version:zh.data_version,taxonomy_namespace:'scene500-20x25-v1',provenance_verified:true,links:[{term_id:validTerm,scene_id:'S001'}]};
const acceptedAssoc=validateFourLineIntegration({...input,zhRuntime:zh,associations:sampleAssociations});
assert.deepEqual(acceptedAssoc.errors,[]);
assert.equal(acceptedAssoc.capabilities.recommendationHybrid,true);
for(const patch of [{source_data_version:'0.9.4'},{taxonomy_namespace:'taxonomy-v2'},{provenance_verified:false},{provenance_verified:undefined}]){
 const mismatched=validateFourLineIntegration({...input,zhRuntime:zh,associations:{...sampleAssociations,...patch}});
 assert(mismatched.errors.includes('INVALID_SCENE_ASSOCIATIONS'),'unverified or mismatched provenance must fail');
 assert.equal(mismatched.capabilities.recommendationHybrid,false);
}
const unknownTerm=validateFourLineIntegration({...input,zhRuntime:zh,associations:{...sampleAssociations,links:[{term_id:'not-a-term',scene_id:'S001'}]}});
assert(unknownTerm.errors.includes('ASSOCIATION_REFERENCE_MISMATCH'));
assert.equal(unknownTerm.capabilities.recommendationHybrid,false);
const corrupted={...zh,terms:zh.terms.slice(1)};
assert(validateFourLineIntegration({...input,zhRuntime:corrupted}).errors.includes('INVALID_CHINESE_V0101'));
const bad=validateFourLineIntegration({...input,sceneMappings:[{scene_id:'S113',legacy_id:'cs043',provenance_verified:false,source_sha:'not-proof'}]});
assert(bad.errors.includes('UNVERIFIED_SCENE_MAPPING'));
assert.equal(bad.capabilities.recommendationSceneNavigation,false);
const wrongChinese=validateFourLineIntegration({...input,zhRuntime:{data_version:'0.10.1-evidence-compat',terms:[]}});
assert(wrongChinese.errors.includes('INVALID_CHINESE_V0101'));
const fakePublished=validateFourLineIntegration({...input,teaching:{status:'EDITORIAL_DRAFT_UNCERTIFIED',production_ready:false,activation_allowed:false}});
assert(!fakePublished.capabilities.certifiedTeaching);
assert(fakePublished.warnings.includes('TEACHING_STAGING_NOT_ACTIVATED'));
console.log('PASS four-line contract: real 500 catalog / verified Chinese 20K / S113 namespace / missing associations / rejected mappings / unapproved teaching');
