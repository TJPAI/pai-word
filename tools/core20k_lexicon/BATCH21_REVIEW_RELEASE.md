# Batch21: reproducible staging release — independently QA'd structure

Validated against frozen Core20K V2.0.6 SHA256 e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca.

Local reproducible artifact `core20k_batch21_review_release.zip` includes a Python builder, regression test, complete 500-row editorial candidate JSONL, 9-row independent amendment proposal JSONL, and source+output SHA256 manifest.

Tested locally: 5/5 PASS (successful build, bitwise deterministic rebuild, zero unverified promotion, duplicate amendment rejected, mismatched identity rejected).

Risk distribution: 5 HIGH, 53 MEDIUM, 442 LOW_UNCHECKED. All 500 editorial records remain unverified; nine amendments are not applied in-place. Approved production KU=0; release_allowed=false.

Manifest input review SHA256 e09f1cf78531552711b37c79303d669ea48a610dd2e897944be5be940b10b75a; overlay SHA256 86ef79b10959a9b053671950b2ca1b1a56f70d938c4261b9ee76ff7f1cd3eb32. Review dataset output SHA256 db55e90873b3234d802b9e3ca71487a6dfded8d8a2c11e20e9b8c9e8a15e7ced.

The stable application, Chinese 20K, Scene500 recommendation algorithm, and SRS were not modified. Python and data remain in the linked local artifact until separately committed.
