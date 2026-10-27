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

## Existing frozen CSV provenance audit (not independently re-run here)
Production branch `core20k-lexicon-production-v1` contains `tools/core20k_lexicon/staging/b167_frozen_csv_byte_verified_20261024.json`, reporting CSV SHA-256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`, 52,613,957 bytes, 20,000 rows, continuous ranks, and **0 rank–lemma discrepancies versus Runtime**. This is historical positive evidence from a previous audit, not a fresh crosswalk of CSV bytes in this branch. Preserve this distinction in every downstream QA report.

The runtime compact tuples contain `ku_id` but not a standalone canonical `sense_id`; additional Sense registry provenance is required for per-Sense coverage claims. Never substitute repair-queue index for rank.

## Canonical identity investigation
On `enlex-gloss-audit-20261026`, `tools/core20k_lexicon/runtime/v1/identity-crosswalk.json` explicitly reports `BLOCKED_PENDING_ROW_LEVEL_VALIDATION` and `reviewed_crosswalk: []`. Its 16,816 legacy KU IDs do not match this exact frozen Runtime snapshot's 16,617 KUs; do not merge these counts across different snapshots. The B161 crosscheck `tools/core20k_lexicon/staging/b161_runtime_identity_crosscheck_20261024.json` records `candidate_sense_id_equals_runtime_sense_identity: 0` and warns that registry Sense identity is represented as `ku_id`; separate candidate Sense IDs cannot be asserted equivalent without reviewed mapping. Therefore prior B167 frozen membership evidence does **not** unblock canonical formal per-Sense identity.
