# Core20K Rebuild V1 — measured master baseline

Audited with `node scripts/audit-master-rich.mjs <local-core13000-v25.5-master.json> <report.json>`.

## Actual V25.5 master results
- **13,000 records, 12,996 distinct case-insensitive lemmas**
- **16,586 unique KU IDs**, with no repeated KU IDs
- **39,000 example entries; 38,988 collocation entries; 6,189 usage note entries**
- **130 synonym-contrast items; 5 grammar-pattern items; 146 word-family items**
- Duplicate lemma groups: `dispatch`, `drape`, `overt`, `pathological`.

These numbers are from the **V25.5 full master**, not the V26.7I learning-v3 runtime manifest (which separately reports 16,616 KU). Never confuse versions or automatically infer quality from populated fields.

## Rebuild decisions
1. Make full master the **provenance source of record**, with V26.7I sanitized chunks used as a **runtime quality filter/reference**; do not downgrade good rich content to reduced runtime fields.
2. Join KU by stable ID **and KU type**, and verify ownership by original record. Do not use lemma-only joins for duplicate lemma cases.
3. Preserve all rich arrays as candidate assets with original status; do not label them dictionary/corpus verified unless the record provides traceable direct evidence.
4. Quarantine 4 ambiguous duplicate lemma groups. Resolve per KU and sense with an explicit alias ledger; never arbitrarily choose higher/lower rank.
5. New ~7K words come from frozen Core20K membership; 13K provenance remains immutable.
6. Need full Core20K payload locally before quantitative **cross-dataset** migration tests and build. Current executed audit covers the V25.5 master alone.

## High-priority next tests
- Input master + 20K runtime SHA hashes and exact provenance version.
- Per-field non-loss counts (examples, collocations, usage, contrast, grammar), deduplicated by original record ID and KU ID.
- Missing 13K-to-20K lemma/KU orphan report and duplicate resolution ledger.
- Playable KU and scene Top100 integrity, UI and offline regression.
