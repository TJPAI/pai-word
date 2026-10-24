# English Core20K Batch160 × Scene500 — source contract follow-up (2026-10-24)

Scope: recommendation integration boundary only. No algorithm, lexicon, or main branch changes.

## Inspected source
- `home-perf-safe-load-20261022/rebuild-preview/scene500-recommendation-bridge.mjs` blob `eedaa3d3008e53116a69de3d872d52c67129b630`: scene eligibility is `Number(inventory(id,difficulty)?.reviewedCount)>0` (line 82).
- `core20k-rebuild-v1/rebuild-preview/core20k-teaching-candidate-adapter.mjs` blob `cb95ae964fb343b20208729b4351705e5f4bef20`: validates membership in knownKuIds, knownSenseIds, knownHeadwordIds (lines 19–21), but accepts a candidate with `review_status==='approved'` and `semantic_risk!==true` (line 25) without explicitly requiring independently verified semantics or release eligibility.
- `scene500-recommendation-dev/scene500-recommendation/contract-adapter.mjs` blob `aecec8c627a427d7d3e9e7bf94c0c6dae23446ee`: `scene_id` is checked against the 500-scene catalog; results use `sceneId`. No English KU/Sense/headword fields in the recommendation adapter.

## Risk and action
**Potential release-gate gap (not a proven production leak):** the teaching candidate adapter's `accepted` does not mean independently semantically certified or formally releasable. Do not use this array as the source of `reviewedCount` or a playable KU inventory. Host production eligibility must require independently certified, release-eligible KU identities from the authoritative production registry; exclude Batch160 staging irrespective of `review_status`.

Membership validation of individual IDs does not validate tuple integrity: require that `ku_id` belongs to the stated `sense_id` and `headword_id` in the frozen production registry before publication. No evidence of an actual tuple mismatch is claimed.

## Verification limits
No Batch160 full staging records or authoritative production registry enumerated in this check. Zero invalid references is **not** asserted. No changes to main, production Hybrid, SRS or English lexicon.
