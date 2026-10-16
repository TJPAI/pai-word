#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const composed = read('data/scene500-composed-scenes-v1.json');
const doc = read('data/scene500-composed-ku-candidates-v1.json');

const fail = [];
const warn = [];
const sceneIds = new Set((composed.scenes || []).map(x => x.id));
const links = doc.links || [];
const keys = new Set();
const perScene = new Map();

for (const link of links) {
  if (!sceneIds.has(link.composedSceneId)) fail.push(`unknown composedSceneId ${link.composedSceneId}`);
  if (!link.kuId) fail.push(`missing kuId in ${link.composedSceneId}`);
  if (link.source !== 'generated_composition_candidate') fail.push(`invalid source ${link.composedSceneId}/${link.kuId}`);
  if (link.reviewStatus !== 'pending') fail.push(`composition candidate must remain pending ${link.composedSceneId}/${link.kuId}`);
  if (link.supportCount < 1) fail.push(`missing support ${link.composedSceneId}/${link.kuId}`);
  if (link.strongSupportCount < 1) fail.push(`function/cognitive-only candidate forbidden ${link.composedSceneId}/${link.kuId}`);
  const key = `${link.composedSceneId}::${link.kuId}`;
  if (keys.has(key)) fail.push(`duplicate composed candidate ${key}`);
  keys.add(key);
  perScene.set(link.composedSceneId, (perScene.get(link.composedSceneId) || 0) + 1);
}

for (const scene of composed.scenes || []) {
  const n = perScene.get(scene.id) || 0;
  if (n > 300) warn.push(`candidate explosion: ${scene.id} has ${n} candidates`);
}

const empty = (composed.scenes || []).filter(s => !perScene.get(s.id)).map(s => s.id);
const result = {
  composedScenes: (composed.scenes || []).length,
  candidateLinks: links.length,
  scenesWithCandidates: (composed.scenes || []).length - empty.length,
  emptyScenes: empty,
  candidateExplosionWarnings: warn.length,
  status: fail.length ? 'FAIL' : warn.length ? 'PASS_WITH_WARNINGS' : 'PASS',
  errors: fail,
  warnings: warn
};
console.log(JSON.stringify(result, null, 2));
if (fail.length) process.exit(1);
