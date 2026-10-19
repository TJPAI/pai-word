# Core20K V1: Actual legacy-rich preservation batch

Source: `PAI_Lexicon_Core13000_V25.5_teaching_repair_12501_13000_master.json`
SHA-256: `d815d541f598b98f0af580df4a6902b0e87067d97304863bd1bd8859aa0b651f`

**Executed** with local script `/mnt/data/build_core20k_legacy_rich.py` on 2026-10-19, after validating prior `core13k20k_actual_audit_v2.json`.

- Input: 13,000 V25.5 records, 16,586 distinct KU IDs.
- Extracted: 12,990 non-ambiguous candidate records with rich fields and original provenance.
- Quarantined: 10 records (two absent from previously compared Core20K runtime: `dem`, `nome`; eight across four duplicate lemma groups: `dispatch`, `drape`, `overt`, `pathological`).
- **Entire input** contains 39,000 examples, 38,988 collocations, 6,189 usage notes, 130 contrast entries, 146 family entries, and 5 grammar patterns. These are full-source tallies, not verified published or preserved-item subtotals.
- Output gzip hash: `1e6813fc19ca2db383667e0e0aea7e33d9acb00c81e8762757f087af79b1bf9e`.
- Persistent Library: `/PAI_Lexicon/core20k_legacy_rich_preservation_v1.json.gz` and `/PAI_Lexicon/core20k_legacy_rich_preservation_report_v1.json`.

**Release status: BLOCKED.** This package preserves assets but does not independently validate dictionary evidence, source rights, target KU ownership, or Core20K runtime compatibility. It does not overwrite deployed data.

Next concrete gate: materialize frozen Core20K runtime and join old candidate `knowledge_units.id` to new `headwords[].units[].id`, verifying lemma and KU type, and apply documented duplicate-lemma remaps.
