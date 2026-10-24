# Explicit replacement candidate V2 — preliminary QA (2026-10-25)

**Status: EXPERIMENTAL / NOT PRODUCTION READY.**

- The exact candidate implementation from GitHub was reproduced locally and its eight isolated unit scenarios passed with Node v22.16.0.
- A further smoke check against the **real pinned** Scene500 catalog `catalog-v0.2.json` (SHA256 `35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8`) exposed a **recall gate problem**. The check supplied all 500 scene IDs as candidate rows (not real Hybrid ranks); it tested only whether the reranker recognized explicit pairs, **not recommendation quality**.

| Query | Pair detection against real catalog |
| --- | --- |
| 不要坐地铁，改坐公交 | NOT APPLIED |
| 不要点外卖，自己在家做饭 | NOT APPLIED |
| 不要开车，改坐地铁 | NOT APPLIED |
| 不想去快餐店，改去中餐馆吃饭 | APPLIED (S030 -> S031) |
| 不要吃快餐，改吃自助餐 | NOT APPLIED |

**Interpretation:** The exact-phrase anchor gate is too restrictive for ordinary variants, even when the scene exists. Example: catalog S078 is named `乘公交车` and aliases include `坐公交`; the candidate's prefix parser consumes `改坐`, leaving `公交`, which does not contain the longer alias `坐公交`. The first unit test uses an artificial `公交` alias, so it does not expose this mismatch.

**Do not broaden substring matching without independent regression tests**: the V1 failure included `不同` / `同意` false negation, `图书馆` / `图书` and `找不到座位`. Any V2 change must be measured against the pinned 36 reviewer-authored cases, the 200 catalog-seeded diagnostics, and the 10 blocked regression gates in `NEGATION_RERANK_QA_GATE.md`.

The actual V0.10.1 Hybrid A/B and browser E2E have **not** been executed for V2. No SRS, learner data or production engine changes.
