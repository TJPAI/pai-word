# Core20K development checkpoint — 2026-10-19

Target: TJPAI/pai-word, branch core20k-etl-runtime-v1. Main and public deployment remain untouched.

Verified current files:
- index.html -> mobile.js, lazy-loader.js, core-bootstrap.js; default loads old learning-v3 13K data.
- Core20K single gzip source in Library: /PAI_Lexicon/scene500-v40-core20k-v206/Core20K_Runtime_Unified_20000.json.gz (712478 bytes in materialized working copy).
- The gzip source parses as schema pai-core20k-runtime-v1, 20,000 word rows, 16,617 registered KU and 16,137 minimum-content Sense.
- Existing test-user data need not be migrated, per user. Do not reset public/prod state.

This execution verified by refetching GitHub files:
- f1a6718: unified runtime adapter populates a general scene index from playable KUs.
- 25197a0: scripts/core20k-dev-boot.mjs loads unified gzip data as one asset, detects unusable data.
- add80c7: lazy-loader.js opt-in query ?core20k=1; falls back to unchanged 13K loader if data missing. Default app path unchanged.

NOT DONE:
- data/core20k-runtime.json.gz is not yet in GitHub. GitHub content API has binary blobs available, but container bytes cannot currently be directly passed to the connector; no upload was claimed.
- No browser tests; scene500 membership/learning flow integration is not validated; do not claim production readiness.
- Missing minimum playable Sense content for 7,024 headwords.
- Real browser data load, scene flows, answer, SRS persistence, and refresh tests are pending.

Next:
1. Write actual gzip bytes into data/core20k-runtime.json.gz on branch; verify 712478 source bytes and SHA-256 from Library.
2. Complete runtime's scene metadata contract so existing Scene500 resolves correctly and filters unavailable KUs.
3. Run data-driven Node, browser tests for normal and ?core20k=1 paths; test all 20K lookup and study/review with isolated test state.
4. Verify https preview/staging URL before making default. Never modify main without user approval.
