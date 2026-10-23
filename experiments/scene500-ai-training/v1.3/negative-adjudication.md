# V1.3 — provisional no-match adjudication queue

This is a **review queue, not a relabeling or new gold test set**. Derived from the actual 72-result E5 report supplied by Muse. It preserves all original draft labels unchanged.

Original results: https://drive.google.com/file/d/1vX99uOAQM8lcmJiOCJ6I0VV-rJvT3z_e/view?usp=drivesdk

| ID | Input | E5 Top1 | Score | Next action |
|---|---|---|---:|---|
| H060 | A quantum superposition experiment | S156 | .77793 | Human adjudicate physics scene |
| H061 | 拉格朗日乘数法 | S214 | .84032 | Human adjudicate advanced math |
| H062 | 形而上学是什么 | S500 | .84882 | Human adjudicate philosophy |
| H063 | What is dark matter | S292 | .76278 | Human adjudicate astronomy |
| H064 | 宏观经济模型里的通货膨胀 | S066 | .85125 | Human adjudicate economics |
| H065 | 三角函数的恒等变换 | S071 | .84190 | Human adjudicate mathematics |
| H066 | ㅎㅇㅂㅈㄷ | S054 | .79064 | Unsupported language / invalid for zh-en |
| H067 | 🍎🍎🍎 | S139 | .85359 | Invalid emoji-only |
| H068 | 000000000000 | S292 | .82484 | Invalid digits-only |
| H069 | ??? | S489 | .81487 | Invalid punctuation-only |
| H070 | 我想学高等数学 | S161 | .85785 | Human adjudicate advanced math |
| H071 | 电磁场的麦克斯韦方程 | S156 | .83379 | Human adjudicate electromagnetism |
| H072 | I need to learn calculus | S159 | .83741 | Human adjudicate advanced math |

## Decision policy

- H066–H069 are syntax/language invalid, **not evidence of out-of-taxonomy semantic detection**.
- H060–H065 and H070–H072 remain **UNADJUDICATED**. Do not silently treat their draft empty labels as true negatives.
- Reviewers must see the complete canonical Scene500 taxonomy and define whether each query has 0, 1, or multiple acceptable scene IDs. They must document a rationale and disagreements.
- Any evaluation or calibration must be on a separately sealed set. Do not select a cosine threshold from these 13 queries.
- For valid but uncertain inputs, an interim product fallback can show a non-committal list of suggested scenes without claiming an exact match; this is a product policy, **not** calibrated rejection.

## Implementation priorities

1. Keep V1.2 deterministic invalid-input gate separate from semantic relevance.
2. Construct a new independent review set of meaningful out-of-taxonomy and in-taxonomy queries, including adjacent topics.
3. Require taxonomy-aware human adjudication before labeling semantic no-match.
4. Compare alternative taxonomy membership classifiers on sealed data, then calibrate abstention by language.
5. No production changes or threshold-based reject until evidence exists.
