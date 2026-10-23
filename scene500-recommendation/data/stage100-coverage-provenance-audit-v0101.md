# Scene500 V0.10.1 — 100-link experimental coverage audit

Source: actual complete 20,000-term V0.10.1 runtime, original 3,553 association links, experimental 3,653 association links and 100-entry detailed editorial source pack. This is a local **data/provenance audit**, NOT a real Hybrid runtime A/B execution or semantic certification.

| Metric | Baseline | Experimental |
|---|---:|---:|
| Association links | 3,553 | 3,653 |
| Distinct linked term IDs | 1,613 | 1,695 |
| Core20K coverage | 8.06% | 8.48% |

100 new distinct pairs, 99 distinct terms, **82 previously unlinked terms**, 17 terms with prior associations, 30 scenes extended. All 100 additions resolve to the matching stable term, exact scene name, detailed editorial rationale and counterexample and are excluded from the baseline. Structure/provenance gate PASS. All new association scores are the same fixed **0.6**: no calibration evidence; do not report ranking/precision gain. Semantic independently certified **0**. Original Hybrid module A/B run **not performed**.

Local artifacts: `scene500_stage100_coverage_provenance_audit.json` SHA256 `dabcb8fa6e7b020a7a17eec44e9916fbe8eb493302156a0244743107f6cd0520`; `scene500_staging_coverage_audit.py`. Experiment quality: `UNVERIFIED_NOT_PRODUCTION`. Neither production association data nor main were modified.
