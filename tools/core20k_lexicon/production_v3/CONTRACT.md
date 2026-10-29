# CG-ENLEX Sense V3 Production Contract — 2026-10-30

Source of decision: Muse independent audit, user-approved; isolated work only.

## Fixed policy
- Use three-stage funnel: L1 synset-anchored dictionary evidence, L2 evidence-constrained strong-model candidate generation, L3 stratified semantic QA.
- Stop Marian/Qwen2.5-0.5B production, chat-by-chat gloss authoring, rank-only batches, embedding threshold certification, adding gloss_zh_vXX fields.
- One current Chinese field: `gloss_zh`, status: `gloss_zh_status`, all originals in `gloss_provenance[]`.
- Conflicting texts are QUARANTINE, not arbitrarily selected. All outputs remain unverified until independent gate.
- Source-sense universe is reported as 60,204 but not reproduced from frozen OEWN in this branch; the 27,471 legacy register is a comparator, NOT authoritative selection output.
- No changing stable sense IDs, KU IDs, or production Runtime.

## Verified local migration V96 (not a full repository upload)
Input inner archive SHA256: `a298ad5ae92ce7827796f5d51027fdb8371174d6f26d192420c5922c9562eab7`.
Legacy rows: 27,471. Ledger rows: 1,020. Candidate single-text rows: 8,541. Conflicting candidate rows: 400. No Chinese candidate: 18,530. Semantic certified: 0. Production ready: 0.

The local data artifact `core20k_v96_canonical_migration.zip` is NOT present in this GitHub commit. Treat the hashes as traceability, not proof of remote persistence.

## Required next evidence
1. Freeze version and SHA256 for OEWN 2025, ECDICT, OMW-cmn, kaikki English, zh Wiktionary; do not fabricate missing assets.
2. Reproduce all 60,204 source senses, 20,000 headword membership, and per-source selection against legacy 27,471.
3. Design 600 double-blind gold labels; do not assert kappa before two independent annotation passes.
4. One deterministic build_register and two CI jobs; all materialized payloads and reports must be read back from this isolated branch.
5. Any significant selection population change, new paid compute, or two repeated rule failures require user decision.
