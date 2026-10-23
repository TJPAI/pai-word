# Batch50 — semantic triage for 2,261 Mandarin Sense drafts

Executed local semantic-risk QA over the actual Batch48 normalized 2,261 JSONL records (input SHA256 `3cfeded39310eb2c366de39170e3e2a8779d61a73220cee31ab706ad767e71ab`). Generated per-candidate audit queue of 2,261 records: 15 HIGH targeted editorial issues, 191 REVIEW records with one or more heuristic signals, 2,055 UNSCREENED (not accepted). All 2,261 retain source_sense_id and current Chinese gloss.

The 15 targeted candidates have concrete editorial issues and nonautomatic correction proposals, e.g. bacterium (outdated taxonomy in WordNet), homeopathy (medical efficacy caveat), acquiesce (nuance mismatch), untitled/radicle/tonnage/bleacher (uncommon senses vs likely teaching-first Sense), prion, exonerate, psychopath. No independent second-dictionary verification or accepted promotions. The risk counters overlap by signal, not unique headwords.

Actual deliverable in `core20k_batch50_semantic_triage.zip`: `semantic_triage_2261.jsonl`, `targeted_review_15.jsonl`, `audit.json`, README. Source builder at `/mnt/data/build_core20k_batch50.py`. SHA256 triage `3d342ec6562dded2cbcd46db7dc8b1542e11da0af7b585be8d69a67c6cf0dd85`; targeted corrections `078ec97402910473896efb0fff4299e7f4528ae1f031adb4e0d9dee480cce69f`.

All statuses remain unverified. Zero Production Ready KU. Existing stable app/Scene500/SRS/frozen Core20K unchanged. Audit record only on GitHub; underlying data remain in the downloadable artifact.