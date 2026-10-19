# Core20K V1 — batch 02 verified rich-content join

The frozen Core20K file was located at `Core20K_Runtime_Unified_20000.json.gz` and joined locally with the persisted 13K preserved candidates. A previously generated 26 KB intermediate `core20k_joined_rich_candidates_v1.json.gz` is **invalid / truncated**; do not use it.

## Executed V2 join (2026-10-19)
- 20,000 target words; 16,617 target KU IDs.
- 12,990 source candidate records; **12,990 successfully matched**.
- 16,574 candidate KU identities matched both **type and lemma**; zero mismatches.
- Conserved content: 38,970 examples; 38,958 collocations; 6,182 usage notes; 130 contrast items; 146 word-family items; 5 grammar-pattern entries.
- Produced `core20k_joined_rich_candidates_v2.json.gz`, 3,898,373 compressed bytes; successful gzip+JSON roundtrip.
- SHA-256: `7ea0cf7641dd187589ba2f09fa6f89930b3db402a8ca513101e87595e35a4197`.
- Source Core20K SHA-256: `e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b`.
- Saved to Library: `/PAI_Lexicon/core20k_joined_rich_candidates_v2.json.gz` and `/PAI_Lexicon/core20k_joined_rich_candidates_v2_report.json`.

### Unresolved
1. 10 quarantined original records (8 duplicate-lemma rows and `dem`, `nome`), not silently merged.
2. 1,557 changed Chinese KU descriptions require source-aware field-level editorial decisions.
3. Run-time playable eligibility, Scene500 rank eligibility and offline caching still need end-to-end tests.

**Join success means stable structural correspondence, not publication approval or editorial verification. No changes to production runtime or main.**
