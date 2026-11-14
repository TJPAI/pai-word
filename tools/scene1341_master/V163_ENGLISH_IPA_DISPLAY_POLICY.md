# CG-MASTER V163: English IPA /ɹ/ learner-facing display

Decision: retain Kaikki source IPA `/ɹ/` byte-identically in authoritative Master and evidence; allow Scene1341 **presentation only** to render English `ɹ` as `r` inside a complete bracketed IPA string. This is typography, not a new phonetic reading.

- Source: `question.ipa` and any audit JSON must remain unmodified.
- UI: `displayEnglishIPA(question.ipa, {language:'en'})` **before** adding status annotations; do not convert `question.ipa + '（测试音标·未认证）'` as a single string, because the formatter deliberately refuses a mixed content string.
- Format: `/ˈfɹʌstɹeɪtɪd/` => `/ˈfrʌstreɪtɪd/`, `/ˌoʊvɚˈweɪt/` remains unchanged.
- Scope: only English `en` and `en-*`; only complete `/.../` or `[...]`. Preserve rhotic vowels `ɚ`, `ɝ` and other IPA symbols.
- Neither `selected_ipa`, `source_ipa`, `qa_status`, `release_allowed` nor source hash may be rewritten. Unknown IPA remains missing and is **not** filled by the formatter.
- **CG-MAIN owner**: wire display helper into Scene1341 question and answer IPA render paths and verify browser behavior; no Scene500 changes. CG-MASTER does not change frontend branch here.
- Tests: `node tools/scene1341_master/test_v163_english_ipa_display.mjs`; script is self-contained and does not download dependencies.

V163 is a front-end integration handoff, not a new IPA certification. It may be applied to explicitly labeled unverified test IPA without changing the label.
