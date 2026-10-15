# PAI Word v4 integration QA status

This file records verified integration facts for the `lexicon-20000-v4-integration` branch.

## Verified package

- release: `pai-word-20000-v4`
- words: 20,000
- KU: 35,659
- majors: 16
- minors: 319
- chunks: 404
- every catalog KU is unique
- every chunk KU matches catalog rank/lemma/owner
- every KU has exactly one of scene/track
- manifest scene/track KU counts reconcile exactly
- SHA256/base64/gzip/rawBytes checks pass

## Runtime adaptations

- manifest-driven counts/taxonomy/chunks
- release-scoped progress storage
- old progress is not migrated into v4
- dual US/UK IPA rendering, blank side omitted
- bilingual examples split on newline; no generated translation
- scene counts use `sceneKuCounts`
- fallback tracks use `trackKuCounts`
- old Core-13000 scene-review decisions are not applied
- legacy 312-scene audit network loading is suppressed during v4 `learning-app.js` startup
- service worker bypasses lexicon data files so the loader/IndexedDB owns data caching

## Automated checks

- `scripts/verify-v4-package.mjs`
- `scripts/verify-v4-runtime.mjs`
- `scripts/install-v4-data.mjs`
- `scripts/v4-browser-smoke.spec.mjs` (real Chromium smoke test, workflow-backed)

## Current release gate

The v4 data directory is now installed in GitHub under `data/learning-v3/` and verified by the installer workflow. Remaining release-gate work is real-browser smoke verification and explicit Pages-source verification before exposing v4 as the public Pages build.

## Safety boundary

Do not modify or merge `main` from this branch unless explicitly approved. Keep the previous `core13000-integration` branch intact until v4 has passed browser smoke testing and Pages verification.
