# Scene500 V0.10.1 batch 4 evidence review

Executed direct-file checks on the real Core20K V0.10.1 runtime, 500-scene catalog, original 3,553 associations, and 117 batch-4 editorial suggestions.

- **117/117** candidate rationales used generic wording, including “直接涉及的概念、对象或活动（需复核具体词义）”; this is *not* independently valid semantic evidence.
- Automated risk gate: `audit-chat-candidate-evidence.mjs` flags generic wording; it does not automatically approve the remainder.
- Chat-model rewrite: **19** candidate relations received specific Chinese sense-based rationale and disambiguating counterexample; each remains `release_eligible=false`.
- Executed against actual sources: **19/19** stable term IDs resolve to the stated word, scene IDs resolve to stated names, and none duplicates an original association.
- Local artifacts: `scene500_batch4_evidence_audit_v0101.json` and `scene500_batch4_specific_editorial_v0101.json`.
- No new links have production certification; base remains 3,553. Review and Top5 evaluation remain required.

Next priority: assess concrete scene/sense precision, then admit only genuinely reviewed associations into a staged release with performance regression.
