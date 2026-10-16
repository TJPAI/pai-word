#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const taxonomy = read('data/scene-taxonomy-v2.json');
const nodeTypes = read('data/scene500-node-types-s001-s250-v1.json');
const sourceMembership = read('data/scene500-source-membership-v1.json');

const fail = [];
const expected = new Set(Array.from({length:250}, (_,i)=>`S${String(i+1).padStart(3,'0')}`));
const seen = new Map();
for (const [type, doc] of Object.entries(nodeTypes.types || {})) {
  for (const id of doc.sceneIds || []) {
    if (!expected.has(id)) fail.push(`out-of-scope node type id: ${id}`);
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id).push(type);
  }
}
for (const id of expected) {
  const types = seen.get(id) || [];
  if (types.length === 0) fail.push(`missing primary node type: ${id}`);
  if (types.length > 1) fail.push(`multiple primary node types: ${id} -> ${types.join(',')}`);
}

const taxIds = new Set((taxonomy.scenes || []).map(x=>x.id));
for (const id of expected) if (!taxIds.has(id)) fail.push(`taxonomy missing ${id}`);

const sourceType = new Set(nodeTypes.types?.source_collection?.sceneIds || []);
const deferred = new Set(Object.keys(sourceMembership.scenes || {}));
for (const id of sourceType) if (!deferred.has(id)) fail.push(`source_collection not deferred in source-membership config: ${id}`);
for (const id of deferred) if (expected.has(id) && !sourceType.has(id)) fail.push(`deferred source scene not typed source_collection: ${id}`);

const counts = Object.fromEntries(Object.entries(nodeTypes.types || {}).map(([k,v])=>[k,(v.sceneIds||[]).length]));
const result = {
  scope: nodeTypes.scope,
  expectedScenes: expected.size,
  typedScenes: seen.size,
  counts,
  sourceCollectionScenes: sourceType.size,
  deferredSourceScenes: deferred.size,
  status: fail.length ? 'FAIL' : 'PASS',
  errors: fail
};
console.log(JSON.stringify(result, null, 2));
if (fail.length) process.exit(1);
