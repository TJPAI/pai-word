# Batch93 Main Learning Flow — Isolated Integration Handoff

Status: **SOURCE_INTEGRATED / NOT_YET_BROWSER_DEPLOYED**. This is engineering QA, not a new language review or production-content publication.

## Grounding
- B218 delivery: `tools/core20k_lexicon/staging/B218_DUAL_AI_AGREEMENT_AND_MAIN_DEV_DELIVERY.json` on `core20k-teaching-qa-b162-20261024` (delivery commit `6402ee2a1d0a3753a4bdfd35dd2f63361ef59741`).
- B217 registered KU-anchored crosswalk (not the legacy empty reviewed list).
- Batch93 source: `tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json`, source SHA-256 `21d831519abdda34fadef88a601655373750ddf3385ea98d27370cfe2b1eec15`.
- Six formal KUs: `w_0266_person_ku01`, `w_0049_time_ku01`, `w_0041_know_ku01`, `w_0057_people_ku01`, `w_0139_talk_ku01`, `w_0099_here_ku01`.
- B216 + B218 language semantics: PASS 6/6 each, zero disagreement. Do **not** re-certify these six.

## Scope and behavior
- Reuses `rebuild-preview/index.html` + original `rebuild-preview/learning-runtime.js`. There is **no separate six-word answer page**.
- Explicit opt-in URL parameter: `batch93=1`; no effect when missing. `welcome=0` suppresses introductory overlay for QA.
- Auto-opens the six KU IDs in the existing self-rated learning session. Question card shows Batch93 context prompt; existing answer card shows approved teaching English gloss, numbered bilingual example and existing per-example playback control.
- No open-text Chinese grading; `accepted_zh` is retained only as context and never used to change self-assessment.
- Runtime KU identities and SRS algorithm not modified.
- Independent QA storage: separate IndexedDB, local state, pending grades, scene cursors, visual snapshot and reset marker; Batch93 reset does not clear stable preview stores.
- Explicit `production_ready=false`; production overlay remains protected. No publication to formal teaching pool.

## Engineering checks already run
- PASS: all 6 normalized candidate identities match B217 registration and B218/Muse delivery.
- PASS: isolated loader accepts all 6, rejects a forged rank/headword identity, leaves six mock Runtime records unchanged.
- PASS: all 6 existing answer renderings contain the Batch93 English gloss, bilingual example, sequence number and playback metadata.
- PASS: no new typed-answer input; content toggle hides isolated examples.
- PASS: HTML renderer, boot, state and durable storage scripts parse.
- PASS: existing audio click delegation, swipe control and three self-rating buttons remain text-identical to stable source.
- PASS: separate QA storage namespaces and QA-scoped reset.
- NOT EXECUTED: full Node test file `tools/answer-enrichment/test-batch93-main-integration.mjs` in CI.
- NOT VERIFIED: Safari/browser end-to-end audible playback, rating commit/persistence, gestures and auto-browse on deployed site.

## Isolated preview — manual deployment only
The existing `TJPAI/pai-word-preview` workflow `.github/workflows/deploy-preview.yml` already reads `teaching-answer-isolated-preview-20261025` and deploys it to `site/teaching-preview/`. That source branch has been updated with these changes. The old source has been preserved in `teaching-answer-preview-backup-20261026`.

1. Manually trigger `https://github.com/TJPAI/pai-word-preview/actions/workflows/deploy-preview.yml` on `main`.
2. After success, verify `https://tjpai.github.io/pai-word-preview/teaching-preview/preview-source-sha.txt` equals the current source branch head.
3. Open `https://tjpai.github.io/pai-word-preview/teaching-preview/rebuild-preview/?batch93=1&welcome=0`.
4. Confirm first card `person`, then navigate through `time`, `know`, `people`, `talk`, `here`; test answer, example playback, 不知道/模糊/知道, swipe, auto browsing and reload persistence.

Do not interpret the URL as live until the manual workflow completes and the SHA is confirmed. `perf-preview` remains sourced from the independent stable `home-perf-safe-load-20261022` branch.
