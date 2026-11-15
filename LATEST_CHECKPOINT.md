# CG-ENLEX latest checkpoint

Updated: 2026-11-15  
Role: CG-ENLEX / Chief English Lexicon Architect  
Exclusive branch: `experiment/enlex-v3-production-rebuild-20261030`

## Recovery state and verified source heads
- Last verified branch HEAD **before checkpoint**: `41415af10689b73de60d897226e51498c1935098` (NATIVE27 triage correction). This value is intentionally not self-referential; always fetch remote HEAD at resumption.
- Startup previous HEAD: `587bd4500a6845a61ddea13fd2ff6019857f0de2`, V57 accelerate source-gate report (Git blob `2cdcf44829acaf8f971ad316d61e489597b2b9cd`).
- Latest separately verified peer heads at read time: CG-QA `c4dff2e82feaf63390acea137e29ca6773c4d994`; CG-MASTER `85e37b9ae8fb13cff6b483461f4c2ac5cab228cb`. Recheck before use.
- GitHub Issues: [#1](https://github.com/TJPAI/pai-word/issues/1), [#2](https://github.com/TJPAI/pai-word/issues/2); incrementally process comments after observed #1 `6890147039`, #2 `6890147525` (check time ordering/role-specific handoffs rather than assume comment IDs are complete cross-stream clocks).

## Immutable boundaries
- Core20K **20,000 headwords / 27,471 Senses** is frozen. Never rewrite it.
- V13 403-row review ledger (ENLEX 278 provisional/125 HOLD; CG-QA 275 lexical support/22 revise/106 other) and V13 risk 125 **do not merge** with historical V17 separate 125.
- Do not modify Scene500, Scene1341 authoritative Master, production Runtime/SRS or formal pronunciation feed.

## Source-pinned completed deliveries
1. Existing Muse IPA resumption intake: `tools/core20k_lexicon/production_v3/qa_reports/CG_ENLEX_MUSE_IPA_RESUMPTION_REVIEW_INTAKE_20261113.v1.json`, blob `6f0b24e21d84a9fe3980423c47615f4a3d7ec714`. Extract CI #43368425601, artifact #14011925246, ZIP SHA256 `59b4dd3ee4a34bc7b7787b13976270a2aa64e1517d31ace65e28cf9ea011ff98`; correct raw Kaikki SHA256 `4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99`.
2. Verified Muse review `tools/core20k_lexicon/staging/MU_ENLEX_IPA_NATIVE27.v1.json` on `core20k-teaching-qa-b162-20261024`, blob `81247ed6c53afead54036826658b697f8f4a4bf3`: 27 KU, 19 Muse PASS / 8 Muse CONDITIONAL; **not** CG-QA formal PASS. NATIVEWORD100 report blob `0f032db0bf41280b230dc1630f27413f4a0d69d7`: 100 KU, 34 Muse PASS / 66 CONDITIONAL. MISSING75: 75 expressions/141 KU, no attested native phrase IPA (remain null).
3. **New 2026-11-15 independently traceable triage:** `tools/core20k_lexicon/production_v3/qa_reports/CG_ENLEX_NATIVE27_EIGHT_CONDITIONAL_TRIAGE_20261115.v1.json`, blob `eb4c3ee34bb42de2fadda54dd2e27c8b6348b841`, parent/head `41415af10689b73de60d897226e51498c1935098`. Eight records: regional label 4 (KU-00079, KU-00098, KU-00280, KU-00412), primary stress / weak form 2 (KU-00640, KU-00950), broad-vs-narrow transcription 2 (KU-01241, KU-01710). Preserves verbatim source strings, original source_line/sound_index, Muse rationale and explicit source-triaged/QA pending status. **No newly asserted phonetic PASS or native reconstructed IPA.**
4. V57 `accelerate`, audit_row_no `104671`, former verb transitive-causative gloss versus cosmological intransitive use stays `HOLD_VALENCY_SOURCE_MISMATCH`. File `tools/core20k_lexicon/production_v3/qa_reports/CG_ENLEX_V57_ACCELERATE_VALENCY_MUSE_QA_ADJUDICATION_20261113.v1.json` blob `2cdcf44829acaf8f971ad316d61e489597b2b9cd`. Analyst illustrative example is not the original Master utterance. V56 sense5 candidate is not sufficient without exact Kaikki line/gloss and Master record_id.
5. CG-QA checkpoint `tools/core20k_lexicon/qa/CG_QA_CHECKPOINT.json`, blob `5f8c2bad96b4a3af537ddb4bbc619c7a41f952fe`, records Phase1 203 fresh drafts, zero first reviews as of its checkpoint. Do not conflate this Scene1341 work with frozen ENLEX baselines.

## Active blocks / handoffs
- Ask CG-QA to independently adjudicate each of eight NATIVE27 CONDITIONAL rows against exact candidate and teaching Sense; preserve regional/notation/stress rationale and independent evidence commit.
- For NATIVEWORD100, reconcile actual 100-KU membership against unattached original source SHA256 `5e82268a4a7727571a15d712310b227cf376b61ed39d7bbf21d51bc624f0f066`. Establish explicit US/UK display policy **before** revising the 66 CONDITIONAL rows. For `coordinate` verb, check POS-specific candidate and source line 24821; for `tired` KU-00135 / KU-01973, do not present a narrow bracket citation as verified broad phonemic IPA.
- MISSING75: preserve native IPA null; optional word-component/TTS fallback must be explicitly separate, never labelled Kaikki-native phrase IPA.
- CG-MASTER must provide stable record_id, **original full scene sentence**, exact Kaikki entry/part of speech/native sense index/complete gloss/source line & raw SHA for V57 `accelerate` (audit row 104671) and V13 125 HOLD queue. Then request separate CG-QA and Muse adjudications.
- No formal dual-AI certification, no release, no SRS enablement or live Master write.
- CI evidence for **this** new isolated triage/checkpoint commit has not yet been verified: do not claim SUCCESS until actual exact-SHA workflow checked.

## Next execution (incremental only)
1. Verify actual remote branch HEAD, this checkpoint and only recent Issue #1/#2 comments since above cursor; use current committed SHAs as source pins.
2. Check any Actions for the exact commit. If no workflow was triggered, record `NOT_RUN`, not PASS.
3. Resolve the eight NATIVE27 blockers with CG-QA evidence first, then NATIVEWORD100 regional policy and any verified V57 original clause. Commit only review artifacts and refresh this checkpoint following every material delivery.
