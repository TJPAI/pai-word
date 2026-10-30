# V117 GitHub editorial draft persistence audit

Actual V115 editorial source archive `core20k_v116_verified_editorial_checkpoint.zip` contains 90 full rows, schema fields: sense_key/rank/lemma/pos/definition_en/gloss_zh_editorial_draft/source_lexemes/ili/wn30/status/source_lexeme_exact_part_match/semantically_certified/production_ready.

Nine GitHub projection JSON files in `tools/core20k_lexicon/production_v3/editorial/` were READ BACK with fetch_file on branch `experiment/enlex-v3-production-rebuild-20261030`:
- v116_draft_part01,02 (20 from prior turn)
- v117_draft_part03–09 (70 created this turn)
- 9 x 10 rows = **90**, **90** distinct sense keys, 0 empty Chinese drafts.
- All files explicitly marked draft pending independent review (two equivalent status spellings).
- WARNING: GitHub JSON files are **two-field projections only** (sense_key, Chinese draft). They are NOT full-source-provenance backups. To restore complete records, preserve V116 source ZIP or perform a source-faithful data import; no claim of complete original-record persistence.
- Independent semantically certified = 0; production ready = 0; Runtime unchanged.

Main correction compared with V116: GitHub holds all **90 draft gloss projections** instead of 20, now read back and counted. Remains to import 90 full source rows, address validation and convene independent semantic review; full V116 ZIP available in this chat session.
