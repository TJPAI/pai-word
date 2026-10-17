#!/usr/bin/env node
import fs from 'node:fs';
import zlib from 'node:zlib';

// IMPORTANT: this generator belongs to the legacy Scene500 taxonomy whose Sxxx
// meanings differ from the current canonical 20×25 taxonomy. It must never be
// used as the production source for current Scene500 ranked membership.
if (!process.argv.includes('--legacy-taxonomy')) {
  throw new Error('Refusing to run legacy Scene500 candidate generator. Current canonical taxonomy is data/scene500-taxonomy-20x25-v1.txt. Pass --legacy-taxonomy only for explicit historical/diagnostic work.');
}

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const manifest = read('data/learning-v3/manifest.json');
const taxonomy = read('data/scene-taxonomy-v2.json');
const seedManifest = read('data/scene500-seed-manifest-v1.json');
const sourceMembership = fs.existsSync('data/scene500-source-membership-v1.json')
  ? read('data/scene500-source-membership-v1.json')
  : { scenes: {} };

function loadSeeds() {
  const merged = { policy: { minimumScore: 3 }, scenes: {} };
  for (const file of seedManifest.files || []) {
    const doc = read(file);
    if (doc.taxonomyId !== taxonomy.taxonomyId) throw new Error(`Seed taxonomy mismatch: ${file}`);
    if (doc.policy?.minimumScore != null) merged.policy.minimumScore = Math.max(merged.policy.minimumScore, doc.policy.minimumScore);
    for (const [sceneId, rule] of Object.entries(doc.scenes || {})) {
      if (merged.scenes[sceneId]) throw new Error(`Duplicate scene seed across files: ${sceneId}`);
      merged.scenes[sceneId] = rule;
    }
  }
  return merged;
}
const seeds = loadSeeds();
const deferredSourceScenes = new Set(Object.keys(sourceMembership.scenes || {}));

function unpackB64Gzip(path) {
  const txt = fs.readFileSync(path, 'utf8').trim();
  return JSON.parse(zlib.gunzipSync(Buffer.from(txt, 'base64')));
}

const catalog = unpackB64Gzip(`data/learning-v3/${manifest.catalog.file}`);
const validSceneIds = new Set((taxonomy.scenes || []).map(s => s.id));
const norm = s => String(s ?? '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
const phraseHit = (haystack, needle) => {
  const h = norm(haystack), n = norm(needle);
  if (!n) return false;
  if (/^[a-z0-9'-]+$/i.test(n)) {
    const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9'-])${escaped}($|[^a-z0-9'-])`, 'i').test(h);
  }
  return h.includes(n);
};

const candidates = [];
const byScene = {};
for (const sceneId of Object.keys(seeds.scenes || {})) {
  if (!validSceneIds.has(sceneId)) throw new Error(`Unknown scene seed: ${sceneId}`);
  byScene[sceneId] = 0;
}
for (const sceneId of deferredSourceScenes) {
  if (!validSceneIds.has(sceneId)) throw new Error(`Unknown source-membership scene: ${sceneId}`);
}

for (const row of catalog) {
  const [rank, word, wordPos, kus] = row;
  for (const ku of kus || []) {
    const [kuId, oldScene, kuType, kuTitle, kuPos, meaning] = ku;
    const senseEnText = [kuTitle, kuType, kuPos].filter(Boolean).join(' | ');
    const senseZhText = [meaning, kuTitle].filter(Boolean).join(' | ');
    for (const [sceneId, rule] of Object.entries(seeds.scenes || {})) {
      if (deferredSourceScenes.has(sceneId)) continue;
      const enHits = (rule.senseEn || []).filter(k => phraseHit(senseEnText, k));
      const zhHits = (rule.senseZh || []).filter(k => phraseHit(senseZhText, k));
      const headwordHit = (rule.headwords || []).some(k => norm(word) === norm(k));
      if (!enHits.length && !zhHits.length) continue;
      let score = enHits.length * 2 + zhHits.length * 3 + (headwordHit ? 1 : 0);
      if (rank <= 3000) score += 1;
      if (score < (seeds.policy?.minimumScore ?? 3)) continue;
      const confidence = Math.min(0.90, Number((0.54 + Math.min(score, 7) * 0.05).toFixed(2)));
      const relevance = score >= 6 ? 'core' : 'extended';
      const evidence = [
        enHits.length ? `senseEn:${enHits.join(',')}` : null,
        zhHits.length ? `senseZh:${zhHits.join(',')}` : null,
        headwordHit ? `headword-support:${word}` : null,
        kuTitle ? `kuTitle=${kuTitle}` : null,
        meaning ? `meaning=${meaning}` : null,
        oldScene ? `legacyScene=${oldScene}` : null
      ].filter(Boolean).join('; ');
      candidates.push({kuId,sceneId,relevance,confidence,source:'generated_candidate',evidence,reviewStatus:'pending',meta:{rank,word,kuType,oldScene,score}});
      byScene[sceneId]++;
    }
  }
}

const dedup = new Map();
for (const c of candidates) {
  const key = `${c.kuId}::${c.sceneId}`;
  const old = dedup.get(key);
  if (!old || c.confidence > old.confidence) dedup.set(key, c);
}
const links = [...dedup.values()].sort((a,b) => a.sceneId.localeCompare(b.sceneId) || a.meta.rank - b.meta.rank || a.kuId.localeCompare(b.kuId));
const out = {
  schemaVersion: 4,
  taxonomyId: taxonomy.taxonomyId,
  sourceCatalogRelease: manifest.release,
  seedFiles: seedManifest.files,
  sourceMembershipFile: fs.existsSync('data/scene500-source-membership-v1.json') ? 'data/scene500-source-membership-v1.json' : null,
  status: 'legacy_generated_candidates_pending_review',
  policy: {
    autoVerified: 0,
    productionEligible: false,
    legacyTaxonomyOnly: true,
    currentCanonicalTaxonomy: 'data/scene500-taxonomy-20x25-v1.txt',
    senseEvidenceRequired: true,
    headwordOnlyForbidden: true,
    sourceMembershipScenesExcludedFromSemanticMatching: true,
    note: 'LEGACY ONLY. Do not use these links as current Scene500 production membership.'
  },
  summary: {
    wordCount: manifest.wordCount,
    kuCount: manifest.kuCount,
    seededScenes: Object.keys(seeds.scenes || {}).length,
    semanticCandidateScenes: Object.keys(seeds.scenes || {}).filter(id => !deferredSourceScenes.has(id)).length,
    deferredSourceScenes: [...deferredSourceScenes].sort(),
    candidateLinks: links.length,
    candidatesByScene: byScene
  },
  links
};
fs.writeFileSync('data/scene500-candidates-v1.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary, null, 2));
