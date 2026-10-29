# V100 OEWN × Core20K actual source matching (2026-10-30)

Inputs: real OEWN 2025 extracted V99 source (185,129 lemma-sense links); V95 audited archive nested V93 register (27,471 legacy Sense rows).

- Casefold-distinct legacy lemmas: **19,995** (five fewer than the desired frozen Core20K 20,000).
- OEWN 2025 lemma-sense links for those 19,995 lemmas: **58,923** (unique sense keys also 58,923).
- Legacy lemmas with no literal casefold match in OEWN 2025: **691**.
- Legacy Sense records without the *same lemma and synset ID* in the source: **800** (including missing lemma matches; needs review).
- Muse's projected **60,204** is NOT reproduced with this precisely defined simple lemma join. The difference is **1,281** source links, and should be investigated by adding the real frozen missing five headwords and documented lexical normalization or other original source membership criteria; never fabricate records or target counts.

A zipped local provenance package `core20k_v100_oewn_legacy_alignment.zip` contains 58,923 matched source records, 691 unmatched lemmas, 800 unmatched legacy lemma-synset identities and report. The ZIP is not uploaded in this GitHub commit.

WARNING: this is a first-pass lemma casefold match, **not** finalized pedagogical selection and not a substitution for user-authorized frozen 20K list or source SHA verification. 0 independent semantic certifications; 0 Runtime changes. Next verify original rank-to-lemma list and variant mapping, then repeat full 60,204 universe counting with traceable criteria.
