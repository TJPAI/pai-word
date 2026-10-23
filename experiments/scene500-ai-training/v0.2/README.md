# Scene500 AI training pilot V0.2 (isolated)

## Source of truth
Canonical IDs: `data/scene500-taxonomy-20x25-v1.txt` (S001–S500), NOT the conflicting `data/scene-taxonomy-v2.json` mapping.
Preview `home-perf-safe-load-20261022/rebuild-preview/scene-index.json`, `scene500-names.js`, and `scene500-recommendation/catalog-v0.2.json` were checked against all 500 canonical IDs and names; 0 mismatches.

## Contents
- `weak-semantic-seeds.jsonl`: 2,158 **unreviewed, weak-label** samples (885 catalog aliases, 749 actions, 524 example queries), deduplicated by query. First-seen conflicting weak labels are NOT merged; review is required.
- `evaluation-draft.jsonl`: 61 held-out examples; 49 have candidate scene labels, 12 have empty *unverified* labels indicating either out-of-taxonomy topic or candidate rejection. NEVER count those as confirmed no-match.
- `manifest.json`: source provenance, exact blob SHA, and quantities.
- `train_baseline.py`: offline char TF-IDF nearest-neighbor baseline for diagnostic predictions. Runs with `python -m pip install scikit-learn` and `python train_baseline.py --query 'machine learning'` from this folder. No model artifact produced yet.

## QA performed
- 500 real IDs and display names match the performance-preview branch.
- 2,158 weak samples: 0 duplicate query strings, 0 invalid scene IDs, 0 query units above 20 by regex rule.
- 61 evaluation query strings: no exact overlap with these weak samples.
- Evaluation labels not independently reviewed, so all accuracy metrics currently **not available**.

## Limitations / next gates
1. Audit label ambiguity and hard negatives. This 2,158-row set covers only partial semantic variety and is not a gold corpus.
2. Convert a stratified set of evaluation records to gold, add confirmed out-of-scope and noisy-input negatives, and lock it before hyperparameter selection. Separate final test from dev calibration.
3. Run model on actual saved data in a suitable execution environment, record metrics and model SHA; no trained model or validated predictions exist yet.
4. Evaluate separately by language (zh/en/mixed), 1–20 unit length, ambiguity, long-tail subject, no-match; benchmark low-end Safari before deployment.
5. Never modify `main`, `core20k-rebuild-v1`, or `home-perf-safe-load-20261022` from this pilot.
