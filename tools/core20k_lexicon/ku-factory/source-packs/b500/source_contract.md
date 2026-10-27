# ENLEX KU Factory b500 source contract (2026-10-27)

## Provenance and scope
Generated exclusively from `data/core20k-runtime.json.gz` verified at SHA-256 `e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b`.
Each `source_XXX.json` contains exactly 500 records. Across 40 files the compact Runtime ordinal field covers 1–20,000 without duplicates. No production Runtime was modified.

## Important non-equivalences
- `runtime_rank` denotes the first field in the compact Runtime tuple; it has **not** been matched row-by-row to the frozen membership CSV (`PAI_Word_Core20000_LongTermBaseline_Frozen_V2.0.6.csv`). **Do not assert that runtime_rank is authoritative frequency rank**.
- `headword_id` is `null` because the compact Runtime does not encode explicit headword identities. `headword_id_hint` is an **unverified prefix inferred from existing KU IDs**, not a frozen ID.
- `senses: []` and `sense_status: formal_sense_id_missing_in_runtime` mean there are **no verified formal Sense IDs in this source**, not that the lemma has zero meanings.
- `kus[]` reconstructs exactly the Runtime 5-field tuple `[ku_id, ku_type, gloss_zh, gloss_en, active_flag]`, preserving the original KU ID. `ku_type: sense` **is not a canonical Sense record**. No provenance or source verification was inferred from the active flag.
- For structural words, do not invent an independent Sense; link to canonical lexical base once verified.

## Allowed operations
Read and analyse existing source records; draft new candidate Sense inventory and KU concepts separately with `CANDIDATE_PENDING_REVIEW` status. Never publish these records to Runtime and never label as `PRODUCTION_READY`.
Before rank-scoped production certification, obtain the frozen CSV, verify its SHA-256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`, and join **by authoritative immutable identity rather than assumed position**. Obtain canonical Sense registry or keep candidates explicitly provisional.

## QA gates
Source packs: 40 files, 500 records each, contiguous Runtime ordinals, unique casefold lemmas, unique existing KU IDs, digest-manifest match. Distinguish source-readiness from independent editorial certification.
