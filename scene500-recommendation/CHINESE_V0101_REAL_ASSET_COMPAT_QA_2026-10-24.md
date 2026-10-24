# Chinese Core20K V0.10.1 × Scene500 real-asset compatibility QA — 2026-10-24

Status: PASS_DATA_CONTRACT_ONLY; recommendation Top5/Top10 and browser E2E NOT YET VERIFIED. Keep V0.9.4 RC2 production baseline.

Source: Chinese team reported HEAD d1c39db61c65c8cd29e5b8364e03eab3d845bf74; QA V0.10.17; runtime V0.10.1. Do not treat this document as proof of that HEAD being deployed.

## Actual local file verification
Read real JSON files: `zh-core20k-v0101-scene500-runtime.json`, `zh-core20k-v094.min.json`, `v094-lexical-associations.json`, `catalog-v0.2.json`.

- V0.10.1 runtime SHA256: `18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093` — matches Chinese team's delivery SHA.
- V0.10.1 unique term_id: 20,000; V0.9.4 unique IDs: 20,000.
- For every term_id, compared `(term,normalized_term,stopword_hint)` to V0.9.4 compact `(t,n,bool(s))`: zero differences, zero missing IDs, zero added IDs.
- All 3,553 baseline association rows checked: every term_id exists in V0.10.1; every scene_id exists in the 500-scene catalog; every association `term` exactly matches runtime `term`. **Zero foreign-key or term-surface mismatches**.
- 1,613 unique associated terms; 500 associated scenes.

## Limits and next gates
This is data compatibility only; no engine search results, browser load, latency, ranking quality, SRS, or deployment test was executed in this verification. The recommendation branch loader's V0.10.1 compatibility needs a real Node runtime test using its original GitHub ESM modules; run baseline-vs-new Top5/Top10 with identical queries, compare result ordering and fallback, and log timings. Preserve existing V0.9.4 as production baseline until those gates pass.

Semantic overlay / E5 / experimental association packs remain disabled by default.
