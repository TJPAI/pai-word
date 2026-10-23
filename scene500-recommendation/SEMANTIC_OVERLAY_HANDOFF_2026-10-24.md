# Scene500 experimental semantic overlay — handoff (2026-10-24)

**Status: RESEARCH ONLY — NOT production-ready.** This note is an integration handoff, not an approval to replace the default recommender.

## Verified repository baseline
- Repository: `TJPAI/pai-word`
- Working branch: `scene500-recommendation-dev`
- Existing engine: `scene500-recommendation/engine.mjs` (`ENGINE_VERSION=1.0.0-alpha.1`, checked on this branch)
- Do not change `main` or the default recommendation path as part of this handoff.

## Research results (local evaluation, NOT verified with the repository's original engine)
- Catalog: 500 scenes.
- Experimental overlay: 500 scenes / 3,035 candidate expressions; most were generated from catalog templates and are **not independently verified semantic paraphrases**.
- A subsequent candidate batch added 72 natural-language expressions for 36 scenes.
- On a 192-query development collection, combined text retrieval achieved 158/192 target-in-Top5 **under original labels**. Subsequent label reviews flagged at least 17 questionable target labels; do not use this score as a production metric.
- A separate 50-query exploratory check found 37/50 -> 39/50 target-in-Top5 for the second batch, including one regression.
- The 192-query graded-relevance queue has 1,271 candidate query/scene pairs; none has completed independent review. Do not report NDCG@5 until labels are adjudicated.
- No pretrained Chinese embedding model has been validated in the integrated browser runtime.
- Existing local prototype TF-IDF, LSA and phrase-rule results are **not** evidence of original Hybrid engine performance.

## Recommended controlled integration
1. Preserve current Hybrid default and all existing homepage, learning, KU/SRS behavior.
2. Add an OFF-by-default feature flag for experimental semantic retrieval. A failed load or invalid schema must fall back to Hybrid.
3. Keep experimental overlay separate from canonical Scene500 catalog and lexical associations. Require a schema version, scene-id validation, provenance and rollback.
4. Avoid treating exact phrase memorization or generated template text as semantic model validation.
5. QA: new search must replace stale results; empty/negative queries must not force irrelevant scenes; repeatable rankings; no duplicated scene IDs; fast initial page load; no modifications to learner state.
6. Acceptance gate: independently adjudicated multi-label relevance (0–3), held-out queries, NDCG@5 / Precision@5, no-regression checks and browser performance measurements.

## What is NOT delivered
This repository note does not include the large local experimental JSON artifacts or an integrated production semantic module. The main developer must not claim those files are available on GitHub based on this note. Request a versioned, independently checked artifact before enabling the feature.
