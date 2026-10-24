# Chinese Core20K cross-workstream integration status — 2026-10-24

Verified GitHub branch HEADs:
- chinese-core20k-dev: 8e70cae9036839ffcafbbc8d0833f96a939c2462
- scene500-recommendation-dev: d766c4e94d3b91d061e66889e5dc60b83445f947
- home-perf-safe-load-20261022: 051e88231fa642ef5db2c381c358b378648df883
- core20k-rebuild-v1: d8549fe4a5e966989bc8f42a7804f7afeb858036

Source of truth: branch commits + explicit runtime artifact manifest, not README version or QA version. zh-core20k/README.md still mentions 0.9.0-rc.1 and must not be interpreted as latest QA/runtime.

Contract:
1. Scene500 recommendation source branch owns the single chinese-lexicon-loader.mjs. Host must not create a third loader. Target is home-perf-safe-load-20261022.
2. Preserve canonical sceneId S001..S500, return max 10; host owns eligibleSceneIds, UI, navigation, KU/SRS.
3. Fresh search => fresh snapshot, including empty results. E5 and experimental associations OFF.
4. The 20K V0.10.1 QA-compatible runtime is not a drop-in replacement for V0.9.4 lexicon + 3,553 association edges without ID parity, provenance and deployed SHA validation.
5. Existing recommendation handoff identifies matching engine.mjs/catalog-v0.2.json/contract-adapter.mjs/sparse-retriever.mjs blob SHAs; copy only required deltas, not whole branches.
6. Fail closed to rule_fallback on absent/mismatched/timeout assets. Keep initial Home Shell lazy-loaded.
7. No cross-branch merge, no main edits, no claims of deployed E2E PASS until real assets, QA and iPhone Safari checked.

Owner actions:
- Chinese lexicon: publish a canonical machine-readable runtime manifest with sha256, membership/id parity and aliases; separate QA overlay from runtime.
- Recommendation: pin source manifest and exact loader/association compatibility; run real-assets-top10-qa.mjs against deployed artifacts.
- Host: integrate only selected recommendation deltas, test new query invalidation and offline fallback, and record deployed source SHA.
- English Core20K: maintain independent KU/learning contract; do not mutate on recommendation import.

Status: CONTRACT ALIGNMENT DOCUMENTED; actual cross-branch integration and deployed end-to-end compatibility NOT VERIFIED.
