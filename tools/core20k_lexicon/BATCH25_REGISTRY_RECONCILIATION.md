# Batch 25 — real Core20K registry reconciliation

Inputs: Library `Core20K_RegistryReconcile_1106.csv` SHA256 `f26605718cf11e2565d93bfbe1992f5993e955e582493c581957d509ad4dbc81`; local 500 candidate gate JSONL SHA256 `47dcdd20bc4c36b486d5c8a13631e207c72b5e08c38420f812dd7e20860052fc`.

Actual registry 1,106 unique candidates: `ALREADY_REGISTERED` 3, `NEEDS_SECOND_SOURCE` 627, `BLOCKED` 476; `registration_allowed=true` zero; three unique existing KU IDs.

Candidate500 full join: 500/500 matched, zero missing. Of these, three already registered, 281 need second source, 216 blocked. All 500 remain not Production Ready. No new KU IDs minted or accepted. All old stable IDs are preserved.

Local deliverable `core20k_batch25_registry_reconciliation.zip` includes executable Python join, 500 JSONL records, three registered-candidate JSONL records, audit JSON and regression tests. 7/7 QA PASS. Code/data in ZIP not separately committed to GitHub.

Frozen membership, stable app, Scene500, Chinese 20K, and SRS unchanged.