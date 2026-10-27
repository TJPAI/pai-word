# CG-KU-009 handoff — blocked staging

- Scope: rank 4001–4500 (500 frozen headwords); isolated branch `ku-factory-009-b500`.
- Inspected `data/core20k-final-v206/freeze-contract.json`: frozen external membership SHA-256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`.
- Inspected `tools/core20k_lexicon/README.md`: CSV deliberately excluded from Git repo; exact byte SHA validation required.
- Inspected `data/core20k-runtime.json.gz` metadata: git blob `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`; UTF-8 fetch fails because gzip bytes. Base64 partial lines are not enough for authoritative lookup.
- The Scene500 ranked word files contain scene candidate ranks and some KU references, but cannot substitute for the authoritative Core20K complete rank list and Sense identity mapping.
- No KU was generated or reused. Empty `ku_candidates.jsonl` is intentional; it is not a completed batch.
- Required unblock: obtain and validate full frozen CSV plus machine-readable complete existing Sense/KU inventory for ranks 4001–4500; only then generate candidates.
- Formal Runtime, SRS, Scene500 and other batches untouched. No production release permitted.
