// Read-only provenance guard: never use S113 across incompatible taxonomies.
// Run: node tools/answer-enrichment/test-s113-taxonomy-provenance.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const audit=load('s113-taxonomy-conflict-audit.v1.json');
const catalog=load('../../scene500-recommendation/catalog-v0.2.json');
const shard=load('../../data/scene500-top100-v40/group-05.json');
assert.equal(audit.scene_id,'S113');
assert.equal(audit.status,'UNRESOLVED_TAXONOMY_CONFLICT');
assert.equal(catalog.scenes.S113.name,'预订酒店');
const top=shard.scenes.S113;
for(const item of audit.verified_sources[1].membership_top4){
 const row=top[item.scene_rank-1];
 assert.deepEqual([row[0],row[1],row[3]],[item.scene_rank,item.headword,item.ku_id]);
}
assert.equal(audit.policy.no_scene_id_only_join,true);
assert.equal(audit.policy.require_taxonomy_version_and_source_commit,true);
assert.equal(audit.policy.prohibit_s113_candidate_release,true);
assert.equal(audit.reported_conflict.verification,'REPORTED_BY_QA_LINE_NOT_YET_LOCATED_IN_CURRENT_REPOSITORY');
assert(audit.candidate_status.every(item=>item.release==='STAGING'));
console.log('PASS: S113 20x25 catalog and top100 provenance verified; taxonomy-v2 authority unresolved; release remains STAGING');
