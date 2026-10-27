# CG-KU-003 handoff — blocked, not a completed KU batch

Target ranks: **1001–1500** (500). Source branch `core20k-lexicon-production-v1` at `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`.

Verified: freeze contract references external 20,000-row CSV (`PAI_Word_Core20000_LongTermBaseline_Frozen_V2.0.6.csv`, SHA-256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`). The GitHub repository tree contains the compressed `data/core20k-runtime.json.gz`, but neither the frozen CSV rows nor decompressed Sense/KU records were obtained in this execution. Do not substitute KU repair queue offsets for authoritative ranks.

No headword or Sense records were fabricated; no KU candidates were generated or certified. Both structural coverage and semantic QA remain blocked. Empty `ku_candidates.jsonl` is intentional. No production runtime, SRS or other task directory changed.

**Next input required to resume:** accessible frozen CSV or exact-rank text export plus existing Sense/KU record export corresponding to ranks 1001–1500, with their stable IDs and provenance. Validate hashes and IDs before generation. This checkpoint does not count as a completed production batch.
