# Batch 08: 1,700 Scene500 Top100 missing-KU investigation (2026-10-19)

Executed a local read-only join across Scene500 V4.0 original Top100 projection and all 80 SHA-verified Core20K preview chunks.

## Actual findings

- **1,700 of 50,000** scene slots have `selected_ku_id=null`; there are **zero** non-null KU references to missing target IDs in this group.
- These positions represent **824 distinct lemmas**. None has a `sense`-typed KU in the current 20K runtime.
- **1,587 positions / 809 lemmas**: no corresponding preserved Core13K rich source and no existing runtime KU (`washing` is one example). These are primary new-word Sense/KU content gaps.
- **113 positions / 15 lemmas**: preserved Core13K content has **non-Sense** units (e.g. `one`: Number/Grammar, `not`: Grammar, `a`: Grammar/Pronunciation). Their exclusion is an effect of the present Sense-only playable gate, *not a proven content-loss defect*.

## Decisions

1. Keep Scene500 original rank positions. Never fill gaps from rank 101+.
2. Separate the 809-lemma content-build queue from the 15-lemma function-word learning-design queue.
3. For the 15 functional lemmas, evaluate a dedicated Grammar/Number/Function learning mode or a separately approved eligible KU policy. Do not relabel grammar KUs as Sense, or grant automatic playable status.
4. For the 809 lexemes, build editorial candidates with explicit status; no fabricated source verification or arbitrary general gloss.
5. Never treat `null` as an invalid reference to a real KU.

## Persisted results
- Library: `/PAI_Lexicon/core20k_scene500_missing_ku_diagnostics_v2.json`
- Library: `/PAI_Lexicon/core20k_scene500_missing_ku_review_v2.json.gz`
- Source data: frozen V4 runtime projection and 80 Core20K rich preview shards.
- Audit is non-publishable and not browser/device QA.
