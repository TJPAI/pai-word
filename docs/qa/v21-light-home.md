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
Final screenshot uses locally provided Noto Sans SC in the test page; Chinese
glyphs and mobile-width layout were visually inspected. Font injection is test-only
and excluded from performance runs. No public development deployment was made.


## Final QA closeout

Additional executed checks: 20 simultaneous learning intents; audio-script partial
initialization failure/retry without duplicate runtime; real multi-sense record
reinforcement and review entry; Top100 shard failure/retry; retained SRS one-day
interval for a known KU; 20 actual ensureAttempt cases spanning all daily quotas,
existing-other-KU, already introduced headword, exhausted quota and failed save.
History now includes previously attempted cards, not unseen future queue cards.

Performance comparison uses the same local HTTP server (gzip text, max-age=3600),
headless Chromium 153, three runs. Baseline is 4e58fc9. Its unused external pako
fallback was stubbed because native DecompressionStream is present; routing
turns off HTTP cache for baseline, so only cold baseline is compared.
Current cold/warm runs have no routing. Ready marker starts at navigation, not
bootstrap entry; automation verifies search works and records two animation
frames afterward. Exact samples are in v21-browser-results.json. Resource byte
sums cover subresources, not the HTML navigation. No duplicate home requests.

Run locally from repository root:

```
node scripts/build-v21-home-ku-metadata.mjs
node scripts/build-v21-home-index.mjs
node scripts/test-v21-all.mjs
PAI_CHROMIUM=/path/to/chromium node scripts/test-v21-browser.mjs
```

Playwright and a Chromium executable are external test dependencies. Optional
PAI_BASELINE_ROOT points to an extracted 4e58fc9 tree; PAI_FONT_ROOT points to
@fontsource/noto-sans-sc for the screenshot only. No GitHub Actions are used.

Development integration passes the recorded Node/Chromium gates. Production
release is NOT approved by this report: real Safari, simultaneous tab writes,
offline/update and rollback are unverified. Preview worker remains network-only.
The current GitHub Pages URLs are not deployments of this development commit.

Final measured medians (2026-10-21, local environment only):

| Metric | Baseline 4e58fc9 | Integrated branch |
|---|---:|---:|
| Cold complete-home observation | 897.4 ms | 165.7 ms |
| Cold interactive marker | not equivalent / not used | 88.8 ms |
| Warm complete-home observation | not measured | 99.8 ms |
| Warm interactive marker | not measured | 56.0 ms |
| Cold home subresource bytes | about 1.30 MB | 384,129 B |
| Home heavy requests | 22 | 0 |
| First learning entry | not compared | 846 ms |

Cold complete-home observation fell about 81.5% and subresource transfer about
70.5% in this controlled test. These are not iPhone/public-network guarantees.

## Follow-up: writer safety and rollback (2026-10-21)

Reproduced before fix: two live preview tabs could overwrite each other's state.
The second stale tab's save erased the first tab's newer statistics. Added an
origin-scoped Web Lock held for the document lifetime, using the existing preview
storage namespace. Only its owner can save or start learning. Other tabs can
browse/search read-only; settings are disabled and a visible notice explains
closing the writer and refreshing to continue. Browsers without the lock API
remain explicitly read-only, rather than silently allowing unsafe writes.
Every save also compares the stored snapshot to detect out-of-band/older-client
writes. No SRS schema migration, record deletion or new database was introduced.

Actual Chromium safety tests (v21-browser-safety.json): secondary writer rejected;
close/reload handover preserves both updates; external changes reject stale save;
rollback to f2ac8c5 after closing newer clients restores the same attempt, answer
phase and response time; unsupported lock API does not permit learning writes.
The rollback test is local, not a GitHub Pages deployment. Older clients do not
honor the new lock: close old-version tabs when updating or rolling back.

Actual offline result: with HTTP cache disabled and the current network-only
worker, offline reload FAILS. This is a measured unsupported capability, not a
passing offline acceptance test. No speculative caching layer was added in this
correctness patch. Real iPhone Safari / audio and full offline support remain
release gates. Earlier statements listing current-version tab safety and local
rollback as untested are superseded by these narrowly scoped results.

Safety command:
```
PAI_CHROMIUM=/path/to/chromium PAI_ROLLBACK_ROOT=/path/to/f2ac8c5-tree node scripts/test-v21-browser-safety.mjs
```
