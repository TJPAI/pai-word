# Scene500 overlay quality gate — 2026-10-24

## Verified local screening result
Input: 500 scene records, 3,107 candidate expressions, experimental and unverified.
A stricter five-pattern heuristic screening removed 2,975 generic-form expressions, leaving **132 expressions across 36 scenes**; **464 scenes have zero retained expressions**.

Breakdown of removed expressions:
- “我想学习…相关的英语表达”: 480
- “在…的情况下如何沟通”: 480
- “…的时候怎么用英语表达”: 508
- “…时关于…的问题”: 958
- “…具体应该怎么说”: 549

These are **heuristic screening classifications**, not independent relevance labels. The 132 retained expressions are not automatically high-quality. Do not interpret original 500/500 structural coverage as 500/500 usable semantic coverage.

## Release decision
**BLOCK production promotion of the 3,107-expression experimental pack.**
Keep existing Hybrid default unchanged. Keep 12-scene pilot OFF by default.
Do not replace canonical Scene500 data or treat the filtered pack as a deployable substitute (464 scenes would lack any retained expression).

## Next gates
1. Curate natural user-intent paraphrases with provenance, scene boundaries and ambiguity handling.
2. Independently grade query/scene relevance (0–3); allow multiple relevant scenes and no-match queries.
3. Evaluate on held-out queries with NDCG@5, Precision@5, false-positive/no-match rate and latency.
4. Compare against the original Hybrid engine in the real browser, with flag-off parity and rollback.
5. Publish a versioned candidate only after these checks.

Screening reproduction is local: `scene500_filter_generic_v2.py`, with JSON report `scene500_semantic_overlay_500_filtered_v2_qa.json`. These files are **not in this GitHub commit**.
