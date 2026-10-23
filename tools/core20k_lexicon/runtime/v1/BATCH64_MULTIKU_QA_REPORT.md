# Core20K Batch64 — six-family KU baseline and gated consumer extension

Source: local Library Core13K V26.7O master SHA256 `4f709dfe4fa806ee53cc78985daa26eaa055309f3a96066f78a695e01dc9f949`, 13,000 words, **16,818 old KU**.

Real legacy type breakdown: Sense 16,253; Grammar 256; Collocation 99; Contrast 50; Pronunciation 27; Usage/Risk grouped from usage(25)+risk(17)+usage_risk(10) = 52; **other nonautomatically mappable 81** (polysemy 55, morphology 7, pragmatics 6, discourse 5, degree 3, function 2, number 1, adverb 1, word_order 1). Mapped six categories 16,737. Historical statuses are not Production Ready.

Among **legacy rank <=1000**, 2,890 candidate KUs belong to six types. Real 100-headword prioritized workset contains **407 KUs**: Sense 224, Grammar 126, Collocation 29, Contrast 9, Pronunciation 11, Usage/Risk 8. These are **review candidates**, not certified KU and not automatically identical to frozen Core20K top1000 until rank+ID crosswalk is completed. Original stable KU ids preserved.

Local reproducible audit+full candidate JSONL ZIP `core20k_multiku_batch64.zip` delivered to user; underlying JSONL not yet in GitHub.

Added actual source code `runtime/v1/multiku-contract.mjs` and `multiku-contract.test.mjs` to lexicon production branch. This is **additive quality gating**, not a modification to the current consumer. Current `scripts/core20k-versioned-pack-gate.mjs` supports arbitrary KU types structurally, but the **existing learning adapter is still Sense-only**. No multi-type KU is declared playable until consumer synchronization and E2E QA. Source code has not yet been run in GitHub Actions; no remote PASS claimed.

**Runtime pack/v1 remains empty and blocked** (`release_eligible:false`, 0 certified KU). Zero newly Production Ready, zero Scene500 learner mappings. Next: obtain independent direct evidence and editorial signoff for selected 100-word workset, precise existing KU identity/rank crosswalk, type-specific real prompt/answer/example check, POS IPA check; then nonempty pack built only from accepted records. No changes to main, stable app, or consumer branch.