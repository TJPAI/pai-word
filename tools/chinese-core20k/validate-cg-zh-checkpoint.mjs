#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const rootJoin = p => path.join(root, p);
const checkpointPath = 'tools/chinese-core20k/CG_ZH_CHECKPOINT.json';
const checkpoint = JSON.parse(fs.readFileSync(rootJoin(checkpointPath), 'utf8'));
const fatal = msg => { throw new Error('CG-ZH checkpoint: ' + msg); };
const gitBlobSha = bytes => crypto.createHash('sha1')
  .update(Buffer.from('blob ' + bytes.length + '\0'))
  .update(bytes).digest('hex');
if (checkpoint.owner !== 'CG-ZH') fatal('wrong owner');
if (checkpoint.source_of_truth?.term_count !== 20000) fatal('frozen 20K count mismatch');
if (!/^[0-9a-f]{64}$/.test(checkpoint.source_of_truth?.runtime_sha256 ?? '')) fatal('runtime sha256 missing');
if (!Array.isArray(checkpoint.verified_artifacts) || checkpoint.verified_artifacts.length < 2) fatal('missing source pins');
for (const a of checkpoint.verified_artifacts) {
  if (!a.path.startsWith('tools/chinese-core20k/')) fatal('source path out of scope');
  const bytes = fs.readFileSync(rootJoin(a.path));
  if (gitBlobSha(bytes) !== a.blob_sha) fatal('source git blob mismatch: ' + a.path);
}
const reviewed = JSON.parse(fs.readFileSync(rootJoin(checkpoint.verified_artifacts[0].path), 'utf8')).entries;
const triage = JSON.parse(fs.readFileSync(rootJoin(checkpoint.verified_artifacts[1].path), 'utf8')).rows;
if (reviewed.length !== 60 || triage.length !== 200) fatal('unexpected entry counts');
const identity = new Map(triage.map(x => [x.term_id, x]));
if (identity.size !== 200) fatal('duplicate source term IDs');
const seen = new Set();
for (const x of reviewed) {
  const src = identity.get(x.term_id);
  if (!src || src.term !== x.term || src.runtime_index !== x.runtime_index) fatal('record ID mismatch: ' + x.term);
  if (seen.has(x.term_id)) fatal('duplicate review term ID: ' + x.term);
  seen.add(x.term_id);
  if (x.production_ready !== false) fatal('uncertified item marked production ready: ' + x.term);
}
if (checkpoint.verified_artifacts[0].entry_count !== reviewed.length) fatal('review count in checkpoint inconsistent');
if (checkpoint.verified_artifacts[1].entry_count !== triage.length) fatal('triage count in checkpoint inconsistent');
process.stdout.write('CG-ZH checkpoint verified: ' + reviewed.length + ' staged reviews / ' + triage.length + ' source records; all source pins and identities match.\n');
