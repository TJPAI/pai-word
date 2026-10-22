# Batch 20 — nine targeted Sense correction proposals

Read 500 existing Batch19 Sense QA records. Confirmed baseline: 5 HIGH / 53 MEDIUM / 442 LOW_UNCHECKED. Nine records received **proposed editorial correction overlays**, not verified production replacements: january, using, internet, populism, moron, integrator, bassist, externality, homemaker.

Key discoveries: `internet` definition is complete; earlier `TRUNCATED_EN_GLOSS` classification was a false positive. The January WordNet definition adds a misleading historical solstice claim; editorial replacement is proposed while the original stays preserved in evidence. `externality` must not have the unrelated economic meaning mixed into the OEWN outwardness Sense.

OEWN 2025 is CC BY 4.0; attribution and lineage requirements remain mandatory. All nine overlays have `independent_dictionary_verified=false` and `production_ready=false`. This batch promoted zero KUs. Audit file and rebuildable JSONL correction overlay are included in local `core20k_batch20_semantic_overlay.zip` (not yet uploaded to GitHub).

The stable App and other project branches were not modified.