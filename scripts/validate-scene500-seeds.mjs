#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const taxonomy = read('data/scene-taxonomy-v2.json');
const manifest = read('data/scene500-seed-manifest-v1.json');
const validIds = new Set((taxonomy.scenes || []).map(s => s.id));
const seen = new Map();
const fail = [];

for (const file of manifest.files || []) {
  const doc = read(file);
  if (doc.taxonomyId !== taxonomy.taxonomyId) fail.push(`${file}: taxonomyId mismatch`);
  if (doc.policy?.autoVerify !== false) fail.push(`${file}: autoVerify must be false`);
  if (doc.policy?.matchingUnit !== 'KU') fail.push(`${file}: matchingUnit must be KU`);
  if (doc.policy?.headwordOnlyForbidden !== true) fail.push(`${file}: headwordOnlyForbidden must be true`);
  for (const [sceneId, rule] of Object.entries(doc.scenes || {})) {
    if (!validIds.has(sceneId)) fail.push(`${file}: unknown ${sceneId}`);
    if (seen.has(sceneId)) fail.push(`${sceneId}: duplicate in ${seen.get(sceneId)} and ${file}`);
    seen.set(sceneId, file);
    if (!Array.isArray(rule.senseEn) || !Array.isArray(rule.senseZh) || !Array.isArray(rule.headwords)) {
      fail.push(`${file}: ${sceneId} invalid rule arrays`);
    }
  }
}

const phase1Ids = Array.from({length:250}, (_,i) => `S${String(i+1).padStart(3,'0')}`);
const missingPhase1 = phase1Ids.filter(id => !seen.has(id));
const unexpectedBeyondPhase1 = [...seen.keys()].filter(id => id > 'S250');
if (missingPhase1.length) fail.push(`missing phase1 scenes: ${missingPhase1.join(',')}`);
if (unexpectedBeyondPhase1.length) fail.push(`phase1 manifest unexpectedly seeds >S250: ${unexpectedBeyondPhase1.join(',')}`);

const byCategory = {};
for (const id of seen.keys()) {
  const n = Number(id.slice(1));
  const cat = `C${String(Math.ceil(n/25)).padStart(2,'0')}`;
  byCategory[cat] = (byCategory[cat] || 0) + 1;
}

const summary = {
  seedFiles: (manifest.files || []).length,
  seededScenes: seen.size,
  expectedPhase1Scenes: 250,
  missingPhase1,
  byCategory,
  status: fail.length ? 'FAIL' : 'PASS',
  errors: fail
};
console.log(JSON.stringify(summary, null, 2));
if (fail.length) process.exit(1);
