#!/usr/bin/env node
// Produce a COMPLETE, source-exact, non-certified 27-KU/57-sound handoff from the
// original Kaikki candidate JSONL and pinned, independently sourced KU contexts.
// Never select a "best" IPA or modify frozen dictionaries, learning state or runtime.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const [resultDir,contextFile] = process.argv.slice(2);
if (!resultDir || !contextFile) throw Error('Usage: node build-native27-sound-handoff.mjs <results-dir> <pinned-context.json>');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const readJsonl = file => fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const normalized = s => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const queueFile = path.join(resultDir, 'qa-queues/native_phrase.jsonl');
const candidateFile = path.join(resultDir, 'ipa-candidates.jsonl');
const queue = readJsonl(queueFile);
const all = readJsonl(candidateFile);
const context = readJson(contextFile);
assert.equal(queue.length, 27, 'native phrase KU invariant');
assert.equal(context.records.length, 24, 'author-context phrase invariant');
assert.equal(new Set(queue.map(r => r.scene_ku_id)).size, 27, 'duplicate native KU');
const ctxByKu = new Map();
for (const entry of context.records) for (const ku of entry.ku_records) {
  assert(!ctxByKu.has(ku.scene_ku_id), 'duplicate context KU');
  assert.equal(normalized(ku.expression), normalized(entry.expression));
  ctxByKu.set(ku.scene_ku_id, ku);
}
assert.equal(ctxByKu.size, 27, 'context KU count');
const matched = new Map(queue.map(q => [q.scene_ku_id, []]));
for (const row of all) {
  if (!matched.has(row.id)) continue;
  assert.notEqual(row.status, 'NOT_FOUND');
  assert.equal(row.pronunciation_scope, 'phrase');
  assert.equal(row.release_allowed, false);
  assert.equal(row.qa_pass, false);
  assert.equal(row.master_approved, false);
  assert.equal(row.muse_certified, false);
  assert(Number.isInteger(row.source_line) && row.source_line > 0);
  assert(Number.isInteger(row.sound_index) && row.sound_index >= 0);
  assert(['us', 'uk', 'both', 'other', 'generic'].includes(row.region));
  assert(Array.isArray(row.source_tags));
  matched.get(row.id).push(row);
}
let total = 0;
const rows = [];
for (const q of queue) {
  const ctx = ctxByKu.get(q.scene_ku_id);
  assert(ctx, 'context identity missing');
  assert.equal(q.scene_id, ctx.scene_id);
  assert.equal(q.source_sense_id, ctx.source_sense_id);
  assert.equal(q.source_qa_blob, ctx.source_qa_shard_blob);
  assert.equal(q.source_pack_blob, ctx.source_author_pack_blob);
  assert.equal(normalized(q.expression), normalized(ctx.expression));
  const candidates = matched.get(q.scene_ku_id);
  assert.equal(candidates.length, q.candidate_count, 'source count mismatch');
  assert.deepEqual([...new Set(candidates.map(r => r.ipa))].sort(), [...q.source_ipa_variants].sort(), 'source candidate mismatch');
  assert.deepEqual([...new Set(candidates.map(r => r.source_line))].sort((a,b)=>a-b), [...q.source_line_refs].sort((a,b)=>a-b), 'source line mismatch');
  const soundIds = new Set();
  for (const c of candidates) {
    assert.equal(normalized(c.expression), normalized(ctx.expression));
    assert.equal(normalized(c.entry_word), normalized(ctx.expression));
    assert.equal(c.scene_id, ctx.scene_id);
    assert.equal(c.source_sense_id, ctx.source_sense_id);
    assert.equal(c.source_qa_blob, ctx.source_qa_shard_blob);
    assert.equal(c.source_pack_blob, ctx.source_author_pack_blob);
    const key = [c.source_line,c.sound_index,c.ipa,c.part_of_speech].join('|');
    assert(!soundIds.has(key), 'duplicate sound evidence');
    soundIds.add(key);
  }
  total += candidates.length;
  rows.push({
    scene_ku_id:ctx.scene_ku_id,scene_id:ctx.scene_id,source_sense_id:ctx.source_sense_id,
    expression:ctx.expression,source_rank:ctx.source_rank,
    answer_meaning_zh:ctx.answer_meaning_zh,example_en:ctx.example_en,example_zh:ctx.example_zh,
    source_qa_shard_blob:ctx.source_qa_shard_blob,source_author_pack_blob:ctx.source_author_pack_blob,
    candidate_count:candidates.length,
    raw_source_candidates:candidates.map(c=>({
      ipa:c.ipa,ipa_us:c.ipa_us,ipa_uk:c.ipa_uk,ipa_generic:c.ipa_generic,
      entry_word:c.entry_word,part_of_speech:c.part_of_speech,source_line:c.source_line,
      sound_index:c.sound_index,source_tags:c.source_tags,region:c.region,
      other_regional_tags:c.other_regional_tags,pronunciation_scope:c.pronunciation_scope
    })),
    pronunciation_status:'ORIGINAL_SOURCE_CANDIDATE_NOT_CERTIFIED',
    independent_ipa_qa_pass:false,muse_ipa_pass:false,master_approved:false,release_allowed:false
  });
}
assert.equal(total, 57, '57 original source sounds invariant');
assert.equal(new Set(rows.map(r => normalized(r.expression))).size, 24);
const document = {
  schema:'cg-enlex-native27-57-real-sound-context-handoff-v1',
  provenance:{
    original_source:'GitHub Actions isolated Kaikki IPA candidate extraction',
    original_candidate_sha256:sha256(candidateFile),
    native_phrase_queue_sha256:sha256(queueFile),
    pinned_enteach_context_git_blob:'d41476ad003238e1534f75947c867e868b57533a',
    downloaded_context_sha256:sha256(contextFile)
  },
  scope:{unique_ku:27,unique_expressions:24,raw_sound_candidates:57},
  release_policy:'candidate-only; source staging teaching QA is NOT pronunciation approval',
  rows,
  approvals:{cg_qa_ipa_pass:0,muse_ipa_pass:0,master_pass:0,release_allowed:false}
};
const output = path.join(resultDir,'qa-queues/native27-exact-sound-context-handoff.json');
fs.writeFileSync(output, JSON.stringify(document,null,2)+'\n');
console.log(JSON.stringify({status:'PASS_SOURCE_ONLY',output,scope:document.scope,sha256:sha256(output),all_release_blocked:rows.every(r=>!r.release_allowed)}));
