#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const taxonomy = read('data/scene-taxonomy-v2.json');
const linksDoc = read('data/scene-ku-links-v2.json');
const candidates = read('data/scene500-candidates-v1.json');
const seedManifest = read('data/scene500-seed-manifest-v1.json');
const sourceMembership = fs.existsSync('data/scene500-source-membership-v1.json')
  ? read('data/scene500-source-membership-v1.json')
  : { scenes: {} };

const seededSceneIds = new Set();
for (const file of seedManifest.files || []) {
  const doc = read(file);
  for (const id of Object.keys(doc.scenes || {})) seededSceneIds.add(id);
}
const deferredSourceSceneIds = new Set(Object.keys(sourceMembership.scenes || {}));

const scenes = taxonomy.scenes || [];
const sceneIds = new Set(scenes.map(s => s.id));
const prod = linksDoc.links || [];
const cand = candidates.links || [];
const fail = [];
const warn = [];

for (const id of deferredSourceSceneIds) {
  if (!sceneIds.has(id)) fail.push(`unknown deferred source scene ${id}`);
  if (!seededSceneIds.has(id)) fail.push(`deferred source scene is not present in seed taxonomy: ${id}`);
}

for (const c of cand) {
  if (!sceneIds.has(c.sceneId)) fail.push(`unknown scene ${c.sceneId}`);
  if (!seededSceneIds.has(c.sceneId)) fail.push(`candidate references unseeded scene ${c.sceneId}`);
  if (deferredSourceSceneIds.has(c.sceneId)) fail.push(`semantic candidate generated for source-membership scene ${c.kuId}/${c.sceneId}`);
  if (!c.kuId) fail.push(`missing kuId for ${c.sceneId}`);
  if (c.source !== 'generated_candidate') fail.push(`candidate source must remain generated_candidate: ${c.kuId}/${c.sceneId}`);
  if (c.reviewStatus !== 'pending') fail.push(`candidate reviewStatus must remain pending: ${c.kuId}/${c.sceneId}`);
  if (!c.evidence || !/senseEn:|senseZh:/.test(c.evidence)) fail.push(`missing sense-level evidence: ${c.kuId}/${c.sceneId}`);
  if (/^headword-support:/.test(c.evidence || '')) fail.push(`headword-only evidence forbidden: ${c.kuId}/${c.sceneId}`);
  if (!['core','extended'].includes(c.relevance)) fail.push(`invalid relevance: ${c.kuId}/${c.sceneId}`);
}
const duplicateKeys = cand.map(c => `${c.kuId}::${c.sceneId}`);
if (new Set(duplicateKeys).size !== duplicateKeys.length) fail.push('duplicate KU-scene candidate links');

const scenesPerKu = new Map();
for (const c of cand) {
  if (!scenesPerKu.has(c.kuId)) scenesPerKu.set(c.kuId, new Set());
  scenesPerKu.get(c.kuId).add(c.sceneId);
}
for (const [kuId, ids] of scenesPerKu) {
  if (ids.size > 6) warn.push(`KU maps to ${ids.size} seeded scenes: ${kuId} -> ${[...ids].join(',')}`);
}

const sceneRows = scenes.filter(s => seededSceneIds.has(s.id)).map(s => {
  const cs = cand.filter(c => c.sceneId === s.id);
  const ps = prod.filter(c => c.sceneId === s.id);
  const deferredSource = deferredSourceSceneIds.has(s.id);
  if (!deferredSource && cs.length > 250) warn.push(`candidate explosion: ${s.id} has ${cs.length} candidates`);
  return {
    sceneId: s.id,
    categoryId: s.categoryId,
    nameZh: s.nameZh,
    candidateMode: deferredSource ? 'source_membership' : 'semantic',
    candidates: cs.length,
    candidateCore: cs.filter(c => c.relevance === 'core').length,
    verified: ps.filter(c => c.reviewStatus === 'verified').length,
    pendingProduction: ps.filter(c => c.reviewStatus === 'pending').length
  };
});

const categorySummary = {};
for (const row of sceneRows) {
  categorySummary[row.categoryId] ??= { seededScenes: 0, semanticScenes: 0, sourceMembershipScenes: 0, scenesWithCandidates: 0, candidates: 0, candidateCore: 0 };
  const c = categorySummary[row.categoryId];
  c.seededScenes++;
  if (row.candidateMode === 'source_membership') c.sourceMembershipScenes++;
  else c.semanticScenes++;
  if (row.candidates > 0) c.scenesWithCandidates++;
  c.candidates += row.candidates;
  c.candidateCore += row.candidateCore;
}

const trueEmptySemanticScenes = sceneRows
  .filter(x => x.candidateMode === 'semantic' && x.candidates === 0)
  .map(x => x.sceneId);

const summary = {
  taxonomyScenes: scenes.length,
  seededScenes: seededSceneIds.size,
  semanticSeededScenes: seededSceneIds.size - deferredSourceSceneIds.size,
  deferredSourceScenes: [...deferredSourceSceneIds].sort(),
  semanticScenesWithCandidates: sceneRows.filter(x => x.candidateMode === 'semantic' && x.candidates > 0).length,
  trueEmptySemanticScenes,
  candidateLinks: cand.length,
  productionLinks: prod.length,
  verifiedLinks: prod.filter(x => x.reviewStatus === 'verified').length,
  kuMultiSceneWarnings: warn.filter(x => x.startsWith('KU maps')).length,
  candidateExplosionWarnings: warn.filter(x => x.startsWith('candidate explosion')).length,
  categorySummary,
  status: fail.length ? 'FAIL' : warn.length ? 'PASS_WITH_WARNINGS' : 'PASS',
  errors: fail,
  warnings: warn
};

console.log(JSON.stringify({summary, scenes: sceneRows}, null, 2));
if (fail.length) process.exit(1);
