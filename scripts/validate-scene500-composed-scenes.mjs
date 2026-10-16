#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const taxonomy = read('data/scene-taxonomy-v2.json');
const composed = read('data/scene500-composed-scenes-v1.json');
const sourceMembership = read('data/scene500-source-membership-v1.json');

const fail = [];
const warn = [];
const scenes = composed.scenes || [];
const groups = composed.groups || [];
const taxIds = new Set((taxonomy.scenes || []).map(x => x.id));
const sourceCollectionIds = new Set(Object.keys(sourceMembership.scenes || {}));

if (composed.taxonomyId !== taxonomy.taxonomyId) fail.push('taxonomyId mismatch');
if (scenes.length !== 120) fail.push(`expected 120 composed scenes, got ${scenes.length}`);
if (groups.length !== 12) fail.push(`expected 12 groups, got ${groups.length}`);

const sceneIds = scenes.map(x => x.id);
if (new Set(sceneIds).size !== sceneIds.length) fail.push('duplicate composed scene ids');
for (let i = 1; i <= 120; i++) {
  const id = `CS${String(i).padStart(3, '0')}`;
  if (!sceneIds.includes(id)) fail.push(`missing composed scene ${id}`);
}

const groupIds = new Set(groups.map(g => g.id));
for (const g of groups) {
  const rows = scenes.filter(s => s.groupId === g.id);
  if (rows.length !== 10) fail.push(`${g.id} expected 10 scenes, got ${rows.length}`);
}

const usage = new Map();
for (const s of scenes) {
  if (!groupIds.has(s.groupId)) fail.push(`${s.id} unknown group ${s.groupId}`);
  if (!s.nameZh) fail.push(`${s.id} missing nameZh`);
  if (![1,2,3].includes(s.priority)) fail.push(`${s.id} invalid priority ${s.priority}`);
  if (!Array.isArray(s.sourceNodeIds) || s.sourceNodeIds.length < 2) fail.push(`${s.id} requires >=2 sourceNodeIds`);
  if (new Set(s.sourceNodeIds || []).size !== (s.sourceNodeIds || []).length) fail.push(`${s.id} duplicate sourceNodeIds`);
  for (const id of s.sourceNodeIds || []) {
    if (!taxIds.has(id)) fail.push(`${s.id} references unknown source node ${id}`);
    if (sourceCollectionIds.has(id)) fail.push(`${s.id} must not compose source_collection node ${id}`);
    usage.set(id, (usage.get(id) || 0) + 1);
  }
}

for (const [id, n] of usage) if (n > 8) warn.push(`${id} reused in ${n} composed scenes`);

const priorityCounts = {
  p1: scenes.filter(x => x.priority === 1).length,
  p2: scenes.filter(x => x.priority === 2).length,
  p3: scenes.filter(x => x.priority === 3).length
};

const result = {
  composedScenes: scenes.length,
  groups: groups.length,
  uniqueSourceNodesUsed: usage.size,
  priorityCounts,
  sourceCollectionNodesExcluded: sourceCollectionIds.size,
  status: fail.length ? 'FAIL' : warn.length ? 'PASS_WITH_WARNINGS' : 'PASS',
  errors: fail,
  warnings: warn
};

console.log(JSON.stringify(result, null, 2));
if (fail.length) process.exit(1);
