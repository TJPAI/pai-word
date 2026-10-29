# CG-ENLEX V65 quality evaluation contract

V59 model output (200 rows), V60 editorial-draft counterpart (200 rows), and V63 scoring artifact (200 rows) were joined by unchanged teaching_sense_id and definition_en on 2026-10-29. All 200 identities and machine strings match.

## Verified findings
- 200/200 V59 candidates were rewritten as V60 drafts. **This is not a 100% machine-error rate**, as V60 has not been independently certified.
- V63 heuristic flags occur for 28/200.
- On nine previously identified erroneous V59 records, only three were flagged; three scored >=0.90 cross-lingual similarity.
- No translation can be auto-certified based only on embedding similarity, heuristic flags, or draft-editor agreement.

## Critical V64 test flaw
The old script asserts rule_flag_recall < 0.5 and high-score errors >=3, i.e. it inadvertently treats poor detection as a *successful test*. Those metrics belong in an audit report, not as desired quality thresholds. V65 replaces this with positive invariants: every record must remain quarantine and cross-source identities must match. When a gold-labeled representative benchmark exists, enforce minimum positive thresholds with a calibrated rejection policy.

## Needed next benchmark
Use stratified sampling by POS, source, word frequency and technical-domain tag. Independently assign correct / partly correct / wrong labels, with adjudication for disagreement. Compare semantic precision, false-negative rate, usable-gloss yield and runtime for proposed generators and QA models. V60 editorial drafts are **not** ground truth.
