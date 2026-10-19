# Numeric counter audit — executed checks (2026-10-19)

The following were **actually checked** against the frozen Core20K word table, Scene500 V4 original Top100 projection and the current GitHub preview JavaScript (V8 isolated harness, not browser automation):

* 500 scenes, 50,000 Top100 positions; 22,227 conservative eligible positions, 27,773 blocked.
* Four rank-difficulty groups: 14,781 + 5,162 + 1,896 + 388 = 22,227; S001=32, S002=44, S500=56.
* Original per-scene ranks and headword identity verified. Each count represents scene positions, NOT globally unique words.
* 52,500 boundary tests of the numeric model over scene inventory/round sizes/due cases.
* 12 actual released preview round-policy executions with different due/new KU mixes: one Scene500 session initiation, unique queue, correct cap, due-first, daily fresh budget.
* 7 actual policy executions for daily quota defaults and migration, plus 3 actual home dashboard executions for loading/error/ready counts.
* Four JavaScript source files parsed successfully: preview bootstrap, learning runtime, home dashboard, round policy.

## Bugs fixed in isolated preview only

1. Count 0 distinguished from Scene500 pool loading/error.
2. `n/m` and done-page summary share a distinct completed KU count, bounded by fixed initial session total; a wrong first attempt is requeued without incrementing completed.
3. Round size caps **total** Scene500 KU count, not due KUs + all allowed fresh KUs.
4. Scene500 candidate filtering excludes due KUs **before** applying fresh quota. Old order underfilled sessions: round cap 30, 7 due, 20 available fresh wrongly scheduled just 20 total; fixed to 27.
5. Original daily new-word and round choice options both 10/20/30/50, defaults 20 in preview, restoring alignment between quota display and allocation.
6. Eliminate double-start of Scene500 session by calling preview-specific single-start function.

## Scope limits

No claim of real iPhone Safari or complete browser state-machine QA. Today, review, free-review and topic session count contracts need separate runtime QA, and localStorage refresh/multi-action tests remain outstanding. Do not claim editorial verification of scene-specific senses, nor change `main` or official root UI.

Detailed 500-scene data result: Library `/PAI_Lexicon/core20k_numeric_contract_audit_v1.json`.
