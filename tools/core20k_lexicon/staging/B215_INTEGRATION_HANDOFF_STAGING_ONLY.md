# B215 English Core20K Teaching Overlay — Integration Handoff (STAGING_ONLY)

## Verified GitHub sources (2026-10-25)
- Production lexicon branch: `core20k-lexicon-production-v1`, tree/HEAD `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`.
- QA branch source examined: `core20k-teaching-qa-b162-20261024`.
- Main integration branch: `home-perf-safe-load-20261022`, tree/HEAD `16881c29839c8fefd303528de4915e87ae58b4fc`.
- Candidate: `tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json`; Git blob `2d7e17509adaec37c04cb5854549ca51a62d864a`.
- Manifest: `tools/core20k_lexicon/runtime/v1/batch93_nonrelease_manifest.json`; schema `pai-core20k-teaching-pack-v1`; recorded pack size 13,900 bytes; recorded SHA-256 `21d831519abdda34fadef88a601655373750ddf3385ea98d27370cfe2b1eec15` (manifest claim; not independently recomputed in this audit).
- Manifest source_commit_sha `59bfbbb1bae0c5420c43e2f1f8a14af047fda42e` (historical pack provenance; not current branch HEAD).

## Coverage and release decision
- 6 records / 6 distinct headwords: person, time, know, people, talk, here.
- 6/6 example_en, 6/6 example_zh; 0/6 collocations, 0/6 usage_note_zh, 0/6 contrast.
- All 6 have `content_certified:false` and `production_ready:false`. Batch92 QA explicitly reports 6 AI-reviewed, 0 human-editor certified, 0 L3 production-ready.
- **PRODUCTION_READY = 0; formal deployable teaching KU = 0.**
- B160 audit: 290 candidate KU, 0 semantically certified, 0 release eligible; this is not a publishable pack.
- B184: 4 phrase candidates, provisional only; missing formal sense and KU IDs, source licensing, and phrase IPA.

## Important identity warning
- Batch93 `ku_id` values have legacy form `w_..._ku01`. The current `pai-core20k-runtime-v1` uses an authoritative KU index. Do not infer equivalence from word spelling or rank.
- This audit has **not established exact current-Runtime KU ID matches for these six records**; runtime KU match count is UNKNOWN, not 6.
- Never mint or reassign `headword_id`, `sense_id`, or `ku_id` to force a join.
- Do not let these records enter SRS, official playable pools, or production analytics.

## Minimal staging-only adapter contract
- Load the existing base Runtime as-is. The current `scripts/core20k-unified-runtime-adapter.mjs` initializes `e:[]`, `c:''`, `x:''`; this is a data absence, not a renderer bug.
- Load this pack only behind an explicit opt-in **staging preview** flag and prominent STAGING_ONLY label.
- Join strictly on a validated, externally established authoritative KU identity; if unavailable, render a separate non-playable teaching preview instead of mutating `byKU` or `byScene`.
- Field mapping for a **verified matching KU**: `example_en` + `example_zh` -> the answer page example pair (app `e` shape must be inspected/tested before implementation); `collocations` -> `c` only when supplied and schema-compatible; `usage_note_zh` or `contrast` -> `x` only when supplied. Keep absent fields empty; never fabricate content.
- `gloss_zh` -> `m`, `gloss_en` -> `definition`, `us_ipa` -> IPA display only if authoritative match and release policy allow.
- Never override the base Runtime's identity, eligibility, SRS or learning state.

## Required main-dev acceptance
1. Verify the six legacy KU IDs against the pinned Runtime actual IDs and sense ownership.
2. Inspect the real answer-page `e` array schema; implement a staging-only mapping with null-safe rendering.
3. QA exact English-Chinese sentence alignment and KU-specific semantics; record independent review evidence and licensing.
4. QA isolation: no SRS writes, no playable promotion, no official Runtime mutation; add regression tests.
5. Only after independent certification and explicit registration authority may a separately versioned approved overlay be eligible for production.

## Status
STAGING_ONLY. This is a handoff and not an approved production content package. No official KU registrations performed.
