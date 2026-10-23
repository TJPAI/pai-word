# Scene500 AI semantic pilot — 2026-10-23

Input: actual V0.10.1 unlinked-term manifest (18,304 candidate content terms in 458 jobs) and real 500-scene catalog.

First editorial pilot contains **16 term-scene contextual suggestions** with stable `term_id`, scene ID, a Chinese semantic rationale and a counterexample for each. This is **NOT a run of an external AI inference API** and **NOT independent review**. The dataset is an editorial sanity check to calibrate future AI work, not an approved release.

Key observations:
- Batch 1 contains numerous generic function expressions (e.g. 一个, 我们, 没有, 可以) whose `stopword_hint` was false. Filtering solely on this hint is insufficient for cost-effective AI batch inference.
- A contextual relation is not necessarily the best Top5 scene recommendation. Example: 法院→法律咨询 is contextually related but may be generic or require sense disambiguation. Such links must be rejected if a stricter semantic review cannot justify them.
- Batch input must prioritize distinctive nouns/actions and abstain on ambiguous or generic words; otherwise full 18,304-word execution will burn model tokens without proportional gain.
- Recommended judge fields: `term_id`, `scene_id`, `rationale_zh`, `counterexample_zh`, `relation_type`, `evidence_source`, `confidence`, `review_verdict`. Never auto-promote based only on model agreement.

Local pilot JSON SHA256: `5e87203584d81862a3d856a666a3d188fbc12178832230cac9c7e640bcc19b17`.
No production links added, no claim of AI batch execution.
