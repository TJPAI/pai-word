# Scene1341 first-phase acceptance contract — SC50-0001…SC50-0005

**Decision:** finish and independently review the five-scene teaching experience before rolling the same method out to 1,341 scenes. The existing 14-scene preview remains a test fixture; this decision does not delete scenes or disable existing test cards.

**Ownership:** CG-MASTER supplies real complete two-sided teaching data, exact Sense–Scene identity, native Kaikki/CMUdict IPA and immutable releases. CG-QA / MU-QA independently assess source and semantic quality. CG-MAIN consumes the versioned Master, renders original Scene500-parity UI, proves dynamic refresh, fallback and read-only behavior. No CG-MAIN-created canonical examples, IPA or Sense IDs. User alone triggers preview deployment.

## Verified baseline (CG-MASTER V193 source-executed report)

Source: `tools/scene1341_master/qa_reports/CGMASTER_V193_V190_SCENE_COVERAGE_AND_SELECTED_IPA_RISK_20261115.json` on CG-MASTER branch, source Master SHA256 `62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986`, 3/3 V190 source gzip shards identity-verified. **All counts TEST_ONLY and NOT QUALITY CERTIFIED.**

| Scene | Source associations | Nonempty selected test IPA | Nonempty bilingual examples | Nonempty POS + gloss |
| --- | ---: | ---: | ---: | ---: |
| SC50-0001 | 294 | 103 | 223 | 33 |
| SC50-0002 | 206 | 70 | 157 | 25 |
| SC50-0003 | 237 | 86 | 172 | 25 |
| SC50-0004 | 245 | 94 | 184 | 24 |
| SC50-0005 | 259 | 96 | 104 | 29 |
| TOTAL | 1241 | 449 | 840 | 136 |

The `SC50-0003` original source row 506 (`take off`) currently contains the **known wrong** selected IPA `/ˌpʊt ˈɒn/`. CG-MAIN must continue suppressing it by exact record_id, source row, scene and expression even if older manifests are loaded. Thus even the 449 nonempty source candidates do not establish 449 safe selected pronunciations.

## Required completion gate for each of the five scenes

1. Exactly account for every original association by immutable record ID + original source row + scene ID, with no duplicates or undisclosed row loss; distinguish accepted, test-only and HOLD identities.
2. Question page: English expression, authoritative Chinese recall cue, pronunciation (native reliable IPA or clearly noted phonetic HOLD); short phrases must NOT receive guessed blended IPA; mark the status rather than concealing unresolved issues.
3. Answer page: matching Sense-specific Chinese meaning, English gloss + POS where supported, appropriate trustworthy bilingual example pairs, natural collocations and usage note. Confusion/semantic notes and synonyms/antonyms only when meaningfully sourced; no forced filler.
4. Every field must carry provenance and per-field status. Coverage is **not** independent QA approval. Missing IPA must be individually accounted for as pending/unsupported, not fabricated.
5. Exact identity-match source author enrichment without clobbering existing vetted content. Full source 1..3000 still TEST_ONLY; the second-batch V196 Drive ZIP is NOT yet a canonical GitHub full-page feed.
6. CG-QA independent P0/P1 review; no formal Ready/SRS without distinct approval. Baseline Scene500 and Core20K untouched.
7. On the deployed static preview, refreshing checks latest CG-MASTER HEAD, pins a complete immutable manifest and rows, verifies cryptographic bytes and original identities, and updates question+answer content without a new frontend build. On network, content or QA failure, fall back safely to previous verified playable test cards. iPhone Safari speech/handwriting/scene switching/answer persistence must retain Scene500 parity.
8. Phase-1 green status requires a machine-readable per-scene report with exact denominators, individual missing fields, resolved/held P0/P1, direct source commits and SHA hashes, plus successful integration and independent QA evidence. A clean CI alone is not teaching-completeness approval.

**Rollout rule:** only after the five-scene content and UX pass this gate, repeat the same Master schema, quality review and dynamic integration pipeline for the remaining 1,336 scenes. Existing work on other scenes may continue safely but must not be misrepresented as Phase-1 completion.
