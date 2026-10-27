# CG-KU-002 incomplete handoff

- Scope: rank 501–1000, 500 expected headwords.
- Isolated branch: `ku-factory-002-b500`.
- Source: `core20k-lexicon-production-v1` commit `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`.
- Runtime: `data/core20k-runtime.json.gz`, blob `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c` (712,478 bytes).
- Audit branch `enlex-gloss-audit-20261026` resolves to same runtime blob.
- No headword/sense payload has been decoded and audited. Hence no KU candidates were legitimately generated. The empty candidate file is intentional, not a completed batch.
- Next step: securely materialize/decompress authority runtime; derive exact rank 501–1000 inventory and valid senses; reuse existing certified KU; generate candidate KU only for verified missing or flawed senses; run structural and independent semantic QA.
- No production assets modified.
