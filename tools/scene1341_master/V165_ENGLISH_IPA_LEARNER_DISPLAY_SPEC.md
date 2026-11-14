# V165: user-approved Scene1341 learner IPA display profile

2026-11-14 user approved V164 Level 1 safe visual conventions. This extends V163 **display layer only**. Preserve authority: Kaikki IPA bytes, Master canonical IPA, source hash, Sense–Scene relationships, review status and release gates must be immutable.

| Raw source IPA | Learner-facing display | Policy |
|--|--|--|
| `ɹ` | `r` | V163, already approved |
| `ɡ` (IPA script g U+0261) | `g` (Latin g U+0067) | approved glyph |
| `t͡ʃ` | `tʃ` | omit only this specific IPA tie bar U+0361 |
| `d͡ʒ` | `dʒ` | omit only this specific IPA tie bar U+0361 |

Guardrails: only complete English IPA `/.../` or `[...]`; only language `en`, `en-*`; do not process bilingual text or `/ipa/（测试·未认证）` combined value. Do the conversion **before** appending test labels. The formatter does not create IPA and never sets Ready.

No automatic conversion of `ɚ`, `ɝ`, `ˈ`, `ˌ`, `ː`, `.`, `̩`, `̯`, `ɾ`, `ʔ`, `ɫ`, `ʰ`, `ɒ`, `ʉ`, parentheses, hyphens, optional variants, other affricate tie bars (e.g. `p͡f`), or syllable/POS distinctions.

CG-MAIN integration owner: import `displayEnglishIPA` from `tools/scene1341_master/v165_english_ipa_learner_display.mjs` (or copy identical, source-pinned helper into Pages directory); apply it to each Scene1341 IPA presentation sink on question and answer pages, **not** to Master or persisted card objects. Render QA status after formatting. Test in preview and give user a manual deploy link. No Scene500 modification.

Test: `node tools/scene1341_master/test_v165_english_ipa_learner_display.mjs` should pass. No external API or dependencies. V164 symbol report covers 996 preview rows only, not all 1341 scenes.
