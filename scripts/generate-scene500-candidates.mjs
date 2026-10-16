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

for (const row of catalog) {
  const [rank, word, wordPos, kus] = row;
  for (const ku of kus || []) {
    const [kuId, oldScene, kuType, kuTitle, kuPos, meaning] = ku;
    const senseEnText = [kuTitle, kuType, kuPos].filter(Boolean).join(' | ');
    const senseZhText = [meaning, kuTitle].filter(Boolean).join(' | ');
    for (const [sceneId, rule] of Object.entries(seeds.scenes || {})) {
      const enHits = (rule.senseEn || []).filter(k => phraseHit(senseEnText, k));
      const zhHits = (rule.senseZh || []).filter(k => phraseHit(senseZhText, k));
      const headwordHit = (rule.headwords || []).some(k => norm(word) === norm(k));

      // Sense evidence is mandatory. A headword match only strengthens an existing sense hit.
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
      candidates.push({
        kuId,
        sceneId,
        relevance,
        confidence,
        source: 'generated_candidate',
        evidence,
        reviewStatus: 'pending',
        meta: { rank, word, kuType, oldScene, score }
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
  schemaVersion: 2,
  taxonomyId: taxonomy.taxonomyId,
  sourceCatalogRelease: manifest.release,
  status: 'generated_candidates_pending_review',
  policy: {
    autoVerified: 0,
    productionEligible: false,
    senseEvidenceRequired: true,
    headwordOnlyForbidden: true,
    note: 'Heuristic sense-first matching only. Every link requires editorial/dictionary/corpus review before promotion.'
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
