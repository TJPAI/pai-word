# Scene500 × English Core20K identity contract check — 2026-10-24

Status: SOURCE-CONTRACT COMPATIBLE; Batch156 full data foreign-key verification NOT EXECUTED.

Inspected actual GitHub source:
- `scene500-recommendation-dev/scene500-recommendation/contract-adapter.mjs` blob `aecec8c627a427d7d3e9e7bf94c0c6dae23446ee`
- `home-perf-safe-load-20261022/rebuild-preview/scene500-recommendation-bridge.mjs` blob `eedaa3d3008e53116a69de3d872d52c67129b630`
- `core20k-rebuild-v1/rebuild-preview/core20k-teaching-candidate-adapter.mjs` blob `cb95ae964fb343b20208729b4351705e5f4bef20`
- `core20k-rebuild-v1/rebuild-preview/core20k-batch136-runtime-gate.mjs` blob `d8099b4b4d40c176d24c61fdcf1afb37394f1667`

Findings:
1. Scene500 contract adapter emits `sceneId` in ranked results and validates Chinese `term_id` and `scene_id` references against catalog. No English headword/sense/KU identifiers are read or synthesized.
2. Host bridge uses scene IDs and host-provided `inventory(sceneId,difficulty)?.reviewedCount` to restrict playable scenes. The recommendation engine does not score KU or persist learning state.
3. English teaching candidate adapter independently requires existing knownKuIds/knownSenseIds/knownHeadwordIds and validates `ku_id`, `sense_id`, `headword_id`; Batch136 test fixture gate additionally requires test-only, release-ineligible, render-only flags.
4. No observed direct field naming collision between `sceneId` output and English `headword_id`, `sense_id`, `ku_id` identity registry.
5. **Open issue:** bridge assumes `inventory(sceneId,difficulty).reviewedCount > 0` is the definition of playable content. English candidate pack review/semantic eligibility is not independently enforced by Scene500; host inventory must count only production-eligible KU. This is an integration invariant, not proof of a current invalid reference.
6. **Open issue:** the Batch156 pack, registry and scene-to-KU mapping were not fetched or enumerated in this check. No claim of zero invalid Batch156 foreign keys.
7. Current host bridge includes opt-in V1.2 semantic reranker; recommendation development has paused this as an independent optimization direction. Default remains off.

No algorithm or runtime changes made. No main branch touched.

For Batch156 integration, host must verify every scene→headword/sense/KU reference against frozen registries, quarantine Q1 unverified teaching candidates, and keep candidate content out of reviewedCount/learning inventory. Recheck actual deployment after changes.
