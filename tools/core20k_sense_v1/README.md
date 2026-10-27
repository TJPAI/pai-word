# Core20K Sense V1 — Audit and Reconstruction (2026-10-27)

## Scope and immutability
Baseline: Core20K Long-Term V2.0.6 FINAL_FROZEN.
Immutable: 20,000 membership entries, casefold-unique headwords, canonical rank, frozen role membership / authoritative CSV and ledger hashes. Membership SHA256: `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`.
Retain architecture: WORD_FAMILY -> WORD -> SENSE -> KU.
Editable: all **not explicitly frozen** content including Sense boundaries, definitions, translations, parts of speech, sense ordering/priority, evidence, Grammar, Collocation, Contrast, Usage, and KU content. Do not mutate canonical frozen artifacts.

## ID migration
Existing sense_id and ku_id can be revised, merged, deprecated or superseded with an explicit versioned old-to-new mapping; never silently reassign an ID to a different meaning. Support split/merge mappings and back-references, and block publication until downstream Scene500 and SRS migrations are audited. An old ID is *not* a global freeze on its content.

## Sense review procedure
1. Read the authentic frozen word and rank ledger, verify hashes and exact rank-lemma join.
2. Ingest legacy Sense and sourced dictionary (e.g., OEWN) candidates, distinguish candidate existence from verified sense content.
3. Compare at least two independent, appropriately licensed lexical references when possible; attach source URLs/edition/meaning-level provenance. Corpus occurrences/frequency require actual retrievable evidence; do not fabricate numerical ranks.
4. Analyze POS, semantic distinctions, polysemy, transitivity/valency, regional and domain restrictions; separate idiomatic / phrasal usages when instructional distinction warrants it.
5. Split/merge with explicit evidence and teaching utility. Record priority as evidence-backed tier, not invented corpus frequency.
6. Independently re-review each proposed canonical Sense with bilingual gloss and contextual example checks.
7. Mark PASS only against the specified gate and evidence set; never infer all-sense coverage from headword coverage.

## Review states
`UNEXAMINED`; `CANDIDATE_INGESTED`; `STRUCTURE_PASS`; `SEMANTIC_RISK`; `SOURCE_CROSSCHECK_PENDING`; `AI_REVIEWED`; `INDEPENDENT_SIGNOFF_PENDING`; `SENSE_CERTIFIED`; `DEPRECATED_MAPPED`.
Only `SENSE_CERTIFIED` counts as frozen *Sense content* in a future version. A published source link does not imply we accessed or verified it in this run. No automatic production promotion.

## Verified starting facts
- V2.0.6 `freeze-contract.json`: 20,000 unique ranks/lemmas; 12,994 inherited Core13K lexical, 6,002 lexical-semantic, 1,004 structural; content overlays evolve post-freeze.
- Batch28 OEWN matching: 3,078 headwords / 8,395 candidate senses, **no teaching-first Sense selected at that point**; 527 unmatched. Artifact says full merged JSONL is in a separate ZIP, not checked into GitHub.
- Batch88: 5,438 structurally suitable sense/KU candidates across 3,851 headwords; L2=0 / L3=0 at that batch. This pool is not a full 20K Sense ledger.
- Batch92: 6 AI-reviewed L2 records with no human editorial signoff and zero L3 production-ready.
- Batch87: 20 existing editorial semantic flags, all `independent_certified=false`.
These numbers represent overlapping workstreams at different times, **not additive totals or an exhaustive present-day headword-level audit**.

## First deliverable
`batch001_prioritized_sense_review.jsonl` is a curated, risk-first review backlog extracted from existing Batch87 flags with proposed review action, **not** a claim of newly verified semantic correctness. `batch001_evidence_gate.json` records reproducible counts/status and source paths.

## Release acceptance
An exhaustive canonical Sense ledger covering all frozen lexical headwords; justified zero-Sense exceptions for structural members; old/new ID mapping; zero untriaged semantic risks; explicit independent signoff; source and license receipts; rebuild/QA of downstream KU, Scene500, and SRS references. A complete corpus/source-based review has **not** been performed in this initial commit.

Original reference files:
- `data/core20k-final-v206/freeze-contract.json`
- `data/core20k-final-v206/post-freeze-policy.json`
- `tools/core20k_lexicon/BATCH28_OEWN_BULK_MERGE.md`
- `tools/core20k_lexicon/runtime/v1/batch87_semantic_20_editorial_flags.jsonl`
- `tools/core20k_lexicon/runtime/v1/batch92_l2_certification_qa.json`
