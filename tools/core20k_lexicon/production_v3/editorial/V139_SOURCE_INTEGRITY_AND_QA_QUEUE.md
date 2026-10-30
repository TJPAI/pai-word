# V139 — Verified source integrity and risk prioritization

Actual inspected archive: `core20k_v138_merged688_12_revisions_applied.zip`, member `v138_merged_688_with_12_applied.jsonl`, SHA256 `fda14a8eb1ba468229382fa341b19267bcc8b0417bef7cd6a75b731b290ede0d`.

Against actual V127 2,000 source records: 688 records, 688 distinct Sense Keys, source identity/rank/lemma/POS/ILI/English definition/Chinese OMW lexeme mismatch count **0**, certification-flag violations **0**. Source batch counts V128 130, V129 95, V130 75, V131 60, V132 55, V133 85, V134 38, V135 75, V136 75.

Automated risk queue has **135** records with at least one QA flag. **95** of these have no literal substring overlap with available OMW Chinese lexical candidates; this is *not* a demonstrated semantic error. Other indicators include >8 source lexicalizations, lengthy candidate Chinese glosses, and specialist English definitions. Original undecided pool remaining **988** records, now serialized in `remaining_988_source_candidates.jsonl` for the next batch.

Downloadable user ZIP: `core20k_v139_source_integrity_and_priority_qa.zip`, contains source-integrity manifest, ranked review CSV and the 988 original source candidates. This complete ZIP is not committed to GitHub: report only.

New editorial draft count V139: **0**. Independent semantic certifications: **0**. Formal Runtime unchanged. No assertion that automated QA establishes semantic correctness. GitHub permanence of the complete draft data remains an unresolved engineering issue.