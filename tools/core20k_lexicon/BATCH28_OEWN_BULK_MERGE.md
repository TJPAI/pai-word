# Batch 28 — Full 20K OEWN bulk merge: executed results

Executed `/mnt/data/build_core20k_batch28.py`, source-linked, rank+lemma exact-match join of Batch27 20K routes with Batch10 3,078 OEWN-matched lemmas / 8,395 candidate senses. **All 3,078 joins passed; no rank/lemma mismatch; 527 remain unmatched.**

Incremental 7,006 workstream distribution after merger: `OEWN_SENSE_CANDIDATE_REVIEW=3078`, `CHINESE_SENSE_AUTHORING=2295`, `SECOND_SOURCE_AND_ZH_QA=627`, `SENSE_POS_HUMAN_REVIEW=476`, `OTHER_SOURCE_REQUIRED=527`, `REGISTERED_NEEDS_CONTENT_QA=3`. Plus 12,994 legacy validation = 20,000 rows.

Validated: 20K unique ranks, 7,006 incremental words, sum of embedded OEWN candidates 8,395, no source overwrite, no KU IDs minted, zero Production Ready promotions. Source-linked candidate data preserve each `source_sense_id` and original gloss; **no teaching-first Sense selected**.

Deliverable `core20k_batch28_oewn_bulk_merge.zip` contains executable builder, full 20K JSONL workstreams, all 3,078 OEWN candidate-bearing JSONL records, 7,006-workstream CSV and SHA256 audit. Contents presently delivered as attached artifact, **not** repository data. Hash merged 20K rows: `78992d6450d2ef37f7c31ce7fb8a22426d191336d3678a95353a933293f0ceb7`.

Source hashes: routes `c9940dbbaf313001c7f3e4635a998b8fc40b70d185b010076b10d889550b4424`; OEWN candidates `5a13428dbbe07721989626b9ac3a7ac078b57880a57230dfa2c3af0921a2939d`.

No modifications to frozen membership, existing KU registry, stable app, SRS or Scene500.