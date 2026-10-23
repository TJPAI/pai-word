# Core20K Batch 63 — Legacy KU production-certification preflight

Audited actual Library Core13K V26.7O master, SHA256 `4f709dfe4fa806ee53cc78985daa26eaa055309f3a96066f78a695e01dc9f949`: 13,000 word records and 16,818 KU records.

Two higher-evidence historic status groups: `dictionary_verified_spotcheck` (94 KU) and `dictionary_source_backed_editorial_ready` (45 KU). Extracted **139 unique existing KU IDs**, of which **78 Sense KU**, across **68 distinct headwords**. The groups are preflight candidates, *not* full Production Ready.

Per-row blockers: 139 lacking complete release certification, 139 lacking sufficient independent Sense verification under current production gate, 119 needing independently verified POS-specific IPA, 61 non-Sense KU, 20 missing resolvable Sense links, 20 missing Sense-level gloss EN and Chinese. Blockers overlap. **Zero** new PRODUCTION_READY, zero runtime-visible KU, no synthesized canonical IDs, no Scene500 learner mappings.

Local independently rerunnable artifact `core20k_batch63_legacy_certification_preflight.zip`: Python builder, 139-row `candidate_ku_preflight_139.jsonl`, `audit.json`, README. SHA256 records `a2f3b0589489af0104a98cd5517c9c4c097fbcaae4ebe610e4a2f55a8de70237`. Legacy rank is expressly **not** frozen V2.0.6 rank and needs crosswalk before release.

Existing committed runtime/v1/manifest.json remains BLOCKED, release_eligible=false; teaching pack remains 0. Source stable branch and consumer branch were not modified. This commit documents the audit; the full 139-row data is distributed in ZIP, not in GitHub.