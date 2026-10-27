# CG-KU-007 controlled handoff

Scope: rank 3001–3500 (500 expected), branch `ku-factory-007-b500`.

## Verified
- The production source branch exists.
- The source file `tools/core20k_lexicon/README.md` describes the frozen Core20K CSV as externally supplied; it must be SHA-256 verified.
- Frozen CSV was not found at the documented repository root path.
- Compressed runtime at `data/core20k-runtime.json.gz` is present (Git blob `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`). Its contents have **not** been decoded and checked against the frozen rank mapping in this task.

## Blocker
Without a validated rank-to-headword mapping and existing Sense/KU identities, generating 500 entries risks wrong identities and is prohibited. Candidate array is intentionally empty, not a completed batch. Source-level and semantic QA remain blocked. No Runtime or another task directory was modified.

## Resume criteria
Read frozen CSV matching SHA-256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`, extract ranks 3001–3500 and join stable Sense and KU identities from a verified runtime, then generate and audit candidates. No production promotion without independent QA.
