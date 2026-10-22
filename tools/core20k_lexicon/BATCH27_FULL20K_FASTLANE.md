# Batch 27 — Full 20K fastlane routing

Actual executed local ETL against `Core20K_Unified_MVP_20000.json.gz` and `Core20K_RegistryReconcile_1106.csv`. 20,000 distinct-rank headwords and 7,006 incremental headwords classified.

Incremental next-workstream partition: 3,605 SOURCE_SENSE_SELECTION; 2,295 CHINESE_SENSE_AUTHORING; 627 SECOND_SOURCE_AND_ZH_QA; 476 SENSE_POS_HUMAN_REVIEW; 3 REGISTERED_NEEDS_CONTENT_QA. The remaining 12,994 legacy-matched entries require legacy quality validation; legacy present does not equal Production Ready.

Existing OEWN 3,078 matches for the 3,605 missing-sense population must be imported in a **separate merge** before re-running routes; this batch **does not** falsely claim they have been merged.

Data source SHA256 `9e1b93d4230b1009aefb758f77141c4951f8804b29321870fea637026e328b33` and registry SHA256 `f26605718cf11e2565d93bfbe1992f5993e955e582493c581957d509ad4dbc81`.

Actual deliverable created `core20k_fastlane_batch27.zip` includes reproducible Python, 20k JSONL routes, 7006-row CSV, SHA audit. Counts and unique ranks checked. Zero new Production Ready, zero new KU identities; stable app and frozen membership untouched.

Next steps: batch merge 3,078 OEWN matches without overwriting existing sense or KU identity, bulk Chinese drafts with risk review, independent bilingual and IPA provenance gates, and audited stable KU registry integration.
