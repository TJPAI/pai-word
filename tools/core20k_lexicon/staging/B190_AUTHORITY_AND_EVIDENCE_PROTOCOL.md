# B190 — Authoritative KU registration boundary and evidence protocol (proposal, not release)

Verified source at Core20K production branch `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`:
- `scripts/core20k-ku-registration-gate.mjs` only performs a **local field predicate**. `canRegisterKU` takes a caller-supplied `lockedLegacyIDs` set.
- `scripts/core20k-production-staging-gate.mjs` checks nonempty identities and staging isolation; B161 staging supports **cloze** and **inflected_cloze** only.
- Four B184 phrases are still provisional and the independent isolated Chromium preview acceptance does not register them.

## Findings requiring implementation before registration
1. **Existing sense ownership is not verified by the registration predicate.** A nonempty target_sense_id passes even when there is no verified parent sense or the phrase belongs to a different headword. Must validate against the authoritative frozen Core20K registry and explicit sense owner/headword mapping.
2. **Novel KU ID allocation is not delegated to any authority.** A caller-supplied arbitrary nonempty ku_id passes unless that ID appears in the caller-supplied set. Gate needs a complete frozen-ID/registered-ID snapshot with checksum and an atomic reservation or serialized release procedure; retries must be idempotent.
3. **Evidence locator/field scope are existence checks only.** The predicate does not fetch, confirm semantic relevance, confirm source version or verify licensing against a trusted registry. These must be independently validated; a fabricated locator cannot be made authoritative by passing a test.
4. **Editorial accepted is a string equality check.** Acceptance requires a signed-off, version-bound editor decision and dual-AI reconciliation of any revisions, independent of render E2E.
5. **Rendering is not registration.** `structure_recognition` cannot be fed as-is to the older B161 cloze-only staging gate, nor may the gate be relaxed just to make B184 pass. Build a separately audited adapter/contract, preserve quarantined status until all formal gates pass.
6. **Pronunciation is an independent content issue.** The existing `canRegisterKU` does not check US IPA at all. Phrase-level pronunciation evidence remains pending, but must not be misrepresented as a check implemented by this function.

## Proposed controlled state progression
`UNREGISTERED_PROVISIONAL` → `EVIDENCE_VERIFIED` → `SENSE_OWNER_VERIFIED` → `ID_RESERVED` → `REGISTRATION_ACCEPTED` → `RELEASE_CANDIDATE` → `PRODUCTION_READY`.

Each transition must have a machine-readable evidence pointer, frozen source commit/hash, independent QA verdict and an explicit authorization actor. A successful offline predicate is at most a precondition for registration; never direct approval to write Runtime or SRS.

## B184 candidate disposition
`bear in mind`, `package deal`, `on board`, `cut down on`: all 4 have isolated preview content/Chromium acceptance; **0 official new KU registrations** and **0 production-ready approvals**.

## Immediate next execution
1. Verify B189 GitHub Actions job by a run ID or public job log (commit-workflow PR-only lookup returning [] is inconclusive).
2. Extract exact B184 candidate headword + field values and identify current official headword IDs; do **not** use guessed ranks/headword IDs in provisional plans.
3. Query the authoritative Sense/KU snapshot for parent sense ownership and collisions (include source SHA); generate an exact crosswalk with `FOUND`/`UNRESOLVED`.
4. Collect permitted primary lexical evidence and licensing for each retained phrase; distinguish headword IPA from phrase-level IPA.
5. After reviews, propose allocation as a pending transaction, never mint IDs without a registry-authoritative commit protocol.

This document is a QA policy proposal. It changes neither the official registration predicate nor any published Runtime or learner state.
