# English Core20K – isolated producer/consumer contract (2026-10-22)

This branch owns **English-learning content only**. Chinese 20K belongs to the natural-language Scene500 recommendation project; do not join those vocabularies directly.

Frozen source: Core20K V2.0.6, SHA256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`. Membership and ranks cannot change.

The audit of Library Core13K V26.7O master (SHA256 `4f709dfe4fa806ee53cc78985daa26eaa055309f3a96066f78a695e01dc9f949`) recorded:
- 13,000 source word records / 12,996 distinct old lemmas
- 12,994 distinct English headwords matching frozen Core20K
- 7,006 frozen members absent from **this specific old master**
- 12,998 matching old word records because `dispatch`, `drape`, `overt`, `pathological` have duplicate legacy entries
- 16,360 legacy Sense records and 16,816 KU records across those matching records
- These are field-presence and identity counts, NOT dictionary verification, validated Sense alignment or Production Ready.

Staging file formats:
1. `legacy_reuse_crosswalk.jsonl`: `core20k_rank`, `lemma`, `legacy_word_id`, `legacy_sense_ids[]`, `legacy_ku_ids[]`, `field_presence`, `status=LEGACY_SOURCE_UNREVIEWED`.
2. `missing_7006_discovery_queue.jsonl`: `core20k_rank`, `lemma`, `task=FIND_EXISTING_CORE20K_INCREMENTAL_ASSET_BEFORE_AI`. These entries are NOT necessarily missing from all Core20K branches.
3. Future consumer contract (only verified records): `headword_id`, `sense_id`, `ku_id`, `pos`, `definition_zh`, `ipa_us`, `sense_examples[]`, `sense_collocations[]`, `grammar_notes[]`, `usage_notes[]`, `contrast_items[]`, `other_senses[]`, `quality_level`, `field_evidence[]`.

Never synthesize canonical IDs by overwriting old ones. Produce a reviewed identity migration map first. Word-level examples/collocations cannot become Sense-level content by default. Never mark AI-generated fields as dictionary_verified.

Scene500 delivery is only `sceneId → headword_id → sense_id → ku_id`, accompanied by original scene_rank, learning eligibility and scene review status; scene members, rank and recommendation algorithm are immutable and owned elsewhere.

The stable `core20k-rebuild-v1` branch, app UI, automatic pronunciation, SRS logic, and Chinese-language recommendation project must not be modified here.
