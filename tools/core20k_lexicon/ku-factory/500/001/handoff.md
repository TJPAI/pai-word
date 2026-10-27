# CG-KU-001 / BATCH_SIZE 500

Scope: Core20K authoritative rank 1–500. The source `data/core20k-runtime.json.gz` is readable via GitHub only as base64-encoded compressed bytes (blob `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`). Its decoded headword/Sense records could not be loaded in the current execution environment. The frozen CSV named in `tools/core20k_lexicon/README.md` was not present at the referenced root path.

**Status: BLOCKED_SOURCE_EXTRACTION. Not completed.** No headword/Sense identities were invented. No KU generated, repaired, or counted as reused. `ku_candidates.jsonl` is intentionally empty. Structure QA and semantic QA are not passed. No production promotion is authorized.

Next prerequisite: read the authoritative decompressed Runtime or the frozen ranked identity/Sense table; verify its canonical rank 1–500 and existing valid KU records, then generate and audit a nonempty candidate set in this directory.
