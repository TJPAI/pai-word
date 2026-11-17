# Scene1341 ↔ Scene500 UI/Interaction Parity Audit (2026-11-17)

Owner: CG-MAIN. Source branch: cg-main-fourline-integration-20261026. Status: NOT PARITY-COMPLETE. This report is an audit, not acceptance.

## Verified P0 regressions

1. iPhone screenshot SC50-0001: `Can't find variable: countByScene`. In Scene1341 HTML, the only previous `const countByScene=new Map()` was function-local to `load()`; `openMasterScene()` referenced it out of scope. Fixed: global `let countByScene=new Map()`, `load()` clears/refills same map; commit b2390aa8042b6a1d7cd2cf82cedeb27cc3c6dbd9. Regression 822cd8b5cdf4f767032d82b48454d18d37f89fa4. Requires new frontend preview deployment.
2. iPhone screenshot SC50-0027: `MASTER_SCENE_V1_SCENE_BLOB`. Live V268 (later V269) Git index entry `SC50-0027.git_blob_sha1=705c866351cb540f6a464a1b5b0f296962a21dfa`, but direct GitHub scene file blob SHA is `8d89002f09334066d6fb001e5b30c5892f07c0e9` (194 source rows). Five other sampled scenes matched. This is a CG-MASTER index integrity issue. Do NOT suppress Git blob verification or silently show stale cards. Blocking handoff on Issues #1 and #2.
3. Recommendation buttons disabled when Master index not yet loaded: fixed by CG-MAIN commits 21dbbab42c712312fdf262d847165177a0652a22 and c68e0253fb2894f97f0a685ab197fa4658408566; regression 06aa2920ff2b3484fca9acc501320a0df1dfb774. Requires preview deployment.

## UI parity: verified architecture gap

- Scene500 experience `/v22-integration/rebuild-preview/` loads the original app shell and shared `core-bootstrap.js` / `lazy-loader.js` runtime.
- Scene1341 experience `/v22-integration/rebuild-preview/scene1341-readonly/index.html` is an **independent ~90KB handcrafted page** with its own `home-dashboard demo-home`, search/recommendation markup, test-only settings shell, JS `openStudy()` and `renderCard()`, and many route-specific CSS overrides. Importing some Scene500 settings/phase/hero modules and common CSS does **not** establish a 1:1 UI or persistence implementation.
- Standalone home diverges in structure, controls and metadata and uses separate recommendation entry, status, scene count, pagination, load/error UI. Screenshot confirms visual differences. Current home includes unique `Scene1341` test heading, `Master` banner, L1 counts and independent study/view logic.
- Scene1341 test app explicitly does not persist official SRS, and users' request to share visual/interaction parity must **not** conflate this necessary isolation with different visible UI.
- Learn screen partially reuses original Scene500 CSS, `scene500-readonly-phase.js`, `scene500-native-*-exact.js`, but standalone markup, inline CSS overrides, manual event handling, and different page settings remain. Automated full visual parity on iPhone Safari has NOT been demonstrated.

## Required next engineering steps

1. P0: CG-MASTER regenerate SC50-0027 index entry from the actual committed scene bytes and atomically validate all 1,341 `git_blob_sha1` pointers before publishing any index; CG-MAIN fail-closed check stays.
2. P0: Owner deploy exact latest CG-MAIN SHA (the preview workflow default `v22_source_sha` is stale), then reproduce user taps for SC0001, SC0027, other recommendations. Inspect `preview-source-sha.txt` and Safari caching. Do not claim iPhone PASS without actual device/browser evidence.
3. P1: Reduce two-app UI drift by a shared Scene500 **home/learning shell** and route configuration (Scene1341 data adapter injects master scene data only; CG-REC result IDs route to same study controller). Avoid copying Scene500 CSS/DOM and changing it separately.
4. P1: Compare question/answer page screenshots, settings, progress, bookmarks, autoplay, left/right swipe, up/down batch, handwriting, voice, long-phrase fit, keeping question vs answer face unchanged across auto/manual navigation. Automate DOM/event regression and cross-screen screenshots.
5. P1: Preserve QA `待审/1审` only adjacent to IPA, POS abbreviation inline before Chinese meaning, all available answer details configurable, release=false and zero formal SRS writes.

Acceptance gate: same visual shell/interaction as Scene500 (except explicitly marked test-only Master release status), all 1,341 scenes open from recommendations and catalog when matching pinned index files exist, actual iPhone Safari validation, no known JS ReferenceError / Blob mismatch, independent QA and SRS isolation.
