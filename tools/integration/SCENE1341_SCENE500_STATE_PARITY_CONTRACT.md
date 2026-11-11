# Scene1341 ↔ Scene500 State Parity Contract

Owner: CG-MAIN. Source of truth: `rebuild-preview/learning-runtime.js` (the real Scene500 runtime), **not** the Scene1341 adapter and not an earlier screenshot. Scene1341 substitutes scene IDs and teaching data only. All UI/interaction states must be behaviorally equivalent for the same approved KU/session conditions.

## State dimensions to preserve

| State/transition | Required Scene500 behavior | Scene1341 evidence and release status |
|---|---|---|
| QUESTION / ANSWER preferred face | Tapping blank space switches face; moving to another word or batch preserves the preferred face, including automatic movement | Phase adapter + real `move()`/batch V8 tests; CI covered |
| Long English prompt | Single line, short words keep original typography | Fit function/viewport tests; iPhone physical test outstanding |
| Left/right word, keyboard | Wrap only inside current 10/25/50-KU batch, both directions | One `currentBatchNextIndex()` shared by manual/auto/rated; composed V8 tests |
| Up/down batch | Switch batch circularly; single-batch gesture is no-op | Native `PAI_CHANGE_BATCH` contract; composed V8 tests |
| Automatic browse ON/OFF | User selection persists on home/reentry/reload; hidden stops timer, not selection; normal time 0.9/1.5/3/6s; after speech 0.2/0.6/2/5s | Auto adapter, isolated UI preference and Safari fallback; CI covered; physical long-run timing pending |
| Automatic + speech | Speech is never cut by auto timer; stale callbacks cannot switch newer card; one pending timer; screen wake lock where supported | Token/audio/watchdog and wake-lock tests; real iPhone physical test pending |
| Three grade buttons | again/hard/good = 6/4/2s and 3/2/1 word repeats; correction replaces pending grade; one settlement only | Phase controller V8; complete **SRS durable settlement NOT implemented for unreleased draft KU** |
| Grade + manual swipe | Current pending grade settles once before navigation; destination follows requested direction, same batch and chosen face; no stale timer | Combined executable test in `test-scene1341-readonly-mobile-demo.mjs` |
| Grade + blank tap | Early settlement; hold current KU, toggle face, no phantom next-card advance | Combined executable test; SRS commit gate still absent |
| Grade + auto ON | Pause auto during grade; after settlement keep the rated card, resume auto; next timer advances | Combined executable test; actual atomic grade record still blocked |
| Word/example voice | Shared audio owner; cancel stale speech on navigation; selected accent/speed; Safari pause/resume and length-based watchdog | Mock Safari voice regression; human listening test pending |
| Handwriting | Long press enter, long press erase, handwriting canvas and stroke smoothing; restore across auto transition/grade according to native | Native adapted scratch implementation and QA; real touch input test pending |
| Settings and Continue | Validated selections and scene/index/preferred face survive reload; reset defaults persists | Separate namespaced UI-only stores, tests for reload and invalid input |
| App background | Cancel pending delayed actions, preserve visible face; resume selected auto mode on foreground | Visibility lifecycle V8; physical Safari test pending |
| **Durable KU grading / SRS** | IndexedDB atomic attempt, idempotence/conflict/rollback, due queue, statistics and refresh recovery | **BLOCKED**: Scene1341 presently displays unapproved author-draft KU; no permission to persist score/SRS. Must not claim full parity. |

## QA gate for every future UI change

1. Inspect current `rebuild-preview/learning-runtime.js` and the matching native DOM/CSS; record exact reference functions.
2. Prefer sharing native source or one common adapter. If direct reuse is impossible because the native controller couples to formal SRS/session state, preserve *one* implementation of the pure behavior, with executable source-backed parity tests. Never maintain separate manual and automatic index algorithms.
3. Test at least these composed interactions: question→answer→manual left/right→automatic→batch up/down; grade→manual swipe; grade→blank tap; grade correction; grade→auto hold→next timer; voice active→swipe→stale onend; handwriting→auto transition; hidden→foreground; reload→Continue and preferences.
4. Check first/middle/final incomplete/singleton batches (10, 25, 50); keyboard, pointer, touch and auto; verify no accidental grade.
5. Require BOTH Scene1341 isolated QA and Four-line contract CI **success on the same exact SHA**. Source `scene1341-readonly/index.html` and mirrored `rebuild-preview/scene1341-readonly/index.html` must be identical.
6. Manual deployment **by user only** via `TJPAI/pai-word-preview` workflow. CI success alone is **not** deploy, pixel, audio or iPhone Safari certification.
7. Do not enable production SRS before KU gets Master approval plus CG-QA and MU-QA independent certification and the exact release gate is satisfied. Do not confuse namespaced UI preferences/bookmarks with SRS persistence.

Open risks: iOS Safari gesture/audio/wake-lock timing; UX pixel parity under narrow viewport/long expression; native atomic SRS events vs isolated draft-only rating. Do not label these PASS merely from code presence.
