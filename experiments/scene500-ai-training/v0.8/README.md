# Scene500 v0.8 — evaluation integrity and result analysis

## Completed
- Added `qa-inputs.mjs`: deterministic source catalog ID/name checks, weak-training size, evaluation size, 1–20-unit input checks, valid scene labels, duplicate training strings and exact train/evaluation overlap checks.
- Added `analyze-results.mjs`: consumes **actual** v0.7 E5 report (not fabricated predictions), validates ranked output, calculates editorial Recall@1/5/10 and MRR@10 by language, and saves descriptive similarity sweeps.
- Confirmed model hosting: `Xenova/multilingual-e5-small` has 118 MB int8 ONNX weights and 17.1 MB tokenizer.json (plus metadata). Its browser startup footprint is too large for unconditional first-screen loading. Model card: https://huggingface.co/Xenova/multilingual-e5-small/tree/main/onnx .
- Environment constraints independently tested: PyTorch and scikit-learn are installed, but no cached embedding model weights or Transformers/ONNX runtime are present, and the runtime cannot resolve huggingface.co. E5 inference **not executed**. No accuracy claim.

## Commands (run at repo root)

```bash
node experiments/scene500-ai-training/v0.8/qa-inputs.mjs
npm install --no-save @huggingface/transformers@^3
node experiments/scene500-ai-training/v0.7/eval-e5.mjs
node experiments/scene500-ai-training/v0.8/analyze-results.mjs experiments/scene500-ai-training/v0.7/e5-results-local.json
```

`analyze-results.mjs` will fail if the E5 report is absent or invalid. The evaluation data are single-pass editorial and previously used for diagnosis; their scores must not be treated as final gold accuracy. Do not tune abstention thresholds on this holdout; obtain a separate independently reviewed dev set and sealed test set.

## Design decisions
- Keep existing Scene500 recommender unchanged while evaluating embeddings.
- No raw model weights, generated fake vectors, or mock model metrics committed.
- Separate `out_of_taxonomy`, `ambiguous`, `noise`, and `task_with_domain` abstention classes before training a rejection classifier.
- Require a measured improvement on a new sealed multilingual test and mobile Safari cold-start p95 before integration.
