# V111 Sense-fit editorial pilot and QA

Inputs: V110 OMW source-synset-linked Chinese candidates, reviewed the first 65 records of the deterministic 2,000 headword-balanced selection. This is **editorial draft**, not double-blind quality certification.

## Actual draft results

- 65 bilingual sense-fit judgments with proposed glosses, English definitions, source lexemes and reasons.
- 42 ACCEPT_DRAFT; 16 REWRITE_REVIEW; 5 NORMALIZE_REVIEW; 1 SPECIALIST_REVIEW; 1 MISMATCH_REWRITE.
- Explicit mismatch: `resolve`, English definition "understand the meaning of", OMW candidate `解决/解答`; editorial correction `理解`, **not certified**.
- Format example: `significant` and `successful` include morphological `+的` notation, which is not a publishable gloss without normalization.
- Risk flags across 2,000 candidates: **844** records with at least one automated warning. Includes source collisions, Latin letters, excessive variants, long text, morphology markers; flag != semantic failure.

Sampling caution: first 65 rows of a deterministically shuffled, nonprobability review pool. These observations **cannot estimate full 21,852 source error rate**. Full double-blind gold labels = 0; independently certified Sense = 0; KU = 0; production Runtime unchanged.

Data archive `core20k_v111_editorial_semantic_pilot.zip` (65 editorial CSV, 2,000 QA flags, report and hash manifest) exists in current task artifacts, not copied into repository. Next: independent review of edits, 600 blind gold annotations, then validated screening release.
