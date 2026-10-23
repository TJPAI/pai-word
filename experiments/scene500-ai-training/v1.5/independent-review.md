# Scene500 E5 V1.5 — review and integration decision

Muse ZIP: https://drive.google.com/file/d/108cDGx-sSgb52gt0sywH6tRBVrZFGq8l/view?usp=drivesdk

ZIP integrity verified and 8 artifacts inspected at the file-list level; metrics independently read from scene500-e5-v15-analysis.json. No E5 inference rerun by this reviewer.

## Frozen provisional holdout (130 positive queries, AI-labelled, NOT human verified)

| configuration | R@1 | R@5 | R@10 | MRR@10 |
|---|---:|---:|---:|---:|
| A0 historical rich | 60 | 95 | 102 | 0.5786 |
| B2 simplified new | 60 | 84 | 97 | 0.5455 |
| C1 rich + new descriptions | 72 | 107 | 115 | 0.6679 |
| C2 rich + new descriptions + intents | 73 | 106 | 115 | 0.6729 |
| C3 length/dedup | 73 | 106 | 115 | 0.6729 |
| C4 rich without low-quality example queries | 70 | 105 | 119 | 0.6623 |

Development 59 positive: A0 R@1 31, R@5 48, R@10 52; C2 40, 55, 55; B2 39, 52, 54.

**Decision:** choose C2 as provisional top-ranked configuration for reranker experiments; C1 has marginally higher holdout R@5, C4 higher R@10, so retain them as diagnostic controls. C2 does not dominate every metric. Preserve all 500 IDs and 229 candidate overrides, keep boundaries out of embedding passages. No production integration yet.

## Failure and acceptance gates

H025 expected S275 ranked 5 (A0 ranked 2); H038 expected S152 falls outside Top10 under C2; H041 S203 and H046 S236 absent from Top10; H042 falls outside Top10. H035 S278 ranks first. N119 'Running late' wrongly attracted S330 running. Address both recall misses and ambiguous-language hijacking; reranking alone cannot recover a scene absent from Top10.

C2 provisional holdout English R@1 20/47 vs A0 14/47; Chinese 53/83 vs A0 46/83. 30 negative/noise cases have high cosine similarity; abstention remains unsolved. Mobile/browser performance NOT_RUN. Human label adjudication NOT_RUN. Do not claim production/generalization accuracy.

Next: reproducible C2 passage builder + browser-size/performance QA; rerank candidates with independent evaluation and pre-registered acceptance criteria; audit labels, especially multi-label and negative cases.
