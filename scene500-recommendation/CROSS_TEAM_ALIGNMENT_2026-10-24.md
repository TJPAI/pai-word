# PAI Word cross-team integration alignment — 2026-10-24

Status: SOURCE-VERIFIED ALIGNMENT PLAN / NOT DEPLOYED / NOT E2E PASS.
Repository: TJPAI/pai-word. Do not modify main.

## Sources and ownership
- Host/preview: `home-perf-safe-load-20261022` owns homepage, search lifecycle, scene navigation, difficulty/inventory, KU/SRS, release.
- Recommendation: `scene500-recommendation-dev` owns Scene500 Hybrid rule + Chinese lexical retrieval, canonical catalog and recommendation contract. E5 excluded.
- Chinese lexicon: `chinese-core20k-dev` owns 20K stable identities and V0.10.1 compatibility deliverable; its full runtime is in Library, **not confirmed on GitHub or preview**.
- English teaching KU: `core20k-rebuild-v1` owns Batch136 KU adapters/runtime gate; do not transplant host or experimental semantic changes wholesale.

## Verified actual GitHub facts
- Target bridge `rebuild-preview/scene500-recommendation-bridge.mjs` exists. It loads rule first, optional Hybrid second, filters eligible scenes using inventory.reviewedCount, caches by query/difficulty/eligible IDs, and exposes status. Preserve it; do not create a second bridge.
- Target and recommendation branch have identical Git blobs for `engine.mjs`, `catalog-v0.2.json`, `contract-adapter.mjs`, `sparse-retriever.mjs`; no copy needed.
- Target and recommendation branch differ for `chinese-lexicon-loader.mjs` and `subject-intent.mjs`. Explicit user decision: use recommendation branch loader as the single loader implementation. Include `experimental-association-adapter.mjs` static import if missing; extension stays OFF.
- Target's existing loader SHA-pins known V0.9.4 compact and association bytes; recommendation loader validates contracts but does not SHA-pin. Before release verify published file hashes externally; do not claim equivalent integrity.
- Chinese V0.10.1 handoff `zh-core20k/SCENE500_V0101_DELIVERY.md` claims 20,000 stable IDs, term and normalized-term identity vs RC2, integration_ready true, production_ready false. It explicitly says 3,553 association rows not yet independently validated against its full runtime and runtime file not in GitHub.
- `core20k-rebuild-v1` includes `rebuild-preview/core20k-teaching-candidate-adapter.mjs` and `core20k-batch136-runtime-gate.mjs`; these belong to KU integration, not recommendation runtime.
- `core20k-rebuild-v1` has a separate optional semantic pilot and a different bridge. Do not overwrite the host bridge with it; semantic pilot remains OFF. Recommendation branch semantic overlay research explicitly NOT production-ready.

## Contract freeze
- Input: `search(query,{limit,eligibleSceneIds})`; output sceneId-based ranked results. Host bridge exposes `recommend(query,{difficulty,inventory,eligibleSceneIds,limit})` returning ids/total/mode/emptyReason.
- Keep catalog S001–S500 identity; no name-based navigation. Eligibility belongs to host. Empty candidate and no playable inventory are different states.
- Hybrid requires a compatible 20K lexicon and associations. Baseline V0.9.4 RC2: 20,000 terms, 3,553 lexical links; unreviewed expansion overlays are NOT default.
- Known local baseline SHA256: catalog 35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8; compact lexicon 9be43c35c1e0d1b1926c11726acb2d707bb052634e1ebc60ed445e4b35c63335; associations d6de9818f5056330b6d57d6b7c728a1457e66a4d241aac173ba7eb1c5f770213. Re-check actual deployed bytes.
- V0.10.1 may be evaluated in parallel, but do not replace V0.9.4 baseline until exact 20K identity and all 3,553 foreign keys are checked against real runtime and results regressions pass.
- Query freshness: async older request must not overwrite newer query. The host bridge query-keyed cache alone does NOT guarantee DOM race prevention; host UI must use request generation token or abort controller.
- Loader may settle after first rule search: clear bridge cache on Hybrid promotion and re-evaluate active query without overwriting a newer query. Prevent duplicate IDs; page at most 5 per view / 10 if host explicitly requests 10.

## Minimal implementation order
1. Re-read branch HEAD and exact blobs. Transfer only differing recommendation loader and subject-intent plus missing static dependency; do not wholesale merge branches.
2. Verify target bridge import resolution and real deployed asset URLs, SHA256, schema and runtime `mode`.
3. Check host UI request-generation guard and Hybrid promotion refresh; repair only demonstrated defects.
4. Execute real-assets-top10-qa.mjs against matched files; record real Top5, ms, mode and 404/timeout fallback. Do not claim PASS without execution.
5. Check Batch136 KU gate and host SRS, audio, gestures, auto browse, three rating buttons; keep recommendation change isolated.
6. Safari mobile cold-load, repeated query, slow network, no-playable-scene, rollback test.
7. Report exact changed paths, source blob SHA, commit SHA, deployed source SHA and evidence; leave main untouched.

## Do not redo
No new Scene500 taxonomy, no new base engine, no second loader, no new bridge, no repeated generation of 3,693 experimental association candidates, no E5, no wholesale cherry-pick, no SRS rewrite.

## Open gates
Actual published SHA check, V0.10.1 complete runtime availability and FK check, full source Node test, browser E2E, Batch136 integration and deployment SHA remain unverified in this alignment note.
