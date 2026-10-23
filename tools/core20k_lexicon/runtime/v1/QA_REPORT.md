# Core20K Versioned Pack — Stage 001 QA

Status: **BLOCKED** / NOT a teaching release.

Data contract: pai-core20k-teaching-pack-v1, coordinated with the actual `scripts/core20k-versioned-pack-gate.mjs` from `home-perf-safe-load-20261022`.

Facts verified against local complete sources: Frozen V2.0.6 20,000 ranks and headwords (SHA256 e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca); V26.7O Core13K 13,000 old word records, 12,994 matching headwords, 16,816 matched KU identities; 1,106 incremental registry records: 3 registered, 627 second-source pending, 476 blocked.

**None** of the old field-status records can be proven to meet all formal semantics, IPA, identity and runtime requirements. Hence zero certified KU, zero learnable words, zero valid Scene500 associations, zero reviewed crosswalk rows in this pack. Previously registered KU IDs are not rewritten or claimed Production Ready.

Actual committed pack `teaching-pack.json` is `records:[]`, 0 rows, and manifest has `release_eligible:false`. Its SHA256 is `006b5002eadac0f3082fc8792153182c70871d3db84d027d3932d59be719a2df`. Manifest SHA256 `e599a89ad9ae978db7ee08b0a13ff08cd5f526b779c7f80c26204d5f37905363`.

Local real test: `node test.mjs` → **8/8 PASS** (schema, source SHA syntax, versions, count, exact pack SHA256, exact manifest SHA256, zero unverified promotion, crosswalk empty, scene map empty, frozen and registry counts).

**Integration warning**: Consumer's current `validateCore20KPack` allows a zero-record structurally valid staging pack. It must additionally check `manifest.release_eligible === true` AND `eligible.length > 0` before attaching to learner-facing runtime. Until then treat this pack solely as fail-closed test fixture and retain stable runtime. No deployment was performed.

How to advance: produce independently signed verification records for each existing stable legacy KU with verified source Sense, Chinese bilingual semantic review, POS-specific US IPA, reviewed crosswalk and Scene500 link; then generate a nonempty pack from only accepted KU. Incremental versions must retain stable IDs and carry old-to-new audit.
