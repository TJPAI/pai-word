# V98/V99 actual source acquisition and OEWN inventory

GitHub Actions #40961824263 ended FAILED, but artifact 12935788212 contains two actual files.

| Source | Bytes | SHA256 | Status |
|---|---:|---|---|
| OEWN 2025 JSON zip | 9,986,555 | 7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51 | Downloaded; inspected |
| ECDICT CSV | 66,009,548 | d1ecbdf9ee2b920afb6f430ca6b6bb9f559588cf0dff86e04bd255f9390843cc | Downloaded; file SHA only |
| OMW-cmn | — | — | 404: wrong URL, repo tree contains no cmn data asset |
| Kaikki English | — | — | >300 MB cap; partial bytes discarded |
| Kaikki Chinese | — | — | >300 MB cap; partial bytes discarded |

Directly parsed OEWN 2025 (verified downloaded bytes): **107,519 synsets; 185,129 lemma-sense links; 128,009 distinct lexical lemma strings; 0 unresolved synsets**.

IMPORTANT: These are entire-OEWN counts, **NOT** the Muse-reported 60,204 Core20K-specific selection. That figure cannot be reproduced without stable Core20K lemma membership and selection criteria. No 60,204 inventory has been certified.

The local full source inventory is core20k_v99_oewn_source_inventory.zip, not yet persisted to GitHub. Do not mark five sources FROZEN; current 2/5 have byte hashes and 3/5 blocked.

Next: correct OMW source to an actual downloadable cmn dataset, use frozen chunked Kaikki or test a smaller stable alternative, establish the Core20K headword key reconciliation and source-to-legacy difference. No semantic certification or Runtime changes.
