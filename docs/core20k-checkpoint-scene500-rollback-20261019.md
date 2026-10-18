# Core20K checkpoint — 2026-10-19 additional integration hardening

Verified GitHub branch: TJPAI/pai-word / core20k-etl-runtime-v1.
Verified uploaded data/core20k-runtime.json.gz matches Library binary (712478 bytes, SHA256 e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b).
Programmatic gzip parse and exact rank, KU uniqueness checks: 20000 words, 16617 unique registered KUs, 16137 playable Sense units, 12976 headwords with playable Sense. First word out; last chameleon.

This run:
- 758fced: scene500-integrated.js excludes playable=false and requiresHydration=true entries from sense selection and direct explicit KU/Sense binding.
- cc1cc49: scripts/core20k-dev-boot.mjs restores core, WORDS, SCENES, ensureUnits, offline function and status on install failure prior to legacy fallback.
- Refetched files from GitHub; gates and restoration confirmed present.

Still pending:
- No full browser E2E acceptance yet. Source checks do not establish runtime correctness.
- The actual hosted preview must be exercised for ?core20k=1: first run, scene500 binding, study, answer, SRS persistence, refresh, and no blank question.
- Only 12976/20000 headwords are minimally playable. Continue bulk minimum Sense completion as an independent priority.
- Do not switch main or the published production site without explicit authorization.
