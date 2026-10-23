# Scene500 × Chinese Core20K V0.10.1 real-delivery integration QA (2026-10-23)

**Status: asset/integrity PASS; real Scene500 Node runtime execution PENDING.**

## Source delivery
- Library: `/PAI_Lexicon/zh-core20k-v0101-scene500-delivery/` (all eight claimed files read)
- Chinese source delivery registration commit: `bfb4dcf8678787b0fc13c9ebe64a8b5f073a2b79` (GitHub commit contains the delivery notice, not necessarily the data payload)
- Runtime file: `zh-core20k-v0101-scene500-runtime.json`, **6,454,987 bytes**, SHA-256 **18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093** (computed from actual raw bytes)
- `data_version: 0.10.1-evidence-compat`, `runtime_version: 0.9.4-rc.2-compatible`, `contract_version: 1.1`; 20,000 full `terms[]` entries; `integration_ready: true`, `production_ready: false`.
- Each term's `source_version` is a historical provenance attribute and is **not required to equal** release `data_version`.

## Actual cross-dataset checks
1. Loaded true V0.9.4 RC2 compact data: all 20,000 `term_id` values exist unchanged in V0.10.1.
2. All 20,000 `term` and `normalized_term` values unchanged; no reindexing or row-position ID substitution.
3. Loaded true Scene500 `catalog-v0.2.json` (500 scenes) and `v094-lexical-associations.json` (3,553 links, 1,613 linked terms).
4. Checked every association reference: **0 invalid term IDs**, **0 invalid scene IDs**, **0 duplicate (term_id, scene_id) pairs**.
5. Hash checks: all eight delivered files matched manifest SHA-256 entries.
6. Manifest also lists a ninth optional zero-byte `build-output.json`; it was not in the declared eight-file delivery directory. This manifest hygiene discrepancy should be corrected by the lexicon project; it does not block the actual runtime payload.
7. Old association provenance remains V0.9.4 RC2, and ID/membership compatibility allows reuse; association semantics remain unverified lexical candidates.

## Recommendation-side changes
- Updated `chinese-lexicon-loader.mjs` to explicitly validate V0.10.1 full `terms[]` release flags and contract, keeping stable IDs and per-item source provenance.
- Returned engine carries `runtimeDataVersion: 0.10.1-evidence-compat` when loaded successfully; fallback MUST never be represented as successful V0.10.1 hybrid.
- Added 20,000-entry synthetic V0.10.1 integration regression in `v0101-runtime.test.mjs` and added it to isolated CI.

## Important remaining gate
Actual repository JavaScript loader + real 6.45 MB V0.10.1 asset + real 3,553 association runtime E2E has **not yet been executed** (GitHub Actions result not yet confirmed). The successful asset/foreign-key QA is not a claim of full runtime search, recommendation accuracy, Safari compatibility, or deployment.

No changes to `main`, main app, performance branch, Chinese lexicon branch, English teaching lexicon, or SRS. **PREVIEW_INTEGRATION_ONLY.**
