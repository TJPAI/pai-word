# CG-KU-006 / B500 — Source extraction blocked

Assigned authoritative rank interval: **2501–3000**; expected 500 headwords.

Created independent branch `ku-factory-006-b500` from `core20k-lexicon-production-v1`.

Verified the source repository contains `data/core20k-runtime.json.gz` with Git blob SHA `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`. The GitHub connector returns its content as base64, but full gzip decoding and Sense extraction were not achieved in this execution. The frozen CSV `PAI_Word_Core20000_LongTermBaseline_Frozen_V2.0.6.csv` referenced by `tools/core20k_lexicon/README.md` was not found at the checked repository root. Therefore, **no claims of headword/Sense matching, KU reuse, generation, or independent QA are made**.

The empty `ku_candidates.jsonl` is an intentional zero-record staging artifact, not an empty completed batch. All work is isolated to this output directory; production assets are unchanged.

Recovery: obtain the frozen rank CSV with SHA256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`, decompress and parse the verified Runtime, join stable headword/Sense IDs by authority, then generate and checkpoint candidates with distinct structural/semantic QA. Do not activate candidates without independent certification.
