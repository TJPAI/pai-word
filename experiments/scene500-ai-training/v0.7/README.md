# Scene500 V0.7 — multilingual semantic retrieval experiment

## Outcome
A **runnable but not yet executed** offline evaluator for the real `Xenova/multilingual-e5-small` multilingual embedding model, using the same frozen 72 V0.6 prompts as the TF-IDF / anchor baselines. The 500 canonical scene IDs/names are cross-checked against `v0.1/catalog.json`, and passages are constructed from the live recommendation catalog (`scene500-recommendation/catalog-v0.2.json`).

We inspected the current ChatGPT container: PyTorch and scikit-learn are installed, but no local Transformers / sentence-transformers / ONNX Runtime or cached model weights exist. This environment cannot download model weights due to DNS restrictions; therefore **no E5 embeddings or predictions were generated**, and no E5 accuracy is claimed.

## Reproduce (Node >=18 with internet)
From the root of `TJPAI/pai-word`, after checking out `scene500-ai-training-pilot`:

```bash
npm install --no-save @huggingface/transformers@^3
node experiments/scene500-ai-training/v0.7/eval-e5.mjs
```

Results are saved locally to `experiments/scene500-ai-training/v0.7/e5-results-local.json`. The output must be inspected before committing; don't commit unverified model metrics. For supported machines, set `SCENE500_E5_DEVICE` or `SCENE500_E5_BATCH` to tune inference behavior.

**Important runtime cost:** Hugging Face's Xenova E5-small model provides ~118 MB q8 ONNX weights plus tokenizer data (~17 MB); these are not appropriate for blocking mobile Safari homepage startup. The model must run **as an optional deferred enhancement** if latency, memory and offline packaging gates pass. A server/precompute route or smaller distilled model may be needed. The test is for retrieval quality first, not permission to deploy.

## Evaluation contract
- Frozen prompts: `v0.6/unseen-evaluation-draft.jsonl`: 72 queries, 59 editorial positive drafts and 13 provisional no-topical-match/noise drafts.
- Char-TFIDF baseline: 18/59 provisional top-5 recall, English 0/18, for comparison only.
- E5: **not run**; this script will report top-1/top-5/top-10 and p50/p95 query inference time after a successful local execution.
- No numeric similarity threshold, no-match precision, or calibrated ranking scores should be claimed at this stage. The script deliberately always reports its top-10 candidate ranking, even for inputs where abstention is intended.
- The labels are **single-pass editorial**, not independently verified gold; literal text leakage checks alone do not prove semantic isolation. This frozen set has already been used in development diagnostics: use a NEW sealed, blind test after selection and calibration.

## Integration gate — all required
1. Independently verified multilingual test split, plus no-match and ambiguous contexts.
2. Multilingual Recall@5 and MRR@10 better than the legacy baseline by meaningful margin; identify confidence intervals / sample sizes.
3. Measured iPhone Safari first-load bytes, cache size, cold start latency and query p95; no main-thread UI blocking.
4. Explicit abstention calibrated on separate dev set, *then* evaluated on sealed test; don't equate high cosine with a valid Scene500 match.
5. Fallback to existing Scene500 rule/hybrid engine when embedding model is unavailable.
6. Stable S001–S500 mapping; no mutation of KU/SRS, study data, or preview app.

No production branches or deployed previews changed.
