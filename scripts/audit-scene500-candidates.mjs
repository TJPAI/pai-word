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

for (const c of cand) {
  if (!sceneIds.has(c.sceneId)) fail.push(`unknown scene ${c.sceneId}`);
  if (!c.kuId) fail.push(`missing kuId for ${c.sceneId}`);
  if (c.source !== 'generated_candidate') fail.push(`candidate source must remain generated_candidate: ${c.kuId}/${c.sceneId}`);
  if (c.reviewStatus !== 'pending') fail.push(`candidate reviewStatus must remain pending: ${c.kuId}/${c.sceneId}`);
}
const duplicateKeys = cand.map(c => `${c.kuId}::${c.sceneId}`);
if (new Set(duplicateKeys).size !== duplicateKeys.length) fail.push('duplicate KU-scene candidate links');

const sceneRows = scenes.map(s => {
  const cs = cand.filter(c => c.sceneId === s.id);
  const ps = prod.filter(c => c.sceneId === s.id);
  return {
    sceneId: s.id,
    nameZh: s.nameZh,
    candidates: cs.length,
    candidateCore: cs.filter(c => c.relevance === 'core').length,
    verified: ps.filter(c => c.reviewStatus === 'verified').length,
    pendingProduction: ps.filter(c => c.reviewStatus === 'pending').length
  };
});

const nonEmptyPilot = sceneRows.filter(x => x.sceneId <= 'S025' && x.candidates > 0).length;
const summary = {
  taxonomyScenes: scenes.length,
  candidateLinks: cand.length,
  productionLinks: prod.length,
  verifiedLinks: prod.filter(x => x.reviewStatus === 'verified').length,
  pilotScenesSeeded: 25,
  pilotScenesWithCandidates: nonEmptyPilot,
  pilotScenesEmpty: sceneRows.filter(x => x.sceneId <= 'S025' && x.candidates === 0).map(x => x.sceneId),
  status: fail.length ? 'FAIL' : 'PASS',
  errors: fail
};

console.log(JSON.stringify({summary, scenes: sceneRows.filter(x => x.sceneId <= 'S025')}, null, 2));
if (fail.length) process.exit(1);
