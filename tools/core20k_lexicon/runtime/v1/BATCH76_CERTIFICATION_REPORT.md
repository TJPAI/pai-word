# Batch76 — 124-row Grammar KU certification matrix

Real source: Batch75 `grammar_124_certification_gate.jsonl` and `seven_certification_dossiers.jsonl` from the verified local ZIP.

Computed from actual rows: **124 unique existing Grammar KU IDs**, 75 distinct headwords, 123 Sense IDs present, 7 direct rule-source links, 7 marked source claim checked in prior dossiers; **0** KU with full production certification. Per-record blocker counts (overlap): 124 lacking independent bilingual approval; 124 Sense alignment signatures; 124 contextual POS-IPA signatures; 124 verified unique answers; 124 independent editorial signatures; 124 runtime E2E signatures; 117 without linked direct grammar rule; 1 without Sense identity. Frozen identity is syntactically aligned to recorded rank, not an independent membership proof.

Full **124-row machine-readable matrix**: `core20k_batch76_certification_matrix.zip` accompanying user deliverable, at `core20k_batch76/grammar_124_certificate_matrix.jsonl`, SHA256 `d270b840e7497d005d260f66766a01340f28355cf78fe314542ffa6a03dc5f48`. The 124-row file **has not yet been committed to GitHub**. GitHub now contains the actual producer-side reusable certifier `batch76-certification-gate.mjs` and test. Test code has not been run by remote CI; do not claim remote PASS.

**Release remains blocked: Production Ready 0, actual v1 teaching-pack.json records 0.** Do not infer quality approval from sources/legacy status. No main, consumer, Scene500, user-learning or SRS branch touched.