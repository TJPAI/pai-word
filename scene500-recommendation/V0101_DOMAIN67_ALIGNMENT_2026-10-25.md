# Scene500 × Chinese Core20K V0.10.1 — domain67 alignment QA

Date: 2026-10-25. Branch: `scene500-recommendation-dev`. Pre-audit branch HEAD: `b37d6c1ac45457e1a26f0cf2e2a38700cfb60890`.

## Real file checks (executed locally)

| Asset | SHA-256 |
|---|---|
| `catalog-v0.2.json` | `35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8` |
| `zh-core20k-v0101-scene500-runtime.json` | `18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093` |
| `v094-lexical-associations.json` | `d6de9818f5056330b6d57d6b7c728a1457e66a4d241aac173ba7eb1c5f770213` |

Parsed files and checked:
- Catalog: **500** entries, IDs exactly `S001`–`S500`.
- Runtime: **20,000** entries; **20,000 unique `term_id`**; **zero empty `normalized_term`**.
- Runtime flags: `data_version=0.10.1-evidence-compat`, `contract_version=1.1`, `integration_ready=true`, `production_ready=false`.
- Association links: **3,553**; **zero** links with missing term ID, missing scene ID, or mismatched term text.
- Domain67 second-level evidence audit v27 (Google Drive, user-supplied): **67/67** exact term strings found in pinned runtime and **67/67** `term_id` equal to the corresponding pinned runtime identity. **23/67** `verified_definition=true`; remaining **44** are not definition-verified. This confirms **identity alignment only**, not independent identity/frequency certification.
- Existing `chinese-lexicon-loader.mjs` already supports `0.10.1-evidence-compat`, validates `integration_ready`, `production_ready`, `contract_version`, count and field shapes, and preserves `term_id`.
- Existing `contract-adapter.mjs` validates IDs, normalized terms, optional frequency fields and association constraints. No reimplementation needed.

## Scope and limitations

This run is **structural/data-contract QA** and GitHub source inspection, **not** a fresh real-runtime E2E execution or independent semantic grading. The existing pinned runtime QA script previously passed, but was not rerun in this session. No new query-by-query audit of all 67 domain terms was performed; do not claim absence of over-recommendation, segmentation errors, or stale UI results.

Known independent semantic gaps from previous QA: pure English queries (subway/bus/taxi/coffee) often fail to retrieve intended scenes; experimental V1 negation rerank regressed independent cases and remains blocked. V2 explicit replacement candidate is also experimental and **not wired** into default Hybrid.

## Integration handoff

- **Recommended integration baseline:** existing `loadScene500WithChineseLexicon` from `scene500-recommendation/chinese-lexicon-loader.mjs` on this branch; catalog + V0.10.1 runtime + 3,553 association file at pinned SHA256 above.
- **Mode gate:** require `mode === 'hybrid'` and `runtimeDataVersion === '0.10.1-evidence-compat'`; `rule_fallback` is a supported degraded state, not evidence that Hybrid loaded.
- **API:** `loadScene500WithChineseLexicon({catalog,lexiconUrl,associationUrl,fetchImpl?,timeoutMs?,signal?,onDiagnostic?})`; resulting `engine.search(query,{limit,eligibleSceneIds})` returns `{query,total,results:[{sceneId,name,score,rank,matchedTerms,reason,...}]}`.
- Query changes: the caller must issue a fresh `engine.search` for each input and discard results from stale asynchronous requests. Browser UI stale-query behavior **still requires E2E verification in the main app**.
- Do not enable `enableExperimentalExtension`, experimental V1 negation rerank, or V2 replacement rerank by default.
- No change to Core20K membership, frequency, association weights, SRS or learner state.

**Decision:** **INTEGRATION CANDIDATE / STRUCTURAL QA PASS** for the existing Hybrid baseline; **NOT** semantic production certification. Main developer may integrate the pinned baseline with runtime-mode diagnostics and browser E2E gates.
