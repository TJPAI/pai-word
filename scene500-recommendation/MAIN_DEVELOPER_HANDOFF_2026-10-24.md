# Scene500 controlled handoff — 2026-10-24

Status: PREVIEW_ONLY; E5 disabled; no edits to host branch.

## Verified branch boundary
Source branch: scene500-recommendation-dev. Target branch: home-perf-safe-load-20261022 (diverged; cherry-pick/copy selected files only). Engine version: 1.0.0-alpha.1. Contract: scene500-recommendation-contract-v0.1. Never copy experiments by wildcard.

## Required ESM runtime files
scene500-recommendation/engine.mjs
scene500-recommendation/catalog-v0.2.json
scene500-recommendation/chinese-lexicon-loader.mjs
scene500-recommendation/contract-adapter.mjs
scene500-recommendation/zh-v094-runtime-bridge.mjs
scene500-recommendation/sparse-retriever.mjs
scene500-recommendation/subject-intent.mjs
scene500-recommendation/experimental-association-adapter.mjs (loader static import; flag remains OFF)

## Matched external assets (not bundled in this branch)
zh-core20k-v094.min.json: 20,000 terms, v0.9.4-rc.2; SHA256 9be43c35c1e0d1b1926c11726acb2d707bb052634e1ebc60ed445e4b35c63335.
v094-lexical-associations.json: v094-lexical-v0.2; 3,553 term-scene edges, 1,613 distinct linked terms = 8.065% of 20,000. Catalog SHA256 35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8. These are previous asset-audit results, not freshly revalidated published files. Do not substitute latest V0.10.1 lexicon without checking exact stable IDs and association provenance. Experimental overlays and proposed links are excluded.

## Usage
After first home paint, lazy import chinese-lexicon-loader.mjs, then call loadScene500WithChineseLexicon({catalog,lexiconUrl,associationUrl,timeoutMs:4000,onDiagnostic}). A valid matched asset pair yields mode=hybrid, missing/mismatched/timeout yields mode=rule_fallback. Call engine.search(query,{limit:10,eligibleSceneIds}) and use results[].sceneId (not name) for navigation. Results may be empty. Recreate result snapshot for every query. Host controls eligibility, difficulty, UI, SRS, and navigation.

## Acceptance gates (NOT YET PASS)
- Revalidate actual deployed lexicon, associations and catalog SHA256 before enabling hybrid.
- Run Node tests for engine, loader, contract, subject intent, integration boundaries, then 10 representative Top10 searches with actual files and timings.
- Verify Chinese, English, math, physics, AI, quantum queries. Seven exact academic subject mappings exist, but AI and quantum are not in that mapping.
- Test iPhone Safari cold load, timeout/offline fallback, no duplicate IDs, no SRS/home regressions.
- If any failure: disable hybrid asset URLs/flag and retain rule_fallback; if rule fallback fails, revert only recommendation integration.

No GitHub Actions PASS, Safari PASS, benchmark, or full production semantic certification is claimed by this handoff.
