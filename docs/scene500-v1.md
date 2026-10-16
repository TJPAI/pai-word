# PAI Word Scene500 V1

## Baseline

Scene500 is rebuilt on the Core-13000 branch state immediately before the 312-scene architecture was introduced. The previous 312-scene state is preserved on `backup/312-scenes-before-500-redesign-20261016`.

## Architecture

The learning unit remains KU. Scene membership is a separate many-to-many semantic layer:

`WORD -> SENSE -> KU <-> SCENE`

A headword must never be assigned to a scene merely because one of its other senses fits that scene. Polysemous words therefore require sense/KU-level decisions.

The scene model uses four orthogonal facets:

- Theme: what the content or interaction is about.
- Place: where or in what environment it occurs.
- Task: what the learner is trying to do.
- Function: what communicative function is being performed.

The public taxonomy contains 20 categories and 500 scenes. The taxonomy is defined independently from KU mapping so scene design can remain stable while mapping quality improves.

## KU-scene link policy

Each link records `kuId`, `sceneId`, `relevance`, `confidence`, `source`, `evidence`, and `reviewStatus`.

Allowed sources are dictionary-verified evidence, corpus-verified evidence, editorial verification, and generated candidates. Generated candidates are review input only and cannot go live directly. Headword-only evidence is insufficient. A live link requires sense-level evidence and `reviewStatus=verified`.

`relevance=core` means the KU is central to accomplishing or understanding the scene. `relevance=extended` means it is useful but not defining.

## QA and release gates

Before Scene500 replaces the current runtime scene layer:

1. The taxonomy validator must pass: exactly 20 categories, exactly 500 unique scenes, 25 scenes per category, stable S001-S500 IDs, and all four facet fields.
2. Every link must reference a valid scene and an existing Core-13000 KU.
3. No word/headword-level mapping record is accepted.
4. No `generated_candidate` can be promoted automatically to `verified`.
5. Scenes shown as learnable must have a reviewed minimum core set; empty or weak scenes remain unavailable rather than being padded with speculative words.
6. Candidate generation, editorial review, and production release are separate states.
7. Coverage statistics must distinguish candidate, pending, verified, and rejected links.

## Migration strategy

The old pre-312 topic runtime remains operational while Scene500 mappings are built. Do not switch the UI merely because the 500 labels exist. The migration sequence is:

1. Define taxonomy and mapping contract.
2. Generate conservative KU-level candidates with provenance.
3. Audit candidates scene by scene and sense by sense.
4. Promote verified links only.
5. Measure verified coverage, collisions, overmatching, and missing high-value KUs.
6. Switch runtime reads to Scene500 only after release gates are met.

This avoids repeating the failure mode of broad lexical/alias matching followed by large-scale manual cleanup.
