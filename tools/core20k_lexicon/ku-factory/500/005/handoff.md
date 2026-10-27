# CG-KU-005 handoff (incomplete)

- Requested authoritative ranks: **2001–2500** (500 headwords).
- Isolation branch: `ku-factory-005-b500`.
- Source branch checked: `core20k-lexicon-production-v1`.
- Confirmed source: `data/core20k-runtime.json.gz`, Git blob SHA `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`.
- Canonical frozen CSV described in `tools/core20k_lexicon/README.md` is an externally supplied artifact, not confirmed in this repository.
- Connector provided the runtime as base64 gzip; the source was not decompressed or parsed into authoritative rank/Sense rows in this execution.
- **Actual KU generated: 0.** No KU or Sense identity was invented.
- Pending: obtain/decode canonical source, verify rank map and existing Sense/KU IDs, then produce all requested 500 headwords; execute structural and independent semantic QA.
- Do not merge, deploy, or mark any candidate `PRODUCTION_READY`.
