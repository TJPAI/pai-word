# CG-KU worker restart protocol — 2026-10-27

Select TASK_ID 001–040, BATCH_SIZE 500. Read `tools/core20k_lexicon/ku-factory/source-packs/b500/source_<TASK_ID>.json` on branch `enlex-source-packs-b500-20261027` (direct UTF-8 JSON). Compare SHA-256 against `source_manifest.json`.

The pack provides **runtime ordinal records**, not verified frozen frequency ranks. Preserve `runtime_rank`, original `ku_id`, all source tuples, and uncertainties. Use normal ChatGPT lexical judgment to create actual, varied **candidate** Sense/KU content. Do not mechanically generate templated prose. Do not fabricate formal `sense_id` or `headword_id`; use independent temporary identifiers namespaced by TASK_ID only in the candidate namespace. Source-derived `headword_id_hint` is not an official identity.

Do not call an existing `ku_type=sense` record a formal Sense. Record absent/ambiguous Sense IDs as blockers. Existing Runtime KUs can be preserved/reused as source observations but are not automatically certified. The worker can draft candidates against lemma and explicit gloss evidence; it cannot claim **formal per-Sense coverage** until the frozen membership and formal Sense registry are reconciled.

Worker output: candidates.jsonl, missing_sense_ids.jsonl, qa_report.json, status.json, README.md on isolated `ku-factory-XXX-b500` branch. Keep all candidates `CANDIDATE_PENDING_REVIEW`. One batch = 500 runtime ordinal entries. QA must verify non-overlap, preserved original KU IDs, provenance, nonempty distinct language content, and no Runtime changes. Report honestly if unable to produce meaningful AI content.
