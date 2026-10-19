# Batch 11 — Numeric invariants audit (2026-10-19)

## Actually executed on frozen data
Inputs: real `Core20K_Runtime_Unified_20000.json.gz` (20,000 headwords) and `Scene500_Core20K_V40_RuntimeProjection.json.gz` (500 scenes, each original rank 1–100).

* Checked all 50,000 original positions for rank / lemma identity and no within-scene duplicate headword.
* Eligible exactly 22,227, blocked 27,773. Scene counts are unique eligible headword/KU **pool size**, not unlearned remaining and not scenario-sense dictionary certification.
* Difficulty pool position counts: all **22,227**, basic (rank ≤4,000) **14,781**, common (4,001–8,000) **5,162**, advanced (8,001–11,000) **1,896**, high (>11,000) **388**; sum matches 22,227.
* Examples S001 **32**, S002 **44**, S500 **56**.
* Independently executed 52,500 numeric-boundary model cases across 500 scenes, 3 round limits (10/25/50), 7 due sizes, 5 progress examples: 0 ≤ completed ≤ session total ≤ round limit. **This is a model test, not actual browser execution.**
* Detailed scene count JSON saved Library `/PAI_Lexicon/core20k_numeric_contract_audit_v1.json`.

## Code changes (isolated preview only)
1. Preview home now distinguishes "Scene500 still loading" / network failure from genuinely zero eligible words, preventing misleading zero counts.
2. Preview learning-progress numerator counts distinct valid completed KU keys and clamps to fixed session denominator; reviewed in code, not runtime-proven.
3. Preview scene round queue is capped at the user's configured size: due first, then fresh to fill remaining slots. Reinforcement also caps at configured size; remaining due KUs remain eligible for later rounds. Previous logic permitted due + full fresh, exceeding the displayed "per round" setting.
4. Preview bootstrap uses only `rebuild-preview/{learning-runtime,home-dashboard,round-policy}.js`; Pages root scripts and `main` untouched.

## Important outstanding issues
- Existing `state.records` / daily counters need an end-to-end interactive browser QA using persisted learner fixtures, including refresh, simultaneous actions, corrections, and both swipe/tap flow.
- Generic today/review/free and topic paths may differ in their batch semantics; these are not claimed fully reconciled with the 10/25/50 scene-round cap.
- Some session behavior still initializes through original `openScene` before the overlay changes the queue. Verify no double loader or first-utterance race in Safari.
- GitHub Pages URL cannot be directly exercised from current browser tools. No claim of real Safari pass.
