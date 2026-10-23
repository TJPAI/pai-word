# Core20K Batch65 — frozen rank correction and actual 407-KU audit

Compared real 407-KU legacy workset (100 distinct headwords) from Batch64 against **20,000** frozen V2.0.6 membership records via `v2_0_6_lemma → core20k_rank_final` unique crosswalk.

**Actual findings:** 407 KU IDs unique, 100 headwords all matched exactly once; only **95/100** legacy-selected headwords are actually in frozen Top1,000; **395/407** KU records have legacy rank different from frozen rank; 15 KU records belong to frozen ranks above 1000. 183 non-Sense KUs lack verified type-specific attestation and verified answer/prompt pairing. All 407 lack complete Production Ready and evidence certification. No KU IDs assigned or replaced.

Types: Sense 224, Grammar 126, Collocation 29, Contrast 9, Pronunciation 11, Usage/Risk 8. These are candidates. Every record remains release BLOCKED. QA: 407 unique keys, 100 frozen identity links, 95 genuine top-1000 headwords, zero promotions, Python executable count tests and independent Node crosscheck PASS.

Local data and audit: `core20k_multiku_batch65.zip`, containing 407-row JSONL, builder and audit. Output SHA256 `7fc90e80ae6d59b48162c9b3a1e740c6054cd25c5b96bca77ecc86d1f4e8d96c`.

A real JS verification script has been committed as `runtime/v1/batch65-frozen-rank-gate.mjs`. Source data are in downloadable ZIP, not yet GitHub. No changes to frozen ranks, main, consumer branch, Scene500 or SRS. Runtime Pack remains zero-certified and release-blocked.

**Next:** replace 5 out-of-frozen-top1000 headwords in workset before claiming frozen-Top1000 sampling; investigate 183 non-Sense records for actual testable objectives and direct usage evidence; do not equate existence of patterns with quality approval.