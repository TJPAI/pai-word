# PAI English Lexicon — Core-13000 V25.5 runtime export

This directory stages the completed PAI English Lexicon data for `pai-word` for the integration branch. Production main remains unchanged.

## Release

- Source release: `Core-13000 V25.5`
- Headwords: 13,000
- Source rank range: 1–13,000
- Source master: `PAI_Lexicon_Core13000_V25.5_teaching_repair_12501_13000_master.json`
- Source ordering: inherited from `ngsl_sfi_31k.csv` (NGSL/SFI source ordering; CC BY-SA 4.0)
- `rank` / `frequency_rank` must not be described as an independently recomputed modern frequency rank.

## Packed data

The staged runtime teaching data is split into four Brotli-compressed JSON packs of 3,250 words each. The 89 MB editorial master is intentionally **not** shipped in the web repository.

Each packed word keeps the currently completed learner-facing fields needed for app integration: rank, lemma, POS, UK/US IPA, canonical senses with `sense_id` and `ku_id`, collocations with Chinese glosses, bilingual examples, and usage notes.

Fields that remain broadly pending in the Silver layers (for example many etymology / synonym / word-family items) are not promoted into this compact runtime pack merely to make it look complete.

## Data model

The canonical model remains:

`WORD FAMILY → WORD → SENSE → KU`

Future SRS state should be keyed by `ku_id`, not by the legacy `word::scene` key.

## Scene status

Scene mapping is not frozen. In particular, a large share of Silver entries still use placeholder domains such as `time_space_abstract`. Do not randomly distribute those words across the ten current app scenes.

## Verification integrity

This export preserves the source release's verification boundaries.

- Structural integrity: PASS
- Editorial teaching content: inherited from Core-13000 V25.5
- Dictionary verification: PENDING wherever the source release says pending
- Corpus collocation validation: PENDING wherever the source release says pending
- Example external spot-check: PENDING wherever the source release says pending

No dictionary/corpus verification is implied by inclusion in this repository.

## Activation status

`ACTIVE_ON_INTEGRATION_BRANCH`

The four original pack bytes have been verified against the original manifest SHA-256 and included in this branch. Gzip compatibility packs contain byte-identical decompressed JSON. The new runtime uses canonical `ku_id` and conservatively preserves unresolved legacy records with an immutable local backup. See the root README for migration limits and validation evidence. Production `main` has not been modified.

30 senses lack KU identifiers and remain visible as additional meanings without invented SRS identities. Scene annotation and external teaching-content checks remain incomplete. Browser visual validation remains pending.
