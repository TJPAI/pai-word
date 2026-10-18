# Core20K autonomous development checkpoint (2026-10-19, after user upload)

## Verified
- User uploaded `data/core20k-runtime.json.gz` to branch `core20k-etl-runtime-v1` of `TJPAI/pai-word`.
- GitHub blob SHA is `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`, **identical** to local Git blob SHA for 712478-byte Library source.
- Decompressed source is valid JSON, `schema=pai-core20k-runtime-v1`, 20000 `headwords`, first headword `out`.
- Branch has opt-in `?core20k=1` hook in `lazy-loader.js`, default legacy code path unchanged; `scripts/core20k-dev-boot.mjs` reads `data/core20k-runtime.json.gz`, validates counts and falls back to old loader on failure.
- `scripts/core20k-unified-runtime-adapter.mjs` constructs a `daily` byScene index only from playable Sense KUs.
- `learning-runtime.js` uses actual words.length and filters playable=false/unhydrated KUs.
- Re-fetched four GitHub files and verified exact source assertions for all relevant paths.

## Commits this execution
- `57cf0008ebe3c133f754269b97d7ffd868a8df8f`: Fix dev boot daily scene and status.
- `ab2b37c3f2eaa037aef43a84c9d3430ac0eb17e8`: initial UI text edit, superseded immediately.
- `a640f27e3c53cc10bfcf8ffed3fbcdae0f720ad2`: Correct wording to neutral '当前词库' for both modes.

## Not verified / outstanding
- No complete browser integration or Safari device test; no production deployment.
- Default front-end loader still serves 13K unless `?core20k=1` explicitly requested.
- Current Core20K payload has 16137 eligible Sense KUs across 12976 headwords; 7024 words still lack minimum learnable Sense.
- Scene500 mappings were built against older membership: check real session queues and answer flow; do not claim full Scene500 compatibility.
- No historical test user data migration required; retain no need for old orphan compatibility in future rebuild.
- No change to main or official Pages publication source.

## Next batches
1. Run a browser-based integration test on a non-production HTTPS preview with `?core20k=1`, including data download/decompression, index, new learning, answer, marking, reload, due review, and scene500.
2. Fix any scene bindings that select nonplayable KUs, and add runtime QA.
3. Once verified, switch the development branch default to unified20K, then request explicit permission before changing main / public production.
4. In parallel, batch-fill 7024 missing minimal Senses, register genuine KUs and rebuild the same unified payload.
