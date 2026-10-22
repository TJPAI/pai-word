# Core20K Batch48 — canonical Mandarin Sense schema repair

This batch **corrects a false alarm** from an initial audit: 130 Batch36 records had `zh_gloss_draft` while other batches had `gloss_zh_draft`. The underlying Mandarin translations **were present**. Exact source Batch47 consolidation had 2,261 unique source candidate keys; after canonical migration, 2,261/2,261 nonempty `gloss_zh_draft`, no conflicts and no duplicates. Original file left intact.

Canonical status set to `EDITORIAL_UNVERIFIED` for all 2,261. Risk/review marker normalized across `review_flag`, `review_required`, `needs_semantic_review`: 143 marked. Dictionary-verified=0, Production Ready=0. QA assertions all pass.

Original source SHA256: `77b87b060ee6e77321980600bba89278f21119eba02ee8433b8b505b3fed6450`.
Canonical output SHA256: `3cfeded39310eb2c366de39170e3e2a8779d61a73220cee31ab706ad767e71ab`.

Executable source plus complete 2,261-row canonical JSONL, 130-migration JSONL, audit and README are available in `core20k_batch48_schema_repair.zip`, not yet checked into GitHub as raw data. The 34 exact-reuse records from Batch29 remain separate and have not been certified. No stable branch, frozen headword list, SRS or Scene500 changes.