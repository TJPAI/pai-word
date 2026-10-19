# Batch 07 — measured Scene500 multi-sense bottleneck (2026-10-19)

## Actual local audit

Inputs: immutable Scene500 V4 runtime projection and all 80 previously SHA-verified Core20K preview word chunks. Examined exactly 500 scenes × original first 100 ranks = 50,000 positions.

- `unambiguous_general_sense`: **22,227** positions.
- `projection_selected_multisense_unverified`: **26,073** positions, representing **1,983 unique lemmas and 1,983 selected KU IDs**.
- `selected_ku_absent`: **1,700** positions.
- Crucial: existing projected KU ID for each of those 1,983 polysemous lemmas is invariant across scenes (no evidence of scene-specific disambiguation). Do NOT call the selected KU scene-verified.
- Example S001 rank 1 `dress` proposes a noun KU but `dress` has three playable senses.
- Largest multi-sense scene occurrence counts: `place` 87; `act` 75; `system` 70; `work` 67; `make` 65; `take` 65.

## Output

- Library `/PAI_Lexicon/core20k_scene_sense_gate_audit_v1.json`: per-scene status counts and evidence of unchanged projected KU.
- Library `/PAI_Lexicon/core20k_scene500_multisense_review_queue_v1.json.gz`: 1,983 lemma-level review records; each contains associated scene IDs/ranks, projected KU ID, alternatives with original Chinese/English gloss, and three **false** approval flags.
- All pending records are nonpublishable. **No auto-promotion based solely on matching an existing KU ID or having an English/Chinese gloss.**

## Priority and architecture

1. Continue displaying/using the **22,227 unambiguous positions** in an *isolated preview* only, where other product release constraints allow. This status is not dictionary-verified.
2. For ambiguous records, perform verified per-scene Sense selection, preferably grouping by lemma to reduce duplication; a scene may select an existing playable KU only after evidence/review.
3. The 1,700 absent KU positions require separate triage (null selected KU versus truly unresolved identity), not arbitrary first-sense fallback.
4. Keep immutable Scene500 rank 1–100, never fill missing slots from rank 101+.
5. SRS remains keyed by stable KU ID, shared across scenes; no new identity inferred from the scene label.
