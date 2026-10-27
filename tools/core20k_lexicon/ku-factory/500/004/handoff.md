# CG-KU-004 / B500 handoff

Target rank: **1501–2000** (500 headwords). Branch: `ku-factory-004-b500`.

## Verified
- Production lane README explicitly identifies the frozen V2.0.6 CSV as externally supplied and requires strict membership/rank matching.
- `data/core20k-runtime.json.gz` exists on source branch; blob SHA `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`.
- Isolated branch created. No formal Runtime or other factory batch modified.

## Blocking gap
The frozen CSV is not found at the documented repository-root filename. The GitHub connector returned the gzip runtime as base64 but did not provide decompressed records. Hence no authoritative 1501–2000 headwords, valid senses or existing KU alignments were recovered in this run. No generated candidates are asserted.

## Next required work
Decode the verified runtime or obtain the frozen CSV plus existing Sense/KU dataset; check every rank/headword_id/sense_id before candidate production, perform Sense-level AI drafting, persist checkpoints, and run structural and independent semantic QA. The empty candidate file is a placeholder only, not evidence of completed coverage.
