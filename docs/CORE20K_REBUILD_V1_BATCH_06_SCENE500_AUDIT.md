# Batch 06 — actual Scene500 Top100 projection audit (2026-10-19)

Sources read locally:
- `Scene500_Core20K_V40_RuntimeProjection.json.gz`: 500 scenes, SceneRank-500-V4.0-FinalAuditCandidate source.
- `core20k_rebuild_v1_preview_shards/manifest.json`: all 80 SHA-256-verified gzip chunks, 20,000 frozen Core20K words.

**Executed Python data audit (not browser QA):**
- 500/500 scenes inspected, each original rank 1–100, **50,000 total positions**.
- 0 ordering / duplicate lemma / rank-lemma identity issues in those positions.
- Conservative single-playable-sense eligible: **22,227** positions (**44.454%**).
- Blocked: **27,773**, including **26,073** multi-playable-Sense candidates and **1,700** missing selected KU IDs.
- This gate never fills ranks with 101+ words.
- QA report: Library `/PAI_Lexicon/core20k_rebuild_v1_scene500_top100_audit.json`.
- Reproducer committed: `scripts/rebuild-v1/audit-scene500-projection.mjs` (Node version has not independently been executed).

**Major architectural implication:** the biggest blocker is now scene-to-Sense / KU disambiguation, *not* the Top100 headword ranking. Do not mark first playable sense as scene-verified. Prioritize directly reviewed scenario-specific Sense binding; allow safe general Sense fallback only when genuinely unambiguous.

**Limitations:** the source is the original projection, not an independent execution over canonical `data/scene500-top100-v40/group-01..20.json` or real Safari/browser acceptance. This is a non-publishable dataset audit.
