# Scene500 experimental negation rerank — QA gate (2026-10-25)

**Decision: BLOCKED / DO NOT WIRE INTO PRODUCTION.**

Evidence: Muse independent QA against remote HEAD `74535e69f2629cd5095a5ad4edd73abe1cf50a78`; original artifacts are in owner-controlled Google Drive. The reviewer ran the actual V0.10.1 Hybrid, not a mocked scorer.

## Reproducible baseline and results

- Catalog SHA256: `35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8`
- Chinese Core20K V0.10.1 SHA256: `18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093`
- Associations SHA256: `d6de9818f5056330b6d57d6b7c728a1457e66a4d241aac173ba7eb1c5f770213`
- Structural Runtime QA: `PASS_RUNTIME_STRUCTURAL_ONLY`; semantic certification **not** implied.
- Catalog-seeded 200 (data leakage; diagnostic only): baseline Top5 200/200, candidate 197/200; 0 improved, 3 regressed.
- Reviewer-authored 36 (QA-adjudicated, **not certified gold**): baseline Top5 27/36, candidate 22/36; Top1 23/36 -> 19/36; 0 Top5 improvements, 5 regressions.
- Candidate remains opt-in only; do not import it from `engine.mjs`, `chinese-lexicon-loader.mjs`, or `contract-adapter.mjs`.

## Must-pass regression gates before any promotion

| ID | Query | Required target | Failure to prevent |
| --- | --- | --- | --- |
| CAT160 | 我想了解表达不同意见该怎么用英语说 | S394 | 不同 must not negate 同意 |
| CAT174 | 我想了解拒绝请求该怎么用英语说 | S432 | Learning about refusal is not refusing to learn |
| CAT177 | 我想了解不同意该怎么用英语说 | S438 | Negation-topic metalinguistic guard |
| R06 | 虽然不想开会，但还是要参加项目会议 | S183 | Final positive intent must win |
| T01 | 开会时想委婉地说我不同意，该怎么表达 | S394 or S438 | Preserve disagreement expression |
| T03 | 怎么用英文说“我不同意” | S438 | Preserve quoted expression |
| T06 | 拒绝Offer之后怎么回复对方 | S218 | Refusal is context, not scene exclusion |
| C04 | 在图书馆安静复习，但是找不到座位 | S135 | Problem statement must not negate venue |
| R02 | 一开始不想坐公交，最后还是坐了公交 | S078 | Aspect-particle positive recovery |
| R03 | 不是不去图书馆，而是不去咖啡馆 | S135 | Avoid substring false flags and zero-score ties |

## Acceptance criteria for a NEW candidate

1. The baseline Hybrid output must remain unchanged unless an explicitly opt-in candidate is invoked.
2. All cases above must retain their intended target in Top5, with no regression against the baseline.
3. Do not use substring-only negation or a flat `score - 100` clamped to zero.
4. Independent, human-adjudicated query set: no Top5 regressions versus baseline, and a measurable benefit on explicit negation + replacement; report Top1, Top5, changes and false demotions separately.
5. English and mixed-language retrieval gaps are **separate baseline issues**, not evidence for negation rerank.
6. Run real V0.10.1 Hybrid A/B and browser E2E before production approval; unit tests and catalog-derived examples cannot certify semantic quality.

**Status:** `BLOCKED_QA_REGRESSION`. No production promotion authorized. No changes to SRS or learner data.
