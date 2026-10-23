# V1.2 conservative input validity gate

The E5 results show that invalid inputs receive high cosine scores, so invalid syntax must be rejected before E5. This small dependency-free JS module implements a conservative, deterministic **syntax/language gate**. It does **not** decide whether a valid query is within the Scene500 taxonomy.

Run from repository root: `node experiments/scene500-ai-training/v1.2/test-input-gate.mjs`.

Expected on 72 editorial drafts: 68 PASS, 3 INVALID_INPUT (H067–H069), 1 UNSUPPORTED_LANGUAGE (H066). The other 9 provisional no-match queries are semantically meaningful and must **not** be auto-rejected; their labels may be wrong.

Gate order for eventual feature-flag integration: validate syntax -> taxonomy intent/abstention (separately calibrated) -> E5 top10 -> optional rerank -> fallback. Do not change production in this experiment. This gate has not been independently evaluated on a sealed test set.
