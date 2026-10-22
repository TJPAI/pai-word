# Batch 19: real 500-Sense draft semantic triage

Inputs: Batch15 `existing_zh_drafts_for_review.jsonl` (134) and Batch18 `all_366_zh_drafts.jsonl` (366).

Executed local batch QA: 500/500 unique candidate keys; 500/500 non-empty Chinese draft gloss and OEWN English gloss; 500 unique ranks. **6/6 structural tests PASS**.

Risk queue: 5 HIGH, 53 MEDIUM, 442 LOW_UNCHECKED. LOW_UNCHECKED is not semantic approval. Manual targeted issue queue comprises 9 entries (some flagged MEDIUM); examples: OEWN January source definition claims the month begins 10 days after winter solstice, `using` noun denotes exploitation and must not be mapped to everyday verbal usage, `integrator` sense specificity, `moron` insulting register, `externality` economics ambiguity, `homemaker` outdated gender framing.

Zero Dictionary Verified and zero Production Ready promotions. These rules catch only some mistakes; independent bilingual semantic review and evidence remain necessary.

Artifact with the complete source-linked review queue, executable audit, tests and machine report: `core20k_batch19_semantic_triage.zip` (created outside GitHub).
No edits to stable App, Scene500 ranking, Chinese Core20K, or SRS.