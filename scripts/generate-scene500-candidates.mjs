#!/usr/bin/env node
import fs from 'node:fs';
import zlib from 'node:zlib';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const manifest = read('data/learning-v3/manifest.json');
const taxonomy = read('data/scene-taxonomy-v2.json');
const seeds = read('data/scene500-seeds-v1.json');

function unpackB64Gzip(path) {
  const txt = fs.readFileSync(path, 'utf8').trim();
  return JSON.parse(zlib.gunzipSync(Buffer.from(txt, 'base64')));
}

const catalog = unpackB64Gzip(`data/learning-v3/${manifest.catalog.file}`);
const validSceneIds = new Set((taxonomy.scenes || []).map(s => s.id));
const norm = s => String(s ?? '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
const tokenHit = (haystack, needle) => {
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

for (const row of catalog) {
  const [rank, word, wordPos, kus] = row;
  for (const ku of kus || []) {
    const [kuId, oldScene, kuType, kuTitle, kuPos, meaning] = ku;
    const enText = [word, kuTitle, kuType, kuPos, wordPos].filter(Boolean).join(' | ');
    const zhText = [meaning, kuTitle].filter(Boolean).join(' | ');
    for (const [sceneId, rule] of Object.entries(seeds.scenes || {})) {
      const enHits = (rule.includeEn || []).filter(k => tokenHit(enText, k));
      const zhHits = (rule.includeZh || []).filter(k => tokenHit(zhText, k));
      if (!enHits.length && !zhHits.length) continue;
      const hitCount = enHits.length + zhHits.length;
      const confidence = Math.min(0.88, Number((0.58 + Math.min(hitCount, 3) * 0.08 + (rank <= 3000 ? 0.04 : 0)).toFixed(2)));
      const evidence = [
        `seed-hit:${[...enHits, ...zhHits].join(',')}`,
        `word=${word}`,
        kuTitle ? `kuTitle=${kuTitle}` : null,
        meaning ? `meaning=${meaning}` : null,
        oldScene ? `legacyScene=${oldScene}` : null
      ].filter(Boolean).join('; ');
      candidates.push({
        kuId,
        sceneId,
        relevance: hitCount >= 2 ? 'core' : 'extended',
        confidence,
        source: 'generated_candidate',
        evidence,
        reviewStatus: 'pending',
        meta: { rank, word, kuType, oldScene }
      });
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
  schemaVersion: 1,
  taxonomyId: taxonomy.taxonomyId,
  sourceCatalogRelease: manifest.release,
  status: 'generated_candidates_pending_review',
  policy: {
    autoVerified: 0,
    productionEligible: false,
    note: 'Heuristic seed matching only. Every link requires sense-level editorial/dictionary/corpus review before promotion.'
  },
  summary: {
    wordCount: manifest.wordCount,
    kuCount: manifest.kuCount,
    seededScenes: Object.keys(seeds.scenes || {}).length,
    candidateLinks: links.length,
    candidatesByScene: byScene
  },
  links
};
fs.writeFileSync('data/scene500-candidates-v1.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary, null, 2));
