#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const taxonomy = read('data/scene-taxonomy-v2.json');
const nodeTypeDocs = [
  read('data/scene500-node-types-s001-s250-v1.json'),
  read('data/scene500-node-types-s251-s500-v1.json')
];
const sourceMembership = read('data/scene500-source-membership-v1.json');

const fail = [];
const expected = new Set(Array.from({length:500}, (_,i)=>`S${String(i+1).padStart(3,'0')}`));
const seen = new Map();
const counts = {};
for (const nodeTypes of nodeTypeDocs) {
  if (nodeTypes.taxonomyId !== taxonomy.taxonomyId) fail.push(`taxonomy mismatch in ${nodeTypes.scope}`);
  for (const [type, doc] of Object.entries(nodeTypes.types || {})) {
    counts[type] = (counts[type] || 0) + (doc.sceneIds || []).length;
    for (const id of doc.sceneIds || []) {
      if (!expected.has(id)) fail.push(`out-of-scope node type id: ${id}`);
      if (!seen.has(id)) seen.set(id, []);
      seen.get(id).push(type);
    }
  }
}
for (const id of expected) {
  const types = seen.get(id) || [];
  if (types.length === 0) fail.push(`missing primary node type: ${id}`);
  if (types.length > 1) fail.push(`multiple primary node types: ${id} -> ${types.join(',')}`);
}

const taxIds = new Set((taxonomy.scenes || []).map(x=>x.id));
for (const id of expected) if (!taxIds.has(id)) fail.push(`taxonomy missing ${id}`);

const typedAs = type => new Set([...seen.entries()].filter(([,types])=>types.includes(type)).map(([id])=>id));
const sourceType = typedAs('source_collection');
const deferred = new Set(Object.keys(sourceMembership.scenes || {}));
for (const id of sourceType) if (!deferred.has(id)) fail.push(`source_collection not deferred in source-membership config: ${id}`);
for (const id of deferred) if (!sourceType.has(id)) fail.push(`deferred source scene not typed source_collection: ${id}`);

for (let n=426;n<=450;n++) {
  const id=`S${String(n).padStart(3,'0')}`;
  if (!(seen.get(id)||[]).includes('function')) fail.push(`C18 expected function node: ${id}`);
}
for (let n=476;n<=500;n++) {
  const id=`S${String(n).padStart(3,'0')}`;
  if (!(seen.get(id)||[]).includes('cognitive_facet')) fail.push(`C20 expected cognitive_facet node: ${id}`);
}

const result = {
  scope: 'S001-S500',
  expectedScenes: expected.size,
  typedScenes: seen.size,
  counts,
  sourceCollectionScenes: sourceType.size,
  deferredSourceScenes: deferred.size,
  c18FunctionScenes: Array.from({length:25},(_,i)=>`S${String(426+i).padStart(3,'0')}`).filter(id=>(seen.get(id)||[]).includes('function')).length,
  c20CognitiveScenes: Array.from({length:25},(_,i)=>`S${String(476+i).padStart(3,'0')}`).filter(id=>(seen.get(id)||[]).includes('cognitive_facet')).length,
  status: fail.length ? 'FAIL' : 'PASS',
  errors: fail
};
console.log(JSON.stringify(result, null, 2));
if (fail.length) process.exit(1);
