# Scene500 real-asset baseline audit — 2026-10-23

Status: **VERIFIED_ASSET_PAIR / NOT_PRODUCTION_READY**

Audited actual Library assets (not fabricated fixtures):
- Chinese Core20K compact: `zh-core20k-v094.min.json`, version `0.9.4-rc.2`, 20,000 terms, SHA-256 `9be43c35c1e0d1b1926c11726acb2d707bb052634e1ebc60ed445e4b35c63335`.
- Association file: `v094-lexical-associations.json`, version `v094-lexical-v0.2`, 3,553 term-scene links, 1,613 linked terms; its declared `source.lexicon_sha256` exactly matches the compact file.
- Catalog: `catalog-v0.2.json`, 500 scenes, SHA-256 `35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8`; exactly matches `source.catalog_sha256` in the association file.
- Association foreign keys: 0 invalid term IDs, 0 invalid scene IDs; 0 duplicate (term_id, scene_id) pairs.
- Current exact-match expansion algorithm evaluated against these real three assets: **0 new candidate links and 0 newly linked terms**, because exact scene profile matches have already been exhausted by baseline associations.

Important nuance:
- A separate older `zh-core20k.min.json` file is labeled `0.9.0-rc.1`. Never use its filename as proof of V0.9.4 identity; select by version and verified SHA-256.
- The `0.9.4-rc.2` asset is candidate/unfrozen, not production-ready.
- Existing 3,553 links are lexical candidates with no independent semantic correctness proof.
- Semantic expansion—not more exact-field indexing—is required to broaden coverage. Generated candidates remain review-only.
- This is an offline asset/integrity audit, **not** an assertion that GitHub CI or browser E2E passed.

Reproduction methodology: load JSON, validate stable term IDs exist, scene IDs exist, pairs are unique, calculate SHA-256 on raw bytes, and index normalized scene name/alias/action/object fields. For every Core20K exact term-surface key, subtract existing term-scene pairs, exclude ambiguous keys and single-character keys matching over 3 scenes.
