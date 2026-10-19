# Core20K Rebuild V1 — Batch 04 candidate bundle (2026-10-19)

## Actual local build
Frozen Core20K gzip + actual 12,990-word 13K-rich joined gzip combined into a versioned, NON-PUBLISHABLE two-layer bundle.

**Verified by full gzip/JSON round-trip**:
- Core20K 20,000 headwords; 16,617 frozen KU units.
- 12,990 matched legacy rich records, retaining 16,574 legacy KU identities; no duplicates, ID/type/rank mismatches.
- 38,970 legacy examples, 38,958 collocations, 6,182 usage notes, 130 contrast entries, 146 families, 5 grammar-pattern entries.
- 100% legacy rich sidecars marked `dictionary_verified=false`, `editorial_approved_for_release=false`, `release_eligible=false`.
- Core20K root data retained unchanged, not replaced by 13K translations.
- GZIP bundle size **4,613,456 bytes**; SHA-256 `696e150e40922bab1a2278ca0fbbbe47e6c9420dbab8b25062e5b534b3b8019d`.
- Frozen input SHA-256 `e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b`.
- Joined input SHA-256 `7ea0cf7641dd187589ba2f09fa6f89930b3db402a8ca513101e87595e35a4197`.

## Deliverables
Library: `/PAI_Lexicon/core20k_rebuild_v1_candidate_bundle.json.gz` and `/PAI_Lexicon/core20k_rebuild_v1_candidate_qa.json`.
GitHub reproducible Node build script: `scripts/rebuild-v1/build-rich-candidate-bundle.mjs`.

## Restrictions
- The actual local bundle was built with a local Python script; the GitHub Node implementation is provided for reproducibility, but **has not yet been executed**.
- No editorial/dictionary evidence certification is implied by preservation.
- Quarantined original 10 rows still await final resolution.
- No Scene500 full browser flow, offline cache, or Safari QA yet.
- Neither `main` nor Pages production updated.
