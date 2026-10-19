# Rebuild V1 Batch 03: executed QA, 2026-10-19

## Real Node.js executions (local isolated harness)
- `scripts/rebuild-v1/test-selected-assets.mjs`: PASS. Tests same-ID SRS preservation, orphan quarantine, invalid transition refusal, strict Scene500 Top100, and cross-scene shared KU. Branch module was strengthened to **quarantine implicit merges as well as splits**, and regression rerun passed.
- `scripts/rebuild-v1/test-real-rich-join.mjs <20k-runtime.gz> <joined-rich-candidates-v2.gz>`: PASS_STRUCTURAL_ONLY on actual frozen 20K and rich candidate data.
  - 20,000 target words.
  - 12,990 candidate words joined at exact rank.
  - 16,574 KU ID+type joins, zero structural mismatches.
  - 38,970 examples, 38,958 collocations, 6,182 usage notes preserved in review candidate records.
- The real-data test deliberately rejects records unless `status=candidate_not_editorially_approved`, making it fail-closed.

## Remaining work
- No claimed dictionary-verified editorial approval.
- No complete 500-scene browser or Safari acceptance test yet.
- No rebuilt production runtime or service-worker offline regression verified.
- Do not update main or the published Pages source with these candidate files.

Local result also saved as Library `/PAI_Lexicon/core20k_rebuild_v1_qa_batch03.json`.
