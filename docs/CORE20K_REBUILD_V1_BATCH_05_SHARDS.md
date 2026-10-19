# Batch 05 — Sharded, non-publishable Core20K preview

Executed 2026-10-19 with the actual Core20K + 13K-rich unified candidate bundle.

- 80 gzip shards, 250 words per shard, ordered by immutable Core20K rank.
- 20,000 rows, 12,990 legacy-rich words, 16,574 legacy KU identities, 38,970 examples.
- Shard compressed bytes total: 4,879,523; all 80 re-read, SHA-256 checked, inflated and parsed.
- Seven boundary and random on-demand rank lookups passed (1, 250, 251, 10000, 12990, 19999, 20000).
- Archive ZIP SHA-256: b89da75f9630b522ad8348996923392750f6baeb1d917c8bc0eb29fd2518de78
- Persistent Library: /PAI_Lexicon/core20k_rebuild_v1_preview_shards.zip and /PAI_Lexicon/core20k_rebuild_v1_preview_shards_qa.json
- Reproducer: scripts/rebuild-v1/build-preview-shards.mjs

**Do not publish.** Legacy-rich content is candidate-only and unapproved, and this batch has not yet run browser loading, offline caching, Scene500 binding or Safari smoke tests. Rebuild branch only; main and published Pages remain untouched.
