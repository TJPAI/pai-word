# B217 Release-gate reconciliation and owner handoff (2026-10-25)

## Evidence status
- QA branch HEAD before this handoff: `8b513756b9b03cbf7fc77b48d6302db90d385c73`.
- Muse B215 independent QA: `tools/core20k_lexicon/staging/b215_independent_qa_report.md` and evidence JSON; reports six exact KU ID matches against pinned Runtime `data/core20k-runtime.json.gz` SHA256 `e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b`.
- Muse B216 second-party certification: `tools/core20k_lexicon/staging/b216_second_party_certification_report.md` and JSON; semantic PASS 6/6, production approval 0/6.
- Another QA artifact `tools/core20k_lexicon/staging/B216_SIX_KU_IDENTITY_GATE_BLOCKED.json` reports BLOCKED_RUNTIME_ROW_NOT_READ because **that auditor** could not read the binary Runtime. This does **not** disprove Muse's direct 6/6 comparison; it documents a separate audit's evidence limitation. Both reports remain intact, without falsely combining their attestations.
- Current published `tools/core20k_lexicon/runtime/v1/identity-crosswalk.json` is `BLOCKED_PENDING_ROW_LEVEL_VALIDATION`, `reviewed_crosswalk: []`. **No registration authority has signed the six entries.**

## Ownership decision requested
**Proposed accountable owner:** English Core20K Runtime / identity-registration maintainer of `core20k-lexicon-production-v1`. This report does not impersonate that authority.

### Registrar deliverable (first priority)
1. Re-run `b215_identity_check.py` against exact pinned Runtime and Pack; verify SHA-256 of both input bytes.
2. Produce six *row-level* records with rank, lemma, POS, exact KU ID, KU type, runtime gloss, evidence anchor, runtime SHA and reviewer/approver identity.
3. Treat `sense_id` as **NOT PRESENT in runtime**. Explicitly decide either (a) establish an authoritative Sense registry with stable IDs, or (b) approve a documented KU-anchored Sense binding for this overlay. Do not infer official Sense IDs from `s01` naming alone.
4. Update crosswalk only under the registrar's authority, in a versioned, reviewed commit; preserve all preexisting identities. Publish an auditable signoff.
5. Require fail-closed behavior if Runtime SHA, KU ID, type, POS or rank/lemma ownership changes.

### Main developer deliverables
- Implement acceptance of precise Chinese equivalent answers (especially `time`), with positive and negative scorer tests. Do not silently require exact answer string.
- Explicitly separate `example_en` and `example_zh` in the formal answer UI; `e` is English-only.
- Test flag-off no-op, no staging overlay access to SRS writes, immutable base Runtime, and production E2E after registrar approval.
- Generate a versioned overlay manifest pinned to Runtime and pack hashes, explicit approval status, and fail-closed tests. Do not publish it as approved before all gates pass.

### Release authority / independent QA
- Release authority: document a production-display rights decision for original examples/paraphrases and decide whether human-editor signature is required.
- Muse: independently audit registrar entries, scorer and isolation test outputs, signed manifest and E2E evidence. No self-signing on registrar's behalf.

## Gate matrix
| Gate | Evidence now | Release state |
|---|---|---|
| B216 second-party semantic | PASS 6/6 | Satisfied for pinned pack |
| Exact KU membership | Muse B215 6/6 direct check | Evidence exists; registrar attestation pending |
| Sense registration/binding | Runtime has no sense_id field | OPEN |
| Authoritative crosswalk recording | reviewed_crosswalk empty | OPEN |
| Alternative-answer scorer | policy only | OPEN |
| Versioned approved manifest and fail-closed tests | not delivered | OPEN |
| Isolation regression | separate preview exists, formal overlay untested | OPEN |
| Production license decision | low-risk staging only | OPEN |
| Official learning-flow E2E | separate preview only | OPEN |
| Human signoff | conditional on release policy | UNDECIDED |

**Decision:** `STAGING_ONLY`, formal `PRODUCTION_READY=0`. No Runtime, crosswalk, SRS, production manifest, or learner state was changed by this handoff.
