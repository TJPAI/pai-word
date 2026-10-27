# Core20K clean KU production V1

This is a NEW isolated production baseline. Do not import stale ku-factory draft files, issue statuses, or manifests as production progress.

## Immutable inputs
ChatGPT shared Library folder: `/PAI-Word/Core20K-KU-CLEAN-V1/`.
Find exactly `batch-{TASK_ID}-b{BATCH_SIZE}.jsonl` (the currently prepared data is for BATCH_SIZE=500 only).
All 40 files of 500 headwords are source-validated against frozen V2.0.6, with `manifest.json` SHA256 entries. Before content generation, fetch the exact file via the Library connector and validate records, ranks, no duplicates and original SHA256.

## Independent output
Each worker branch: `ku-clean-{TASK_ID}-b{BATCH_SIZE}`, based on `ku-production-clean-v1`.
Output path: `tools/core20k_lexicon/ku-clean-v1/{BATCH_SIZE}/{TASK_ID}/`.
Each worker creates actual nonempty `candidates-ranks-AAAA-BBBB.jsonl` for 20–25 headwords at a time. Only count content after successful GitHub commit AND refetch. Process and retry unverified headwords; do not mark ungenerated content done.

Candidate identities are provisional and distinguish sense-level candidate labels from KU-level candidate labels. No invented canonical headword_id/sense_id/ku_id, no PRODUCTION_READY. Follow the existing Core20K editorial draft fields where applicable. One KU must contain a teachable sense-specific fact with explanatory content, not only an empty identity.

Do not force full canonical-ID reconciliation before generating genuine AI_DRAFT_UNVERIFIED candidates; track conflicts separately. Follow Issue #1's existing English-lexicon, English-teaching and double-AI review ownership for later promotion.

This branch must not modify main, stable preview, historical Core13K or KU SRS IDs.
