# Batch 15 — Source-linked Chinese gloss reuse

Actual Library source: `Core20K_Batch500_source_and_zh.csv` (500 distinct headwords), SHA256 `de899eb09a795f1f951355082f2fb88eaa8d10aa347bdbfeb2f491643470d506`.

Source-level re-audit: 134 records have editorial Chinese gloss drafts; 366 are missing drafts. All 500 retain original OEWN sense source locators and source sense IDs. None is marked as independently verified or Production Ready.

Local archive `core20k_batch15_zh_reuse.zip` includes the runnable `reuse_zh_batch500.py` extractor, 134-row review JSONL, 366-row authoring JSONL, and `audit.json`. Source-specific machine invariants pass: 500 source records, 500 distinct ranks/candidate keys, no lost source IDs, 134+366=500.

Next: translate only the missing 366 without overwriting inherited editorial drafts, then independently verify bilingual Sense alignment. Stable App, Frozen Membership, Scene500 ranks and SRS untouched.
