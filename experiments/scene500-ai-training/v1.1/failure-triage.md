# E5 v1.1 failure triage — 72-case diagnostic set

Source: actual Muse E5 results ZIP in connected Google Drive: https://drive.google.com/file/d/1vX99uOAQM8lcmJiOCJ6I0VV-rJvT3z_e/view?usp=drivesdk

## Verified error inventory

Of 59 positive editorial draft queries, 48 expected scene(s) are in Top5, 52 in Top10, and 7 are absent from Top10. Therefore **11 Top5 misses** comprise **4 ranks 6–10** and **7 rank >10**.

| ID | Language | Query | Expected | Actual top1 | Expected rank |
|---|---|---|---|---|---|
| H027 | zh | 想设计低功耗传感器 | S288 | S157 | 6 |
| H028 | en | Let's discuss network protocols | S289 | S081 | 6 |
| H030 | zh | 我想学写前端网站 | S296 | S139 | >10 |
| H031 | zh | 程序一直报错我不知道怎么排查 | S297 | S275 | >10 |
| H035 | zh | 我要让聊天机器人回答得更好 | S278 | S034 | >10 |
| H038 | en | Where can I find peer reviewed papers | S152 | S168 | >10 |
| H041 | en | Could you help me polish my CV | S203 | S208 | >10 |
| H046 | en | This supplier delivered the wrong items | S236 | S238 | >10 |
| H051 | zh | 我晚上总是睡不着怎么办 | S324 | S025 | 6 |
| H057 | zh | 请帮我比较两个产品的优缺点 | S491 | S227 | >10 |
| H058 | en | What evidence supports this argument | S495 | S154 | 6 |

## Failure patterns and corrective direction

- **Semantic mismatch**: H035 routes a chatbot quality question to S034 food ordering. Investigate passage contamination and spurious similarity before trying reranking.
- **Near-neighbor competition**: H041 CV polishing retrieves self-introduction (S208) instead of resume preparation (S203); H046 supplier delivery issue retrieves an adjacent scene (S238). Review multi-label acceptability with independent adjudicators.
- **Technical-domain coverage**: H027, H028, H030, H031 expose weak separation among electronics, network protocols, web development and debugging.
- **Broad abstract intent**: H057, H058 are difficult to map to a single scene. Verify whether their labels represent actual taxonomy membership before treating them as model errors.
- **No-match / invalid input**: 13 draft negative examples have cosine overlap with positives; 10/13 score >= 0.80. Do not threshold cosine for production abstention.

## Proposed gate before pilot integration

1. A deterministic lexical validity check (empty/punctuation-only/emoji-only/repeated-noise) **before** E5.
2. An independent taxonomy membership / query intent classifier with an explicit reject outcome; keep its training and calibration labels separate from the 72-case development set.
3. Retrieve E5 Top10, then apply a **constrained** cross-encoder or domain-aware reranker to the Top10; preserve E5 results as fallback and record reason codes.
4. Build a new sealed, independently reviewed evaluation set (Chinese/English, valid in-taxonomy, valid out-of-taxonomy, garbage, adjacent ambiguous scenes).
5. Performance test on actual iOS Safari: reported Muse peak process memory 724.7 MB is a warning; server-side or opt-in lazy loading may be preferable.

No production deployment or threshold selection is justified by the present 72 development examples.
