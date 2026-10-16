#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const composed = read('data/scene500-composed-scenes-v1.json');
const candidates = read('data/scene500-candidates-v1.json');
const typeDocs = [
  read('data/scene500-node-types-s001-s250-v1.json'),
  read('data/scene500-node-types-s251-s500-v1.json')
];

const nodeType = new Map();
for (const doc of typeDocs) {
  for (const [type, spec] of Object.entries(doc.types || {})) {
    for (const id of spec.sceneIds || []) {
      if (nodeType.has(id)) throw new Error(`duplicate node type for ${id}`);
      nodeType.set(id, type);
    }
  }
}

const weights = {
  semantic_scene: 1.00,
  theme: 0.85,
  place: 0.60,
  task: 0.90,
  function: 0.70,
  cognitive_facet: 0.60,
  source_collection: 0
};
const strongTypes = new Set(['semantic_scene','theme','task']);

const sourceLinks = candidates.links || [];
const byScene = new Map();
for (const link of sourceLinks) {
  if (!byScene.has(link.sceneId)) byScene.set(link.sceneId, []);
  byScene.get(link.sceneId).push(link);
}

const outLinks = [];
for (const surface of composed.scenes || []) {
  const perKu = new Map();
  for (const sourceNodeId of surface.sourceNodeIds || []) {
    const type = nodeType.get(sourceNodeId);
    if (!type) throw new Error(`missing node type for ${sourceNodeId}`);
    if (type === 'source_collection') throw new Error(`source collection cannot compose into ${surface.id}: ${sourceNodeId}`);
    for (const link of byScene.get(sourceNodeId) || []) {
      const row = perKu.get(link.kuId) || { kuId: link.kuId, supports: [], weightedScore: 0, maxConfidence: 0, strongSupport: 0 };
      const w = weights[type] ?? 0;
      row.supports.push({ sourceNodeId, nodeType: type, confidence: link.confidence, relevance: link.relevance });
      row.weightedScore += Number(link.confidence || 0) * w;
      row.maxConfidence = Math.max(row.maxConfidence, Number(link.confidence || 0));
      if (strongTypes.has(type)) row.strongSupport++;
      perKu.set(link.kuId, row);
    }
  }

  for (const row of perKu.values()) {
    const supportCount = row.supports.length;
    const passes =
      (supportCount >= 2 && row.strongSupport >= 1) ||
      (row.strongSupport >= 1 && row.maxConfidence >= 0.84 && row.weightedScore >= 0.72);
    if (!passes) continue;
    const normalized = Math.min(0.94, Number((row.weightedScore / Math.max(1, supportCount)).toFixed(2)));
    outLinks.push({
      composedSceneId: surface.id,
      kuId: row.kuId,
      confidence: normalized,
      supportCount,
      strongSupportCount: row.strongSupport,
      source: 'generated_composition_candidate',
      reviewStatus: 'pending',
      evidence: row.supports
    });
  }
}

outLinks.sort((a,b) => a.composedSceneId.localeCompare(b.composedSceneId) || b.supportCount-a.supportCount || b.confidence-a.confidence || a.kuId.localeCompare(b.kuId));

const perSurface = Object.fromEntries((composed.scenes || []).map(s => [s.id, outLinks.filter(x => x.composedSceneId === s.id).length]));
const out = {
  schemaVersion: 1,
  taxonomyId: composed.taxonomyId,
  composedSceneBaseline: 'scene500-composed-scenes-v1',
  status: 'generated_composition_candidates_pending_review',
  policy: {
    autoVerified: 0,
    productionEligible: false,
    simpleUnionForbidden: true,
    functionOrCognitiveOnlyForbidden: true,
    note: 'Composition candidates require evidence-weighted support. Human/sourced review is required before runtime use.'
  },
  summary: {
    composedScenes: (composed.scenes || []).length,
    candidateLinks: outLinks.length,
    scenesWithCandidates: Object.values(perSurface).filter(n => n > 0).length,
    candidatesByComposedScene: perSurface
  },
  links: outLinks
};

fs.writeFileSync('data/scene500-composed-ku-candidates-v1.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary, null, 2));
