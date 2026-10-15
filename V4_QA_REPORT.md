# PAI Word 20K V4 Integration QA

Branch: `lexicon-20000-v4-integration`

## Verified package facts

Using the supplied `pai-word-20000-v4` package:

- release: `pai-word-20000-v4`
- lemmas: 20,000
- KU: 35,659
- majors: 16
- minors: 319
- scene chunks: 319
- track chunks: 85
- total runtime chunks: 404
- catalog/chunk duplicate KU: 0
- missing catalog KU: 0
- extra chunk KU: 0
- rank/lemma mismatch: 0
- scene/track ownership mismatch: 0
- manifest scene count mismatch: 0
- manifest track count mismatch: 0

`node scripts/verify-v4-package.mjs <data-dir>` is the reproducible package gate.

## Runtime adaptation verified in code

- loader derives release/wordCount/kuCount/taxonomy/chunks from manifest
- no 13,000 / 16,616 / 52-chunk loader constants remain
- scene chunks are resolved from manifest taxonomy
- track chunks are resolved by manifest chunk inventory and catalog order
- progress storage is release-scoped: `pai-word-mobile-v1::<release>`
- old Core-13000 progress is not migrated into v4
- old 951 Core-13000 scene-review decisions are not applied to v4 KU ids
- legacy 188/312 scene-audit bootstrap fetches are blocked during v4 startup
- scene/track labels and counts come from manifest
- `ipaUS` and `ipaUK` are displayed independently when present
- bilingual examples split on the embedded newline; missing Chinese is not synthesized
- v4 multisense catalog tuples are adapted for the existing answer UI
- speech remains the current US TTS policy
- Service Worker shell no longer depends on bundled `learning-runtime.js`

`node scripts/verify-v4-runtime.mjs` is the reproducible runtime boundary gate.

## Daily-learning compatibility

The existing learning policy is retained:

- daily new-word setting unchanged
- reinforcement ratio unchanged
- SRS parameters unchanged
- ku_id remains the learning-progress key
- selected-scene learning remains selected-scene-only

The previous 13,000-word metadata limit now derives from `manifest.wordCount`.

Note: some v4 minor scenes contain fewer KU than the selected daily quota. The integration intentionally does not pull words from another scene to fill the quota because that would change the existing queue-generation rule.

## Data installation

Use:

```bash
node scripts/install-v4-data.mjs <extracted-v4-dir> data/learning-v3
node scripts/verify-v4-package.mjs data/learning-v3
node scripts/verify-v4-runtime.mjs
```

The installer verifies the source package before replacing the destination and prevents mixing legacy packs with the 404 v4 runtime chunks.

## Not yet verified on the GitHub-hosted build

The v4 data directory has not yet been committed to GitHub from this integration session. Therefore these are still release-gate items rather than claimed PASS results:

- actual GitHub-hosted manifest/catalog fetch
- actual GitHub-hosted scene chunk fetch
- actual GitHub-hosted track chunk fetch
- browser first-load smoke test
- browser refresh/progress restore test
- browser offline-cache test
- GitHub Pages deployment/source verification

Do not merge to `main` or switch production Pages to this branch until those checks pass.
