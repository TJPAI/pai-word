# Core20K Batch 14 — CMUdict IPA draft audit

Actual input: `Core20K_Unified_MVP_20000.json.gz` SHA256 `9e1b93d4230b1009aefb758f77141c4951f8804b29321870fea637026e328b33`.

7,006 incremental words: 5,408 one-pronunciation ARPABET→IPA **drafts**, 395 multi-pronunciation review items, 1,203 absent from CMUdict. 5,803 candidates found, **zero independently accepted US IPA / zero Production Ready KU**.

The draft converter is not syllabification-aware (stress placed at the vowel nucleus, not syllable onset); this is not validated phonetic notation to show in the app. CMUdict redistribution/licensing check remains pending. Python candidate-generation script, 7,006 JSONL records and local QA tests (5/5 PASS) are in the Batch 14 local ZIP; the script and output dataset have not been pushed to GitHub.

**Freeze protected:** no mutation to 20K membership, stable app, Scene500 ranking, or SRS.
