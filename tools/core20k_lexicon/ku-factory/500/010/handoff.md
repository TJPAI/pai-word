# CG-KU-010 / Batch 500 — blocked source intake

Rank window: **4501–5000** (500). Isolation branch: `ku-factory-010-b500`.

## Verified
- Baseline branch `core20k-lexicon-production-v1`, HEAD `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`.
- `data/core20k-final-v206/freeze-contract.json` declares frozen CSV `PAI_Word_Core20000_LongTermBaseline_Frozen_V2.0.6.csv` and SHA256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`.
- The full Git tree was enumerated; frozen CSV is not present. `data/core20k-runtime.json.gz` is present (712,478 bytes) but not parseable through the available text-only GitHub fetch path. Its rank/Sense records therefore have not been read.

## Blocking issue
Cannot validate exact headword identity, canonical Sense IDs, or existing KU for rank 4501–5000. Zero generated KU rather than hallucinated data. Candidate file is intentionally empty. Absence of a sense count is **unknown**, not zero.

## Resume
Make authoritative frozen CSV (hash verified) and existing Sense/KU dataset accessible as readable content or an already-extracted UTF-8 JSONL/CSV split. Then verify each rank, `headword_id`, `sense_id`, existing KU, stage drafts and rerun structural + independent semantic QA. Never activate these records in production without review.
