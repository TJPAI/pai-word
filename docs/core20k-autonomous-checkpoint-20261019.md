# PAI Word Core20K autonomous execution checkpoint — 2026-10-19

## Verified facts
- Repository: TJPAI/pai-word, working branch: core20k-etl-runtime-v1. Main not modified.
- Real homepage: index.html -> mobile.js -> lazy-loader.js -> core-bootstrap.js; legacy lazy-loader still serves 13,000 words / 16,616 KU.
- Unified runtime data: Library `/PAI_Lexicon/scene500-v40-core20k-v206/Core20K_Runtime_Unified_20000.json.gz`; gzip SHA256 e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b.
- Verified actual unified data: 20,000 ranks, 16,617 active registered KU, 16,137 eligible Sense, 12,976 distinct headwords with eligible Sense, 7,024 without; 2 unused legacy orphan records. User explicitly says legacy user learning records are only test data and need not be migrated; retain existing lexicon quality assets.
- No unified dataset has yet been committed into GitHub or deployed.
- No browser end-to-end testing or real learning-path acceptance completed.

## Changes in this run
- Commit 9a7722d3bf1fb0fd17b6d3896bf3f74bc667f3bf: learning-runtime.js daily scope derives from current PAI_CORE.words.length (rather than 13000); filters playable=false or requiresHydration=true in fresh, reinforcement, due queues.
- Post-commit fetch shows all 7 textual regression conditions satisfied.
- Programmatic source data integrity QA completed; user SRS not modified.

## Next machine-executable batches
1. Add a unified-vs-legacy loader switch only in the existing development branch, with full legacy fallback until data really deployed; avoid blank/missing resources.
2. Transfer the single `core20k-runtime.json.gz` asset to the same development branch via supported GitHub binary write workflow (Git blobs/tree/commit) or approved local git push; verify its GitHub SHA and live HTTP GET before switching index.
3. Adapt existing `PAI_CORE` scene metadata contract, unitKey/sid, daily queues, search, and audio to unified contents. Never offer eligible=false KUs as exercises.
4. Execute automated integration tests for first, middle and last ranks, 20K lemma lookup, answer reveal, marking KU, page refresh/SRS persistence (fresh isolated test storage).
5. Complete browser iPhone/Safari testing on a proper HTTPS dev branch before rollout.
6. In parallel, bulk fill 7,024 unavailable headwords' minimal Sense/KU; do not invent verification status. Ensure these can be incorporated into identical 20K schema.

## Guardrails
- No writes to main, no PR merge, no GitHub Actions, no live SRS reset.
- Do not report '20K ready to learn' until all 20K have genuinely playable Sense and pass browser QA.
- Legacy test-user progress migration is out of scope by explicit user instruction.
