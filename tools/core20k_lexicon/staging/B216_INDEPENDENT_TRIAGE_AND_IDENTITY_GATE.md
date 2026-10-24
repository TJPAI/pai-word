# B216 Independent content triage and authoritative identity blocker (2026-10-25)

## Scope and source pins
- Base runtime source branch `core20k-lexicon-production-v1`, HEAD `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`.
- Main preview commit `b99fc357897b8b966d1691c6847236d18185ba89`, file `rebuild-preview/batch93-staging-preview.json` (STAGING_ONLY).
- Original teaching file `tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json` (6 records), schema `pai-core20k-teaching-pack-v1`.
- Runtime crosswalk file `tools/core20k_lexicon/runtime/v1/identity-crosswalk.json` currently `BLOCKED_PENDING_ROW_LEVEL_VALIDATION` with `reviewed_crosswalk: []`.

## Editorial spot review (ChatGPT, NOT independent dual-signoff)
| Headword | Example | Chinese translation | Content triage | Limitation |
|---|---|---|---|---|
| person | One person is waiting outside. | 有一个人在外面等候。 | Semantic alignment acceptable | Identity and independent evidence gate pending |
| time | We need more time to finish. | 我们需要更多时间才能完成。 | Semantic alignment acceptable | Identity and independent evidence gate pending |
| know | I know the answer. | 我知道答案。 | Semantic alignment acceptable | Identity and independent evidence gate pending |
| people | Many people live here. | 许多人住在这里。 | Semantic alignment acceptable | Identity and independent evidence gate pending |
| talk | We talk every evening. | 我们每天晚上交谈。 | Semantic alignment acceptable | Identity and independent evidence gate pending |
| here | Please come here. | 请到这里来。 | Semantic alignment acceptable | Identity and independent evidence gate pending |

All six English-Chinese example pairs appear natural and semantically consistent at the sentence level. This is **one AI reviewer triage**, not independent certification, nor direct source-licensing verification. Original attribution URLs alone do not establish reuse rights. No new external dictionary source was fetched in this audit.

## Identity and certification
- Batch91 source-master identity verification is **not** authoritative current-runtime KU/sense mapping.
- Current runtime crosswalk contains zero reviewed mappings. The six legacy `w_..._ku01` IDs therefore have **0 verified current-runtime matches in the published crosswalk** (not a finding that all six are absent from the Runtime).
- Do not create new formal sense IDs to repair this. If Runtime lacks sense IDs, request an authoritative owner-provided mapping/release with stable identities.
- `content_certified:false`, `production_ready:false` on all six in the preview. Official `teaching-pack.json` has zero records, and `manifest.json` reports `production_ready_ku_count:0`.
- Current formal overlay eligible count **0**. STAGING_ONLY preview eligible **6**.

## Release gates, in priority order
1. Obtain authoritative row-level mapping: old headword/sense/KU to current-runtime KU, exact match plus sense ownership. Reject ambiguous matches.
2. Independent second-party bilingual semantic review with per-KU evidence, alternative answer policy, US IPA verification, provenance and licensing disposition.
3. Only after gates pass, issue a signed/versioned overlay manifest with exact runtime SHA-256, record count, coverage, source attribution, immutable KU identities, and release decision; test fail-closed behavior.
4. Main dev should retain isolated preview; do not touch SRS, playable pool, official runtime, or user learning state.

## Decision
**STAGING_ONLY; PRODUCTION_READY=0; no production overlay released.** This document is a factual gate and editorial triage report, not a certification certificate.
