# Scene500 controlled integration readiness (2026-10-23)

## Decision
**PREVIEW_INTEGRATION_ONLY**. This is not a production recommendation quality release.

## Integration contract verified from branch files
- `createScene500ContractAdapter({catalog,lexicon,associations})` in `contract-adapter.mjs`.
- `loadScene500WithChineseLexicon({catalog,lexiconUrl,associationUrl,fetchImpl,timeoutMs,signal})` in `chinese-lexicon-loader.mjs`.
- Search: `search(query,{limit,eligibleSceneIds})`; paging: `getPage(snapshot,pageIndex,pageSize=5)`.
- On missing/invalid/aborted optional assets, loader returns mode `rule_fallback`; valid assets return mode `hybrid`.
- Keep current V0.9.4 RC2 membership and contract 1.1. Do not map sample corpus counts into frequency fields. Preserve term IDs; no hard stopword removal.

## Known gates before production
1. Check out source at a fixed commit and run full Node CI on exactly the integration artifact, including true asset URLs and schema validation.
2. Publish the **approved** compact V0.9.4 lexicon and matching 3,553 lexical candidates (with reproducible provenance) to the preview environment; the subsequent 3,693-edge candidate overlay is unpromoted.
3. Test Safari initial load, repeated requests, fallback on timeout/offline, five-item paging and no change to learning/SRS UI.
4. Independently adjudicate reference scene labels, obtain untouched blind queries and test scene Recall@5, MRR@5, NDCG@5, multi-intent coverage, query stability, keyword precision/recall/F1.
5. Complete rollback/feature-flag validation and human approval for main release.

## Correctness notes
- `total` describes the returned candidate list, not all 500 catalog scenes. Empty searches and weak-signal fallback need UI handling.
- Two different scene IDs can share a scene name: S155 and S494; use sceneId only.
- Previews must not alter `core20k-rebuild-v1`, `main`, Chinese lexicon branch or English lexicon.
- Previous benchmarking used authored/editorial queries, not a held-out production benchmark. Candidate enrichment files are diagnostic experiments, not live assets.
