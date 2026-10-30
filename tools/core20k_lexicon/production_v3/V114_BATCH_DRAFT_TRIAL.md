# V114 — Batch source-anchored 2,000 Sense draft trial

Real input: V113 priority review CSV, exactly 2,000 distinct Sense Keys. This pass deliberately does not invent Chinese text or use a paid semantic generation API.

## Measured
- 2,000 candidates processed, distinct Sense Key count 2,000.
- **234** exactly one display-ready OMW lexicalization: verbatim **source lexicalization draft**, not validated sense gloss.
- **1,766** multiple lexicalization choices or format concerns: quarantined with **empty gloss_zh_draft**, no arbitrary selection.
- 20 earlier definition-guided editorial rows included in **separate** file; none has independent approval.
- Independently certified: **0**; production ready: **0**; Runtime change: **none**.

Outputs in local `core20k_v114_2000_source_anchored_drafts.zip`: keyed 2,000 candidate JSONL, separate 20 editorial rows, manifest, SHA256. Full data is NOT backed up to GitHub.

**Quality limitation:** no natural-language semantic judgments have been made across all 2,000 records in this stage; the 234 single-lexeme strings are not automatically correct English-definition translations. This is high-throughput *preparation*, not completed L2 generation or quality certification. Real L2 semantic drafting requires definition-guided decisions with evidence, preferably independently reviewed. Avoid repeating only triage stages.
