# Scene1341 RANKED recommendations — V51–V61 staging import

**Source:** [PAI Word Issue #2](https://github.com/TJPAI/pai-word/issues/2), 11 authentic Drive CSVs, SC50-0001–SC50-0110.

**Scope:** 110 scene IDs, 19,371 ranked English expression / Chinese meaning recommendations. This dataset is independent of the frozen English Core20K Sense/KU identities. The editorial acceptance described in Issue #2 does **not** grant a formal CG-MASTER Release or permission to change production Runtime or SRS.

## Layout

- `v51-ranked.csv` … `v61-ranked.csv`: exact Drive-sourced original CSVs (no row reinterpretation or reordering)
- `manifest.json`: Drive IDs, Git blob SHA-1 identities, sizes, counts, release flags
- `index.json`: compact 110-scene / count index for browser first paint
- `../validate-scene1341-ranked.py`: standard-library content gate, covering 11 blob identities, every rank, unique IDs, nonempty English and Chinese meanings, source tier preservation, 110 scene coverage and index consistency
- `../../../rebuild-preview/scene1341-ranked-preview.html`: **isolated** iPhone-friendly UI for scene search, tier filtering, ranked browsing and voluntary 11-batch Cache Storage warmup
- `../../../rebuild-preview/scene1341-ranked-preview.mjs`: on-demand per-ten-scene CSV fetch with original Git SHA-1 check (Git blob format)
- `../test-scene1341-ranked-browser.mjs`: Node regression including simulated offline usage after caching

## Source differences

V51–V52: `CORE/SUPPORTING/ADDITIONAL/OPTIONAL`, no `dimension` column.

V53–V54: `CORE/SUPPLEMENTARY`, `dimension` available.

V55–V61: `CORE/COMMON/EXTENDED`, `dimension` available.

Do **not** silently normalize these tier systems into one assumed scoring system. Preserve the source value and `rank`.

## Acceptance and safety

Run:

```sh
python tools/integration/validate-scene1341-ranked.py
node tools/integration/test-scene1341-ranked-browser.mjs
node --check rebuild-preview/scene1341-ranked-preview.mjs
node --check rebuild-preview/scene1341-ranked-ui.mjs
```

The workflow `scene1341-ranked-integration-qa.yml` runs these automatically on the integration branch. Existing four-line integration CI must also pass. No Core20K ID mutation, no KU/SRS writer, no default engine promotion.

The page is committed at `rebuild-preview/scene1341-ranked-preview.html` but a **deployed** preview URL is **not confirmed** by merely committing this file. To preview through the isolated `pai-word-preview` V2.2 candidate site, use the existing `Deploy PAI Word preview` workflow with its `v22_source_sha` input set to a **tested** integration SHA; it contains safety gates protecting the existing non-V2.2 previews. Verify GitHub Actions build+deploy and the resulting `preview-source-sha.txt` before advertising the URL or asking for iPhone QA.

Cache Storage holds visited batch assets and can be explicitly warmed for all 11 batches; Safari may evict data. An offline *reload* of the preview page itself is not guaranteed because the current page is not installed with a dedicated offline-document service worker. The automated offline test validates source-data cache reads, not a real iPhone session.

## Rollback

Do not rewrite the original CSVs or overwrite the stable preview. To return the staging branch to its pre-import state, use the last verified pre-import commit `f444567dcf9b6b02038329b80273e3bf936dd9c6` as the comparison baseline and revert only the identified integration commits if necessary; do not force-push or erase unrelated concurrent changes. Production Runtime has not changed, so no SRS migration or rollback is required.
