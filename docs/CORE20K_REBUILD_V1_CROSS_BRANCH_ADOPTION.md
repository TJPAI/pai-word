# Cross-branch audit: what to absorb into Core20K Rebuild V1

Audited on 2026-10-19 by reading the GitHub branch list, branch trees, and representative source/test files. **This is an evidence-backed adoption plan, not a claim that prior code is already imported or fully tested.** Current rebuild branch remains isolated; do not merge other branches wholesale.

## P0 — import/adapt first

1. **Immutable Scene500 Top100 + no rank-101 top-up** from `core20k-etl-runtime-v1`/`core20k-pages`.
   - Source: `data/scene500-top100-v40/group-01..20.json`; `scripts/scene500-top100-runtime.mjs` and `scripts/scene500-top100-loader.mjs`.
   - Keep taxonomy, rank 1–100, KUs gated by type/content and difficulty. A scene pool can be <100 playable senses; never silently fill from 101+.
   - Adapt loader to new rich runtime; DO NOT import its reduced Core20K adapter as new content source.

2. **KU identity + SRS compatibility + fail-closed gate** from `core20k-final-v206`.
   - `scripts/scene500-b73-ku-registry.mjs`, `scene500-b75-core20k-preflight.mjs`, `scene500-b96-learning-contract.mjs` and corresponding `.test.mjs`.
   - Integrate checks into final schema and preserve shared cross-scene KU state.

3. **13K runtime package integrity and chunked/offline loading** from `lexicon-20000-v4-integration` and `core13000-integration`.
   - `scripts/verify-v4-package.mjs`, `verify-v4-runtime.mjs`, `build-learning-packs.cjs`, `data/learning-v3/manifest.json`.
   - Adopt byte-size, digest, gzip roundtrip, pack index and offline test checks; upgrade loader to preserve full rich assets.

4. **Real-data regression / isolated browser acceptance** from `core20k-pages`.
   - `scripts/core20k-real-data-regression.mjs`, `core20k-scene-binding-regression.mjs`, `core20k-browser-acceptance.mjs`.
   - Rewrite hard-coded 16,617 KU / 16,137 playable assertions after rebuild; test original homepage, immediate scene loading, reveal/answer, difficulty, SRS and refresh persistence. Avoid brittle DOM monkey-patches/flash workaround.

5. **Original 13K complete learning content and V26.7I quality filter** from `core13000-integration`/`v267i-fullku-integration`.
   - V25.5 full master remains provenance input; compare against V26.7I overlay and `tests/v267i-runtime.test.cjs`.
   - Preserve high-quality Sense/Grammar/Collocation/Contrast/Pronunciation/Usage along with examples and collocations; do not blindly restore suppressed/generated placeholders.

## P1 — adapt after basic runtime works

6. **Evidence/quality metadata & scene audit** from `lexicon-20000-v4-integration` (`scripts/audit-scene-ku.mjs`, `tests/scene-audit.test.cjs`) and `v2.1-learning-evidence` (older learning-evidence research branch).
   - Distinguish dictionary/corpus verified from generated/editorial, keep explicit provenance and external comparison gates for Contrast.
   - Use audits as evidence, not as automatically approved replacements.

7. **Scene500 review staging / alternative KU proposals** from `core20k-final-v206` (`scene500-b160-membership-validator.mjs`, `scene500-b85-staging-catalog-v2.mjs`, review scripts).
   - Carry as a separate review queue; do not allow provisional KU IDs into SRS or the canonical 20K baseline without promotion and validation.

8. **User flow and learning UI regression** from `v267i-today-flow-v2`, `v267i-fast-answer-v1`, and `feature/scene500-sentence-search-mvp`.
   - Study their tests and UX decisions; retain current original homepage's one-sentence search + difficulty and existing answer behavior. Benchmark improvements rather than transplanting whole old app trees.

## Do NOT wholesale merge

- `core20k-pages`: contains experimental bootstrap, loading interception and other rapid patches, plus runtime adapter with `e:[],c:'',x:''` which loses master-rich teaching assets.
- `core20k-preview-v203`: early previews, seeded scene lists and provisional artifacts; superseded by V4 ranked scenes.
- `lexicon-20000-v4-integration`: older integration data with different schema; import validators selectively, not all datasets/UI.
- Entire `v267i-*` family: useful tests and teaching behavior, but older branches may replace newer homepage and SRS.
- `automation/core20k-pipeline`: branch exists; code/tree not fully inspected in this audit. Do not assert suitability until checked.
- `main`: keep untouched.

## Concrete acceptance sequence
A. Import/selectively adapt KU registry + migration and scene rank gates, run their tests.
B. Build canonical 20K rich schema with legacy provenance plus generated 7K content and quality states.
C. Port manifest/hash/cache validators, prove 13K field-level nonloss and 7K quality thresholds.
D. Bind 500-scene rank data to playable KU with session size independent of scene pool.
E. Run isolated browser tests on iPhone Safari and desktop, compare startup latency and no intermediate UI flash.
F. Gate release on scripts/tests + real user-interface smoke checks. No automatic production deployment.

## Avoid premature success claims
Current audit verifies existence/selected implementation details. It does not mean tests have run against rebuild V1, code cherry-picked, or the app is production ready.
