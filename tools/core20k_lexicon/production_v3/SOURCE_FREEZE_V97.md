# CG-ENLEX V97 source freeze status (2026-10-30)

**STATUS: BLOCKED — source bytes missing.** Repo SHA is not a file checksum. No 60,204-source-Sense selection may run until five file hashes are calculated from exact downloaded bytes. No source marked VERIFIED just because URL exists.

| source | version pinned | source URL | local SHA256 |
|---|---|---|---|
| OEWN 2025 | 2025-edition, git dc343f2683279ecbb13fab4e2fd778d7b162d287 | https://en-word.net/static/english-wordnet-2025-json.zip | PENDING |
| ECDICT | git ab22ad36302cafc6349a050e2b60894855208055 | https://github.com/skywind3000/ECDICT/tree/ab22ad36302cafc6349a050e2b60894855208055 | PENDING |
| OMW-cmn | git e3b5ac103f86b743a1c0e3079675aaf0ef2cbf88 | https://github.com/globalwordnet/omw/tree/e3b5ac103f86b743a1c0e3079675aaf0ef2cbf88 | PENDING; cmn asset path not yet verified |
| Kaikki English | enwiktionary dump 2026-10-01; wiktextract commit 19f9a3006a405fb7bfb40193dca41c7117a009a5 | https://kaikki.org/dictionary/rawdata.html | PENDING |
| zh Wiktionary | zhwiktionary dump 2026-10-01; wiktextract commit 19f9a3006a405fb7bfb40193dca41c7117a009a5 | https://kaikki.org/zhwiktionary/rawdata.html | PENDING |

The local V97 preflight script and structured manifest were produced in core20k_v97_source_freeze_preflight.zip, but are **not** persisted by this GitHub commit. Local container cannot resolve public network hosts. All five file checks are currently BLOCKED: 0/5 verified.

Next pass: obtain exact source files, verify SHA256, log raw bytes and license, then run the 60,204 inventory and reconcile with legacy 27,471 records. Never assert that 60,204 is reproduced until source run proves it. Semantic certification remains 0.
