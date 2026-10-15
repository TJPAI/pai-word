# PAI Word 20K v4 integration

Working branch: `lexicon-20000-v4-integration`

Do not merge this branch or switch GitHub Pages to it until the v4 data directory has been installed and browser smoke tests pass.

## Data install

The runtime expects the extracted `pai-word-20000-v4` files under `data/learning-v3/`.

Use the atomic installer from a local checkout:

```bash
node scripts/install-v4-data.mjs /path/to/pai-word-20000-v4 data/learning-v3
node scripts/verify-v4-package.mjs data/learning-v3
node scripts/verify-v4-runtime.mjs
```

The installer validates release/counts, all 404 chunk hashes, gzip payload sizes and JSON decoding before replacing the old directory. It copies exactly 408 runtime data files: manifest, catalog, taxonomy, words_master and 404 chunks.

## Runtime contract

- `manifest.json` is the source of truth for release, word/KU counts, taxonomy, scene counts, track counts and chunk metadata.
- Catalog contains 20,000 lemmas / 35,659 KU.
- Scene taxonomy is 16 majors / 319 minors; scene ids are not hard-coded.
- Seven fallback tracks remain separate from scenes: function, academic, core1, core3, core6, core13, core20.
- KU payloads are loaded on demand by manifest chunk metadata and SHA-256 checked.
- Learning progress is stored under `pai-word-mobile-v1::<release>`; old Core-13000 progress is neither read nor migrated.
- Speech stays US English. IPA display uses available `ipaUS` and `ipaUK`; missing values are hidden.
- Examples are displayed as `EN\nZH` when a translation exists, otherwise English only; no translation is generated.
- `exam` and `forms` are not present in v4 and are not synthesized.

## Compatibility fixes already applied

- Removed the old 13,000 / 16,616 / 52-chunk loader assumptions.
- Removed the 13,000-word limit from daily assignment metadata.
- Replaced the old bundled runtime startup path so Core-13000 scene-review decisions cannot fail against v4 KU ids.
- Added a no-op v4 scene-review compatibility layer for legacy internal topic helpers.
- Fixed v4 multisense display mapping: catalog tuples use `[ku_id, owner, kuType, kuTitle, pos, meaning]`.
- Scene/track cards use manifest `sceneKuCounts` / `trackKuCounts` as their canonical counts.
- Removed legacy-progress wording from the v4 statistics view and locked speech UI to the current US policy.

## Known non-blocking legacy code

`learning-app.js` still contains internal Core-13000-era 188/312-scene audit/export helpers used by the historical free-text topic feature. They are not used as the v4 scene catalog, are hidden from the v4 home taxonomy, and the v4 scene-review layer prevents old KU decisions from being applied. Do not treat those internal exports as v4 taxonomy truth.

## Remaining release gate

After the data directory is installed in this branch, verify in a real browser:

1. boot / manifest / catalog;
2. 319 scene catalog and 7 tracks;
3. one scene chunk and one track chunk on demand;
4. today queue and selected-scene behavior;
5. reveal + three-grade learning flow + same-session retry;
6. lexicon search and multisense detail;
7. US/UK IPA display and US speech;
8. bilingual and English-only examples;
9. refresh restores only v4 progress;
10. offline download and offline reload.

`core13000-integration` and `main` must remain unchanged until explicit approval.
