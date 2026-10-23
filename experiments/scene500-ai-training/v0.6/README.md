# PAI Word Scene500 v0.6 — unseen-expression baseline comparison

This phase uses 72 newly authored prompts against the frozen v0.2 training data and v0.5 anchor rules. There are **zero exact query overlaps** with v0.2 train, v0.2 evaluation draft, or v0.4 editorial hardcases (NFKC, lowercased, spaces collapsed). It is NOT a blinded gold test and was authored after earlier failure inspection.

## Results (diagnostic only)

- Draft positives: 59; provisional topic/noise abstentions: 13.
- Character n-gram TF-IDF nearest-neighbor baseline at cosine >=0.35: draft target in top five **18/59**, Chinese **18/41**, English **0/18**; predicts at least one scene on **3/13** provisional abstentions.
- Anchor-first + same TF-IDF at cosine >=0.35: **18/59**, Chinese **18/41**, English **0/18**; predictions on **3/13** provisional abstentions.
- Anchor matching is a small known-phrase list; zero gain on unfamiliar natural expressions is unsurprising. Development-set `14/14` from v0.5 must not be presented as generalization accuracy.

## Diagnosis

Core limitation is semantic transfer between paraphrases and languages. English `I would like to reserve a room` → wrong S195 rather than S113. Chinese `我准备创建一个新账户` → S007 rather than S254. More hard-coded phrases risk overfitting; adding rules against this test set would invalidate this evaluation.

## Next gate

1. Blindly annotate a stratified evaluation set with a second reviewer; explicitly distinguish `no topical scene`, `intent present`, `ambiguous`, and `noise`. Final held-out test must remain untouched during tuning.
2. Evaluate multilingual embedding retrieval (Chinese/English) against canonical 500-scene descriptions/aliases, optionally rerank with an inexpensive small classifier. Compare model sizes, Safari latency, offline cache size, and abstention calibration.
3. Include baseline at fixed setting and measure per-language Recall@5, MRR@10, false-match rate and coverage. Train/dev/test split by **meaning/paraphrase cluster** rather than only exact string to prevent semantic leakage.
4. No main app changes without passing a controlled gate. No independently verified gold, generalizable AI model, or browser benchmarking exists at v0.6.

Files: `unseen-evaluation-draft.jsonl` (72 items), `baseline-comparison.json` (full diagnostic outputs). Implementation used in-memory JS character 1–3-gram TF-IDF with IDF `log((N+1)/(df+1))+1`, binary features and cosine score, retaining per-scene max and threshold 0.35; anchor-first combines 13 rules before baseline.
