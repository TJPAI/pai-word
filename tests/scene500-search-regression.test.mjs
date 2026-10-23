// Scene500 deterministic engine regression tests.
// Run: node --test tests/scene500-search-regression.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createScene500Recommender } from '../scene500-recommendation/engine.mjs';

const catalog = JSON.parse(readFileSync(new URL('../scene500-recommendation/catalog-v0.2.json', import.meta.url), 'utf8'));
const engine = createScene500Recommender({ catalog });
const ids = (query, options) => engine.search(query, options).results.map(r => r.sceneId);

test('catalog has 500 stable, valid scene identities', () => {
  assert.equal(catalog.scene_count, 500);
  assert.equal(Object.keys(catalog.scenes).length, 500);
  assert.ok(catalog.scenes.S001);
  assert.ok(catalog.scenes.S500);
});

test('explicit daily-life activity retrieves the expected scene', () => {
  assert.ok(ids('我今天早上要起床并整理床铺').includes('S001'));
  assert.ok(ids('我现在要刷牙和洗脸').includes('S002'));
  assert.ok(ids('洗衣服和晾衣服').includes('S006'));
});

test('a changed query does not reuse previous recommendation state', () => {
  const a = ids('洗脸刷牙');
  const b = ids('洗衣服和晾衣服');
  assert.ok(a.includes('S002'));
  assert.ok(b.includes('S006'));
  assert.notDeepEqual(a, b);
  assert.deepEqual(ids('洗脸刷牙'), a);
});

test('empty and unmatched requests are never padded to quota', () => {
  assert.deepEqual(ids(''), []);
  assert.deepEqual(ids('  ，。！  '), []);
  assert.deepEqual(ids('zzzxxyyqqq'), []);
});

test('ordering and top K are deterministic', () => {
  const first = engine.search('起床和晨间准备', {limit: 5});
  const again = engine.search('起床和晨间准备', {limit: 5});
  assert.deepEqual(first.results, again.results);
  assert.ok(first.results.length <= 5);
  for (let i = 1; i < first.results.length; i++) {
    assert.ok(first.results[i - 1].score >= first.results[i].score);
  }
});

test('candidate eligibility and semantic relevance are separable', () => {
  const all = ids('刷牙洗脸');
  assert.ok(all.includes('S002'));
  const unavailable = ids('刷牙洗脸', {eligibleSceneIds: []});
  assert.deepEqual(unavailable, []);
  assert.ok(ids('刷牙洗脸', {eligibleSceneIds: ['S002']}).includes('S002'));
});

test('subject-only queries are not fabricated as dedicated scenes', () => {
  for (const query of ['哲学', '量子物理']) {
    const result = engine.search(query, {limit: 10});
    assert.ok(result.results.length <= 10);
    for (const row of result.results) {
      assert.ok(catalog.scenes[row.sceneId], 'returned scene must exist');
      assert.ok(row.score >= 3, 'result must meet semantic score threshold');
    }
  }
});
