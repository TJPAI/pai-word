# V2.1 lightweight home integration

Baseline: core20k-rebuild-v1, 4e58fc9802f6d680723ee06900277a7e6133013a.
Only development branch is modified. No deployment is implied.

## Batch 1: data and statistics contract

Executed Node generators using production adapter + Top100 loader validation:
20,000 headwords, 16,617 active KU, 16,137 playable sense KU, 2 compatibility
orphans, 500 scenes, 50,000 candidates, 22,227 eligible scene rows.
Both projections bind source SHA256 4828f04b1eaae0e1469b34979d9d95179ad1a26dcaed9585c84b68ad9ba2491c.

Executed 2,540 searches comparing actual core.byScene units against the unmodified
search algorithm's lightweight branch: IDs, order, scores, and counts identical.
Executed 24 budget comparisons against daily.js and learning-app due() extracted
from the actual runtime: all pass; stale assignments rebuild without home writes.

Correction: the proposed metadata validator incorrectly required at least 22,227
unique playable KU. That is a count of scene rows, not unique KU. Final learning-app
counts due records once per active KU, including learningPending / lastKnown=false;
it does not multiply by scene membership. Projection now matches that behavior.

Initial existing test run had 4 failures (rating phases mock, transaction mock,
search-restore assertion in scene-refresh test, rating controls assertion).
These are not reported as passing until repaired and re-executed.

## Batch 2: integrated startup

Actual local headless Chromium 153.0.8010.0 smoke test: complete homepage,
airport search (5 results), first Scene500 entry (10 KU, question visible) passed.
First home navigation observed at 156 ms on loopback before compressed metadata
optimization. This is not a public-network or iPhone performance claim.
Settings and statistics now use the same persisted state and read-only budget;
no full engine is needed for either. Original home dashboard markup is reused.
Only the canonical Top100 loader is needed by this path; legacy membership,
audit overlays, pako CDN and full runtime are removed from home dependencies.
Native gzip support loads compact metadata; older browsers use the JSON fallback.

## Integrated learning regression (actual Chromium)

See v21-browser-results.json and test-v21-browser.mjs. Resource blocking,
five difficulty levels, settings/statistics without teaching data, initialization
failure/retry, persistent attempt restoration, revealed-answer restoration,
100 repeated submissions, injected save failure rollback, and read-only history
all passed. Full Node suite also passed (v21-node-results.txt).

Minimal frozen-contract corrections: headword introduction and attempt identity
are saved together before exposing a new card; returning to an introduced but
unscored word can resume without another quota charge. Answer phase/response time
are saved on the attempt. History no longer creates a second review event.
Existing SRS interval calculation and new-material repeated recall are retained.

This implementation continues using the existing preview localStorage record,
not the unintegrated IndexedDB transaction-store. Cross-tab simultaneous writers
and offline/update/rollback need separate validation before production release.
Real iPhone Safari, audio output/gesture unlocking and Safari memory are untested.
Headless Linux currently lacks CJK fonts; screenshot proves geometry only, not
Chinese glyph rendering quality. No public development deployment was made.
