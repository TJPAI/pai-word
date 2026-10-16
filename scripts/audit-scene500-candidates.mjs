#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const taxonomy = read('data/scene-taxonomy-v2.json');
const linksDoc = read('data/scene-ku-links-v2.json');
const candidates = read('data/scene500-candidates-v1.json');

const scenes = taxonomy.scenes || [];
const sceneIds = new Set(scenes.map(s => s.id));
const prod = linksDoc.links || [];
const cand = candidates.links || [];
const fail = [];
const warn = [];

for (const c of cand) {
  if (!sceneIds.has(c.sceneId)) fail.push(`unknown scene ${c.sceneId}`);
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
  if (ids.size > 4) warn.push(`KU maps to ${ids.size} pilot scenes: ${kuId} -> ${[...ids].join(',')}`);
}

const sceneRows = scenes.map(s => {
  const cs = cand.filter(c => c.sceneId === s.id);
  const ps = prod.filter(c => c.sceneId === s.id);
  if (s.id <= 'S025' && cs.length > 250) warn.push(`candidate explosion: ${s.id} has ${cs.length} candidates`);
  return {
    sceneId: s.id,
    nameZh: s.nameZh,
    candidates: cs.length,
    candidateCore: cs.filter(c => c.relevance === 'core').length,
    verified: ps.filter(c => c.reviewStatus === 'verified').length,
    pendingProduction: ps.filter(c => c.reviewStatus === 'pending').length
  };
});

const pilot = sceneRows.filter(x => x.sceneId <= 'S025');
const nonEmptyPilot = pilot.filter(x => x.candidates > 0).length;
const summary = {
  taxonomyScenes: scenes.length,
  candidateLinks: cand.length,
  productionLinks: prod.length,
  verifiedLinks: prod.filter(x => x.reviewStatus === 'verified').length,
  pilotScenesSeeded: 25,
  pilotScenesWithCandidates: nonEmptyPilot,
  pilotScenesEmpty: pilot.filter(x => x.candidates === 0).map(x => x.sceneId),
  kuMultiSceneWarnings: warn.filter(x => x.startsWith('KU maps')).length,
  candidateExplosionWarnings: warn.filter(x => x.startsWith('candidate explosion')).length,
  status: fail.length ? 'FAIL' : warn.length ? 'PASS_WITH_WARNINGS' : 'PASS',
  errors: fail,
  warnings: warn
};

console.log(JSON.stringify({summary, scenes: pilot}, null, 2));
if (fail.length) process.exit(1);
