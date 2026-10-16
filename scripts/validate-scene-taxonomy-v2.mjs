#!/usr/bin/env node
import fs from 'node:fs';

const taxonomyPath = new URL('../data/scene-taxonomy-v2.json', import.meta.url);
const linksPath = new URL('../data/scene-ku-links-v2.json', import.meta.url);
const tax = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
const linkDoc = JSON.parse(fs.readFileSync(linksPath, 'utf8'));

const fail = [];
const scenes = tax.scenes || [];
const cats = tax.categories || [];
if (scenes.length !== 500) fail.push(`scene count ${scenes.length} != 500`);
if (cats.length !== 20) fail.push(`category count ${cats.length} != 20`);
const ids = scenes.map(x => x.id);
if (new Set(ids).size !== ids.length) fail.push('duplicate scene id');
const names = scenes.map(x => x.nameZh);
if (new Set(names).size !== names.length) fail.push('duplicate scene name');
for (let i = 0; i < 500; i++) {
  const expected = `S${String(i + 1).padStart(3, '0')}`;
  if (scenes[i]?.id !== expected) fail.push(`scene order/id mismatch at ${i + 1}`);
}
for (const c of cats) {
  const count = scenes.filter(s => s.categoryId === c.id).length;
  if (count !== 25) fail.push(`${c.id} has ${count} scenes, expected 25`);
}
const validDims = ['theme', 'place', 'task', 'function'];
for (const s of scenes) {
  if (!s.facets || validDims.some(d => !Array.isArray(s.facets[d]))) fail.push(`${s.id} invalid facets`);
}
for (const l of linkDoc.links || []) {
  if (!l.kuId || !l.sceneId) fail.push('link missing kuId/sceneId');
  if (!ids.includes(l.sceneId)) fail.push(`unknown scene ${l.sceneId}`);
  if ('word' in l || 'headword' in l) fail.push(`word-level mapping forbidden: ${l.sceneId}`);
  if (!['core','extended'].includes(l.relevance)) fail.push(`invalid relevance: ${l.sceneId}`);
  if (!['dictionary_verified','corpus_verified','editorial_verified','generated_candidate'].includes(l.source)) fail.push(`invalid source: ${l.sceneId}`);
  if (!['verified','pending','rejected'].includes(l.reviewStatus)) fail.push(`invalid reviewStatus: ${l.sceneId}`);
  if (l.reviewStatus === 'verified' && l.source === 'generated_candidate') fail.push(`generated candidate cannot be verified directly: ${l.kuId}/${l.sceneId}`);
}
const result = {
  taxonomyId: tax.taxonomyId,
  categories: cats.length,
  scenes: scenes.length,
  links: (linkDoc.links || []).length,
  mappingUnit: 'KU',
  dimensions: validDims,
  status: fail.length ? 'FAIL' : 'PASS',
  errors: fail
};
console.log(JSON.stringify(result, null, 2));
if (fail.length) process.exit(1);
