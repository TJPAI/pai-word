# Core20K Batch 12 — existing rich asset reconciliation

This audit compares three pre-existing Library artifacts against the immutable V2.0.6 membership. It does not promote any content.

- Core20K_Unified_MVP_20000.json.gz: 20,000 members, 12,994 inherited old lemmas, 7,006 incremental.
- core20k_joined_rich_candidates_v2.json.gz: 12,990 rich old records, 12,990 unique lemmas; publishable=false.
- core20k_rebuild_v1_candidate_bundle.json.gz: publishable=false.
- All 12,990 rich old lemmas overlap inherited members. Exactly four inherited lemmas have no matching separate rich record: dispatch, drape, overt, pathological. These have historical duplicate word identities; review their crosswalk before promotion.
- Incremental headwords with a Sense candidate: 3,401; with a candidate Chinese gloss: 1,106; without an IPA field: 7,006.
- Historical word-level example and collocation fields are present for the 12,990 rich items. Field presence is **not** Sense alignment and is **not** dictionary verification.
- Zero new Production Ready KUs asserted.

Local report/archive: core20k_batch12_reuse_audit.zip. Audit script includes frozen rank and uniqueness checks and records SHA256 for all three source assets.

Next: evaluate the 527 words without OEWN source, obtain legally reusable pronunciation resources, and create AI Chinese drafts with source Sense evidence plus independent semantic QA. Do not alter the stable app, Scene500 ranking, or SRS.
