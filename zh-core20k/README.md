# PAI Word Chinese Core20K — independent development branch

Status: **candidate_unfrozen**, version **0.9.0-rc.1**. This branch is isolated from `core20k-rebuild-v1`. No app/home/SRS/Scene500 logic is changed.

## Validated local delivery assets (not yet committed here)
- `zh-core20k.json`: 20,000 candidate lexemes, SHA-256 `0f23193f94accd24a4705966e0f96aa27c9330260d4ce3eceb8ef6524b92f327`
- `zh-core20k.min.json`: 20,000 compact entries, SHA-256 `6fffb098fa80d98c2b7738c6c585614ffefe5925bc9a4057ef966b80619f2076`
- `zh-core20k-tokenizer-dict.txt`: one term per line, SHA-256 `6ab380b929e0a8b3041dd4892739a04de4fc3109e8a911fe85ce328c7c0248e0`
- `zh-core20k-audit.json`: QA, SHA-256 `e49c3f6c3255155ab32d2dbd3136754f738386a00ad7b3c4e3d171a6b0d6a4b9`

These assets currently exist as **conversation delivery attachments**. GitHub data upload is a separate pending step; do not claim the files are on this branch.

## Interface
The full dataset uses `records[]` with `term_id`, `term`, `normalized_term`, `frequency_rank`, `frequency_score`, `pos`, `aliases`, `source_version`, `historical_position`, and evidence-status fields.

`term_id` = `zh_` + first 20 lowercase hex digits of SHA-256 of exact UTF-8 `term`, independent of ordering. A spelling change creates a new ID and requires explicit migration.

No corpus-derived frequency or part of speech has been validated; `frequency_rank`, `frequency_score`, `pos` are `null`. Historical position is **not** a frequency rank. Orthographic alias mapping is lookup-only; not synonymous merging or membership replacement.

The tokenizer dictionary holds membership, not frequency or POS. An experimental longest-match benchmark reached only 75% exact recall on 12 illustrative intent sentences. This is **not** a validated segmentation system.

## Release blockers
- Independent general-language corpus frequency ranking
- Contextual segmentation/POS quality benchmarks
- Independent seven-domain token coverage measurement
- Review of editorial candidates / mixed-script terms
- Upload local validated assets to this isolated branch and verify each SHA-256

Do not merge into or modify stable `core20k-rebuild-v1` until checks pass.
