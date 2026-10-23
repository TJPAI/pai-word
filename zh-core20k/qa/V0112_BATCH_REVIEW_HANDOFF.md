# V0.10.12 risk-stratified review handoff

Library: `/PAI_Lexicon/zh-core20k-v0101-scene500-delivery/` contains `v0112-build_review.py`, `v0112-qa.json`, and `v0112-queue-01.jsonl` through `v0112-queue-04.jsonl` (250 lines each).

Verified master: 20,000 terms, unique term_id and full SHA-256-derived identity pass. Runtime SHA-256 `18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093`.

Rule signals cover 13,611 entries; first 1,000 prioritized for review. **NONE are verified errors.** Early hits include obvious overflags such as 我们/他们/不过/取得; 12 AI-proposed protect examples are recorded as regression controls. Heuristics and language-model judgments do not constitute independent frequency or contextual segmentation evidence. No membership, stable ID, general frequency, or Scene500 Runtime changes. `production_ready=false`.

Priority for next iteration: take sampled queue items through *evidenced* lexical adjudication rather than claim high throughput from candidate generation.
