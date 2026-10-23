# Scene500 E5 V1.4 — Muse actual A/B delivery review

Source ZIP: https://drive.google.com/file/d/1bE5bRPnow_90djpE6MrdiLSyEYC86su1/view?usp=drivesdk

This is a review of supplied **actual inference** results, not a new inference run. ZIP has five files; archive integrity check passed. Source run: CPU, Node v24.22.1, transformers.js 3.8.1, q8 multilingual-e5-small. Development labels are single-pass editorial and unverified.

| Config | R@1 | R@5 | R@10 | MRR@10 |
|---|---:|---:|---:|---:|
| A0 historical rich passage | 31/59 | 48/59 | 52/59 | 0.6472 |
| A1 short old passage | 27/59 | 37/59 | 45/59 | 0.5367 |
| B new text + intents + boundary | 37/59 | 51/59 | 55/59 | 0.7335 |
| B1 description only | 34/59 | 51/59 | 53/59 | 0.7031 |
| B2 description + intents | 39/59 | 52/59 | 54/59 | 0.7509 |

A0 was exactly reproduced on all 72 Top10 rankings. Strict construction-controlled comparison is B versus A1; B2 has highest R@1/R@5/MRR, B highest R@10. On English, B2 Top1 8/18 versus historical A0 9/18; further work required.

H035 severe failure corrected to S278. H041 remains weak and H046 absent from Top10. No claim of semantic abstention; 9 meaningful provisional negatives need adjudication. Boundary text reduces ranking metrics and should remain metadata, not be embedded wholesale.

**Blocking before integration:** test A0 rich passage + replacement descriptions (NOT_RUN); independent gold holdout (NOT_RUN); mobile/browser runtime (NOT_RUN). Do not cherry-pick overrides using these same 72 development queries.

Recommendation: keep all 229 candidates on experimental branch; use B2 as *provisional* candidate; compare A0-rich+new and B2 on a sealed independent evaluation before shipping.
