# CG-ENLEX Sense gloss misalignment / KU throughput audit — 2026-10-31

## Grounded inspection
- Compared 100 source rows in `v4_ai_gloss_batch_005.jsonl` by `teaching_sense_id` with the corresponding 100 corrected KU glosses in `ku_drafts/v1/ku_context_cloze_010.jsonl`: **100/100 differ**.
- Compared 100 source rows in `v4_ai_gloss_batch_007.jsonl` with `ku_context_cloze_012.jsonl`: **100/100 differ**.
- Manual semantic inspection of samples establishes grossly unrelated Chinese glosses (e.g., `digest`=食宿, `primer`=女性, `headquarter`=美国西部片). This is a systemic *semantic mapping* failure, not minor stylistic revision.
- Neighboring source batches 004, 006 and 008 were spot-checked (first five items each) and showed plausible alignment. **No full-universe correctness claim**.
- 200 KU candidate corrections are *drafts*, not a reviewed/certified overwrite. The earlier manifest `total_missing: 0` measured missing text, **not semantic correctness**.

## Failure hypothesis and safeguards
- Likely row/index alignment error in historical gloss generation, import or batch assembly; exact offending step has not been proven.
- Never align model gloss output by row order across regenerated or mixed batches. Always join by stable `teaching_sense_id`; include lemma, POS and definition to let the model disambiguate.
- Validate deterministic identity, expected row count, no duplicate IDs, blank response, and one-to-one answer matching. Deterministic checks cannot prove semantic alignment.
- ChatGPT chat-mode semantic screening: feed 100–200 compact `ID | lemma | POS | English definition | Chinese gloss` records; return **only mismatches** with original ID and suggested replacement, preserving provenance. Process batches 005 and 007 as priority; then screen all other batches systematically.
- Never replace authoritative original Sense records until corrected records are keyed by stable ID and reviewed in a controlled overlay, keeping the original fields and provenance.

## Throughput analysis / replacement process
**Prior bottleneck:** hand-authored ~100 long questions + bilingual translations + JSON structure per tool call; frequent progress reporting; repeated remote fetching; producing detailed explanations for each item. Complexity scales with output tokens, not GitHub throughput.

**ChatGPT-only candidate-production loop (zero paid API / no Work / no Muse):**
1. Pin a GitHub SHA; extract next 500 unserved teaching_sense_ids, excluding any existing KU ID.
2. Partition into five fixed 100-sense subsets. Each subset prompt is compact: `ID | lemma | POS | sense definition | Chinese gloss`.
3. In each subset, ChatGPT produces a compact single-line teaching record: `ID<TAB>type<TAB>question<TAB>answer<TAB>short Chinese context`. Favor cloze; use sense recognition where ambiguous. Correct/flag mismatched Chinese gloss.
4. Javascript connector code joins by ID into full JSONL records and stable KU IDs; check answer, blank, duplicate and English definition, not only lemma.
5. Commit each subset or 500-pack and remote-read once; report consolidated totals. No meaningless intermediate user approvals.
6. After coverage, Muse audits semantic adequacy, rare senses and extra collocations; do not tag draft as PRODUCTION_READY.

**Caveat:** 500 fully elaborated KU records in a *single model output* are likely to hit context/output limits; five compact ~100-record blocks per conversation turn is a more credible target, subject to actual measured throughput.

## Present status
- Existing draft KU files 001–012 contain 700 unique IDs by prior verified read.
- 200 source mismatches were identified using corrected KU drafts, but the remaining source batches have not undergone systematic semantic QA.
- No Runtime or authoritative Sense overwrite performed by this report.
