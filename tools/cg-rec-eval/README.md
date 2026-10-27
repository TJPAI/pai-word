# CG-REC-EVAL isolated baseline · 2026-10-27

Status: **ASSETS COMMITTED; NOT EXECUTED; NOT CERTIFIED; NOT RELEASE READY**

## Source identity
- Main integration HEAD at inspection: `cc2951ceacb016e5ebbc754f0125df70b162f9f3`.
- Scene500 recommendation HEAD at inspection: `f75527bd52fcaad9ddf9a767c2797be59950d3b5`.
- Canonical catalog: `scene500-recommendation/catalog-v0.2.json` blob `0b1e9023eb21e99311b58e82bbe1518c04a63d76` (500 stable IDs).
- Preview deployment source SHA: **not verified**; do not treat repository HEAD as deployed SHA.

## Comparison variants
- `baseline`: real Hybrid result.
- `observed_corrections`: same full Hybrid snapshot passed to `applyObservedQueryCorrections`; this matches existing side-by-side page's concept.
- `action_object`: same Hybrid Top10 snapshot passed to `compareActionObjectCandidates`; enable by `ENABLE_ACTION_OBJECT=1` when that experimental module is present.
- Never interpret `rule_fallback` as Hybrid. The evaluation script explicitly rejects any `engine.mode !== 'hybrid'`.

## Reproducible run
Use a **local checkout of the pinned recommendation revision** with the evaluation files copied into `tools/cg-rec-eval/` (do not alter upstream branch). Provide the actual versioned paths for all three runtime files:

```bash
node tools/cg-rec-eval/evaluate.mjs \
  scene500-recommendation/catalog-v0.2.json \
  scene500-recommendation/zh-core20k-v0101-scene500-runtime.json \
  scene500-recommendation/v094-lexical-associations.json \
  tools/cg-rec-eval/gold-provisional-30.v0.1.json > eval-baseline.json

ENABLE_ACTION_OBJECT=1 node tools/cg-rec-eval/evaluate.mjs \
  scene500-recommendation/catalog-v0.2.json \
  scene500-recommendation/zh-core20k-v0101-scene500-runtime.json \
  scene500-recommendation/v094-lexical-associations.json \
  tools/cg-rec-eval/gold-provisional-30.v0.1.json > eval-action-object.json
```

Resolve real file locations from checkout; never substitute different runtimes silently. Do not confuse the Node timing of a postprocessing step with total end-to-end latency. The script records baseline full search cost and incremental correction cost separately; total corrected query latency is their sum. Node timings do not establish iPhone Safari performance.

## QA / interpretation
- Gold candidate set contains 30 evaluator-authored queries and primary scene IDs. These are **provisional**: evaluator consulted catalog excerpts; unlabelled alternative relevant scenes have not been independently judged. They are not blind certified gold, and metrics can underrate correct alternatives.
- This script is unexecuted pending checkout and asset availability. No 30-case metrics may be published as measurements before an actual run.
- The 24-case author-run CI figures are development-set-only evidence: Top1 4/16 -> 11/16; negative leak 2/5 -> 2/5. Never merge with this provisional set.
- Before promoting a replacement: freeze at least 500 independently adjudicated queries; measure answer relevance on 0/1/2/3 graded labels, per-group deltas and confidence intervals; verify playable-KU eligibility and negative-intent constraints; run cold/hot Safari P50/P95/P99 and old-query-residue E2E.
- No mutation to source algorithm, stable Scene500 catalog, Core20K, SRS or preview is authorized from this branch.
