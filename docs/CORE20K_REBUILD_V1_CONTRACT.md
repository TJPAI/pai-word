# Core20K Rebuild V1 — non-lossy upgrade contract

## Decision
Build from **Core-13000 V26.7I runtime content** and its underlying verified V25.5 provenance, while preserving the **frozen Core20K membership/order**, canonical KU identities and Scene500 V4.0 Top100 ranking. Do not extend or copy low-quality placeholders by default. This branch is isolated from main and Pages production.

## Must preserve
- WORD FAMILY → WORD → SENSE → KU; SRS continues to address stable `ku_id`.
- Former 13K valid Sense, Grammar, Collocation, Contrast, Pronunciation and Usage/Risk content, examples and usage **subject to recorded evidence/quality status**.
- Adopt verified improvements already made in Core20K when they are demonstrably better; never blindly overwrite either side.
- Original one-sentence scene finder, difficulty selector, answer/reveal/grading UI and round choices (10/25/50).
- 500 canonical scenes and original rank 1–100 per scene. Apply difficulty and playable-KU gate *within* Top100; no rank 101+ top-up.
- Cross-scene shared KU/SRS; do not copy a per-scene user record.
- Offline-first caching with 250-word or equivalent chunks; load lightweight catalog first, hydrate content and scene shards on demand.
- Current test users are synthetic, so no forced preservation of test user data. KU identity remains stable for future users.

## Non-lossy acceptance requirements
1. Snapshot exact input manifests, hashes, frozen 20K candidate order and version provenance.
2. Compare lemma and KU ID sets. Explicitly resolve older collisions/aliases, including 13K duplicate-lemma cases. No silent dropping of meaningful legacy KU.
3. Rich-data preservation audit: for each common KU, compare substantive `definition`, `examples`, `collocations`, `usage`, `contrast`, `pronunciation`; carry forward content with provenance and validation status.
4. Formerly suppressed/generated placeholders must remain suppressed. A nonempty legacy field alone never establishes quality.
5. New ~7K headwords need lexical Sense/KU coverage and a clean quality status; no fake evidence or `dictionary_verified` by inference.
6. SRS key is stable `ku_id`; learning only selects playable units. Separate scene inventory size from session round size.
7. Automated tests: schema, identity uniqueness, orphan accounting, content-loss diff, Scene500 Top100 rank cap, difficulty, quiz/answer/SRS, offline cache and initial rendering once.
8. Do not promote to `core20k-pages` or `main` without executable QA and real browser smoke-test evidence.

## Build batches
A. Extract baseline data contracts and a canonical provenance ledger.
B. Implement 13K rich-content migration plus explicit collision resolution.
C. Integrate ~7K additional words from frozen Core20K membership.
D. Restore chunked runtime and offline behavior; retain original PAI Word UI.
E. Integrate canonical Scene500 Top100 and strict fail-closed sense eligibility.
F. Run automated acceptance checks, compare with previous runtime, prepare isolated preview.
