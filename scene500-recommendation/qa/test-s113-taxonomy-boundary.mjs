// Scene500 S113 taxonomy boundary regression; does not mutate any assets.
// node scene500-recommendation/qa/test-s113-taxonomy-boundary.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(path)=>JSON.parse(fs.readFileSync(path,'utf8'));
const catalog=read('scene500-recommendation/catalog-v0.2.json');
const legacy=fs.readFileSync('data/scene500-taxonomy-20x25-v1.txt','utf8');
const taxonomy=read('data/scene-taxonomy-v2.json');
const membership=read('data/scene500-playable-membership-v2.json');
const candidates=read('scene500-recommendation/qa/fixtures/s113-teaching-candidates-source-75d1325.json');
const scene=(id)=>taxonomy.scenes.find(x=>x.id===id);
assert.equal(catalog.scenes.S113.name,'预订酒店');
assert.match(legacy,/^S113\s+预订酒店$/m);
assert.equal(scene('S113').nameZh,'公园游览');
assert.equal(scene('S104').nameZh,'预订酒店');
assert.equal(membership.scenes.S113,undefined);
const expected={guest:2,reservation:3,cancellation:4};
assert.equal(candidates.production_ready,false);
for(const r of candidates.records){
  assert.equal(r.scene_id,'S113');
  assert.equal(r.scene_rank,expected[r.headword]);
}
const rank=(sceneId,lemma)=>membership.scenes[sceneId]?.entries.find(x=>x.lemma===lemma)?.sceneRank??null;
assert.equal(rank('cs043','guest'),9);
assert.equal(rank('cs043','reservation'),3);
assert.equal(rank('cs043','cancellation'),null);
assert.equal(rank('cs043','cancel'),6);
assert.equal(rank('cs044','guest'),7);
assert.equal(rank('cs044','reservation'),10);
console.log(JSON.stringify({status:'PASS_TAXONOMY_BOUNDARY',recommendation_s113:'预订酒店',taxonomy_v2_s113:'公园游览',taxonomy_v2_hotel:'S104',candidate_ranks_verified:false,membership_s113_present:false,production_ready:false}));
