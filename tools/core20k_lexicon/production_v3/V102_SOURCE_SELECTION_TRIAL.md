# V102 OEWN 58,923 source-sense five-way trial (non-binding)

Inputs: frozen Core20K V2.0.6 20,000 membership; OEWN 2025 58,923 exact casefold matched lemma-senses; legacy 27,471 entries.

## Measured output
- KEEP_CORE: 17,420
- KEEP_EXTENDED: 9,273
- MERGE_REVIEW: 0 (no exact same lemma+POS+definition across two synsets; semantic similarity not used)
- DEFER: 29,920 (only insufficient supporting evidence: **NOT** a deletion or rejection)
- GAP_REVIEW: 2,310 (previously unseen single-sense POS coverage)
- Total: 58,923

Legacy normalized rank+synset pairs: 26,767; intersection 26,671; 96 unmatched legacy source pairs, 32,245 new OEWN source pairs absent from legacy. Original 704 rows without a synset require separate mapping and are **not** folded into these pair counts.

Rules are deliberately conservative: protect sole source sense headwords, prioritize repeated SemCor evidence, review new POS coverage and never auto-delete/merge. No independent semantics or corpus confidence has been measured. These are **triage proposals**, NOT educational selection approvals. No attempt to reconcile Muse 60,204 by inventing 1,281 records.

Local data output: core20k_v102_full_source_selection_trial.zip including all 58,923 source rows, two set differences, executable algorithm and SHA256. Full zip not in GitHub. Following Muse roadmap, next source coverage test and double-annotated gold set must precede threshold-based exclusion or release.
