# Scene500 E5 v1.1 — actual Muse execution results

**Status:** model inference actually executed by Muse, result archive retrieved from user-connected Google Drive and independently parsed and recomputed in GPT-6 chat sandbox on 2026-10-24. **Not production-approved.**

Original archive: https://drive.google.com/file/d/1vX99uOAQM8lcmJiOCJ6I0VV-rJvT3z_e/view?usp=drivesdk

Archive contains four artifacts: `scene500-e5-results.json` (all 72 Top10 rankings), `scene500-e5-results.analysis.json`, `scene500-e5-runtime-qa.json`, and `scene500-e5-execution-report.md`. ZIP CRC check passed. This README does not replace the original raw artifacts.

## Independent consistency check of raw results

| Language | Positive draft labels | Recall@1 | Recall@5 | Recall@10 |
| --- | ---: | ---: | ---: | ---: |
| Chinese | 41 | 22 | 35 | 37 |
| English | 18 | 9 | 13 | 15 |
| Combined | 59 | 31 | 48 | 52 |

Prior draft-baseline Recall@5: 18/59 total; 18/41 Chinese; 0/18 English. E5 draft-set Recall@5: **48/59** total. E5 report MRR@10: **0.647175**.

The 13 provisional no-match examples have median Top1 cosine **0.83741**; **10/13** score at least 0.80. Do not use raw cosine threshold for rejection. For H035 (`我要让聊天机器人回答得更好`), expected S278 but E5 Top1 was S034 (score **0.87662**), a severe semantic mismatch.

Runtime evidence reported by Muse: q8 multilingual-e5-small, 384 dimensions, 500 scenes, model load 1,554 ms, query p50 6 ms/p95 23 ms, peak process memory 724.7 MB, total cold evaluation ~10.4 s; cache rerun ~3.9 s. Runtime values were not independently reproduced by GPT-6.

## Next stage

1. Do not modify production or main. Preserve current recommender as fallback.
2. Build independently adjudicated multilingual test labels and a separate calibration set.
3. Design an explicit no-match / invalid-input gate separate from embedding cosine.
4. Evaluate reranking of ambiguous near-neighbor scenes; fix semantic mismatch such as H035.
5. Compare client memory/startup and lazy-loading alternatives on real iOS Safari before controlled feature-flag rollout.

**Caution:** 72 examples were previously seen during development and only have single-pass editorial draft labels. These are diagnostic development-set results, not an unbiased generalization estimate.
