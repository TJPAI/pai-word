# Scene500 lightweight Hybrid quality gate — candidate stage

Baseline: current Hybrid, unchanged. Candidate: `query-intent-candidate.mjs`, **not imported by production loader**. Semantic overlay V1.2 and E5 are paused. No ranking improvement claimed.

## Confirmed source-level risks
1. Sparse term recall is substring-based and may score negated targets as positive.
2. Greedy length-first selection (max 10) can suppress independent user intents.
3. Rule score is additive and may overvalue generic aliases, with limited phrase boundaries.
4. Eligibility is correctly host-owned; benchmark must use actual playable inventory separately.

## Benchmark protocol
- Minimum 200 distinct natural queries: 40 daily/colloquial, 30 professional, 30 multi-intent, 30 ambiguity/boundaries, 25 negation/contrast, 25 English, 20 mixed-language. Include typo and elliptical variants within groups.
- Labels must be independently reviewed by a human: grade 3 highly relevant, 2 partially relevant, 1 weak, 0 irrelevant; multiple scenes may be relevant, including no-match cases. Record reviewer, timestamp, disagreement adjudication. Machine-generated labels are DRAFT only.
- Freeze holdout before tuning. Separate development and holdout; prevent template and paraphrase leakage. Evaluate exactly the same eligible-scene inventory.
- Report Recall@5 (grade >=2), MRR@5 (first grade 3), NDCG@5 (graded), Top1 accuracy (grade 3), false-positive rate on no-match/negative cases; show per-slice and 20 failure examples.
- Time 1000 warmed searches with `performance.now()` on iPhone Safari, report P50/P95 excluding asset download. Record gzip/br additional data <=1 MB and cold load.
- Ablate normalization, intent/negation, bilingual, multi-intent, boundary penalties independently; only retain changes with held-out gains and no material regression.
- Strict no-regression: empty/no-match queries, 500 valid IDs, stable ranking, no duplicate IDs, fallback on malformed assets, no KU/SRS modification.
- Candidate status cannot be promoted without labels, measurements, and browser E2E evidence.

## Current commits
Candidate module `query-intent-candidate.mjs` and its test are isolated. Unit tests have **not yet been executed** in this document. No real Top5 or latency PASS is asserted.
