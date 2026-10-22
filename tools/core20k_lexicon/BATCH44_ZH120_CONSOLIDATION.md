# Core20K Batch44 — actual Chinese Sense data consolidation

Executed local builder `/mnt/data/build_core20k_batch44.py` against 651 verified Batch43 remaining tasks. Authored **120** new distinct Sense-specific Chinese editorial drafts and retained **531** unprocessed tasks; 24 special-review flags.

Consolidated all actual new-draft JSONL assets from Batches 30–44 into **1,730 unique source-linked candidates**; verified no duplicate candidate_key, no overlap with remaining queue, original OEWN Sense ID, POS, English gloss and frozen rank preserved. No overwrite of official KU IDs, no independent bilingual approval, zero Production Ready promotions.

Actual downloadable artifact `core20k_batch44_zh120_consolidated.zip` contains `new_120_zh_sense_drafts.jsonl`, `remaining_531_tasks.jsonl`, `consolidated_batch30_44_1730_drafts.jsonl`, audit JSON and README. QA PASS.

SHA256 consolidated: `d39a83ebab1193f4492c64424c1e686a483d3886fec5dc72f31174d698bc26c2`; new120: `dbc9ddb43329b386f5e2bd9e8342b1227e9cc97305347b97d4466053359e37c1`; remaining531: `511b3419a03abd92c689511e091e9483309f7974fbed6688577a03a78e5e15f0`.

**Repository audit report only; actual JSONL bytes remain in downloadable artifact and are not yet in GitHub.** Frozen membership, stable app, Scene500 and SRS unchanged.