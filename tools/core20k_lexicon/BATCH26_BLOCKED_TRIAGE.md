# Batch26 — 216 blocked candidate review queue

Actual reconciliation: registry 1,106 (3 registered, 627 need second source, 476 blocked). Within the Batch500: 3 registered, 281 need second source, 216 blocked.

The registry `evidence_gap` for **all** blocked records is the same generic `sense_or_pos_review_required`; this is a gate category, **not** 476 verified individual defects. The 216 local batch records were exported to a reproducible JSONL queue with heuristic review tags: 192 `GENERAL_SENSE_POS_REVIEW`; 9 historic issue tags; 7 derived-form/alternate-sense tags; 6 weekday tags; 5 source definition review tags; 1 month name tag. Tags overlap. Six specific editorial attention items were identified, but no candidate promoted.

Three pre-existing KU IDs (`commoner`, `personable`, `upload`) preserved, not minted. Tests 8/8 PASS; queue hash SHA256 `e67bfd899edc560b854dd2ebda22241c647dd09678fce39b0c120932123aa9f2`. Full data + builder in local downloadable `core20k_batch26_blocked_triage.zip`.

**No independent semantic verification, new KU IDs or Production Ready promotion.** Source data or stable app unaffected.