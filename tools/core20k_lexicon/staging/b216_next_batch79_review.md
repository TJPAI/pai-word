# 下一批审核：batch79 七条语法 KU 独立审核（第二方）

- 审核人：Muse Spark 1.3（独立语言学 QA；与 batch79 原作者不同）
- 对象：`tools/core20k_lexicon/runtime/v1/batch79_seven_grammar_complete_staging.jsonl`（7 条，staging 最完整版；batch75 为同批的门禁版）
- 锚点：正式 Runtime gz SHA `e91e2ab3…`；batch79 自述 `identity_status: LEGACY_ID_PRESERVED_FROZEN_RANK_FROM_CANONICAL_QUEUE`，`missing_approvals: [sense_alignment, bilingual, us_ipa_pos_context, answer_quality, independent_editorial, runtime_e2e]`，`release_eligible: false`，`production_ready: false`——本审核逐项核对这些自述，不照单全收。
- 剑桥语法页重验（5 页，本审核亲自查得）：a-an-the、infinitives、present-perfect-simple、dummy-subjects、pronouns one/you/we/they。
- 配套机器可读文件：`b216_next_batch79_review.json`。

## 结论先说

- **内容正确：7/7。** 7 条语法规则全部正确，剑桥语法页全部佐证；英文例句与中文解释全部准确自然。
- **身份精确命中：7/7。** 7 条 ku_id 在正式 Runtime 中逐字命中（the 78、to 48、have 801、it 59、you 40、they 77）。
- **可按现有身份认证：5/7。** 2 条内容正确但教学目标与 Runtime KU 释义不匹配，需注册权威裁决，**不得按现有身份认证**（见第 3 节）。
- **正式通过：0/7。** 与 batch93 相同的 G1–G7 门禁全部未闭合；本审核不授予任何一条正式通过。

## 逐条结果

| 词头 / KU | 身份命中 | 内容 | 认证结论 |
|---|---|---|---|
| the w_0001_the_ku01（78） | ✓ definite article | 定冠词用于已提及名词；剑桥 a-an-the：“The before a noun shows that what is referred to is already known” | **PASS（内容+身份）** |
| to w_0005_to_ku02（48） | ✓ infinitive marker | want 后接 to-不定式；剑桥 infinitives 页将 want 列入 to-不定式动词 | **PASS（内容+身份）** |
| have w_0008_have_ku02（801） | ✓ perfect auxiliary | 现在完成时 they + have；剑桥 present perfect：have/has + 过去分词，already 表强调 | **PASS（内容+身份）** |
| it w_0009_it_ku01（59） | ✓ 但释义不匹配（见下） | 形式主语 it + 形容词 + to-不定式；剑桥 dummy-subjects：“It as a dummy subject with adjectives and their complements: It's important to…” | **内容 PASS / 身份 CONDITIONAL** |
| it w_0009_it_ku02（59） | ✓ dummy subject/object | 辨识形式主语 it（非宾语代词）；与 Runtime ku02 释义逐字对应 | **PASS（内容+身份）** |
| you w_0010_you_ku02（40） | ✓ generic person | 泛指 you（一般人）；剑桥 pronouns 页：“one, you, we and they to refer to people in general” | **PASS（内容+身份）** |
| they w_0013_they_ku02（77） | ✓ 但释义不匹配（见下） | 泛指 they（不具体的人/机构）；剑桥 pronouns 页：“they to talk about a wide group of people, such as an authority… does not refer to specific people” | **内容 PASS / 身份 CONDITIONAL** |

## 2 条身份不匹配（本审核最重要的发现）

**it ku01——目标撞了 ku02 的释义。** batch79 ku01 的教学目标是形式主语 it（`___ is important to check the results`，答案 It），但其 Runtime KU（ku01）的释义是“thing/situation pronoun”（指代 it）；形式主语对应的 Runtime KU 是 ku02（“dummy subject/object”）——而 ku02 已被 batch79 的第二条 it 记录（辨识题）占用。两条 it 记录还共享 sense_id `w_0009_it_s01`。可能解释有二：(a) ku01 错挂（应另立 KU 或与 ku02 合并教学角度）；(b) 语法 KU 的 ku_id↔目标映射是历史沿用（legacy frozen），不按释义严格对应。无论哪种，都需要注册权威裁决：本审核不替权威选边，只记录“按现有身份不可认证”。

**they ku02——Runtime 中无对应释义。** batch79 ku02 的教学目标是泛指 they（`They say it will rain tomorrow`），但其 Runtime KU（ku02）的释义是“singular they”（性别未知/非二元单数代词）；Runtime 现有的 they KU 只有 ku01（third-person plural）与 ku02（singular they），**泛指 they 无对应 KU**。内容本身正确（剑桥佐证），但按现有身份无处可挂：需权威新建 KU、或修订某 KU 释义、或判定泛指 they 归属 ku01 的复数读法——同样不替权威选边。

## 结构缺口（全批，非内容缺陷）

- 记录缺 rank、headword_id、pos、us_ipa、gloss。全部可从 Runtime 按词头机械补齐（词头在 Runtime 中唯一：the 78/det./ðə、to 48/prep./inf./tˈu、have 801/v./aux./hˈæv、it 59/pron./ˈɪt、you 40/pron./jˈu、they 77/pron./ðˈeɪ），但补齐必须标注为 **Runtime 派生**，不得冒充源提供；补齐后的记录方可跑 batch76 门禁的 frozen_identity 测试（现原始记录因无 rank/headword_id 无法通过该测试，与内容质量无关）。
- 评估格式混杂：填空（the/to/have/it-ku01）+ 辨识题（it-ku02/you/they）。判分契约已覆盖两类（填空大小写容忍、辨识题 verdict+理由双语关键词）。
- 来源：剑桥语法页引用标注为“grammar rule only”（规则引用，非内容复用），措辞诚实；中文解释与英文例句均为原创；许可处置与 batch93 同口径（隔离 LOW，正式许可仍需发版方决策）。

## 与 batch79 自述 missing_approvals 的对照

- `sense_alignment`：5/7 已由本审核补上；it-ku01、they-ku02 两项仍 OPEN（身份不匹配，见上）。
- `bilingual`：7/7 已由本审核补上（中文解释与翻译全部核对）。
- `us_ipa_pos_context`：记录本身无 IPA/pos 字段；Runtime 派生值已列出（上节），但“pos 特定 IPA 独立验证”作为正式门禁仍需权威确认派生方式。
- `answer_quality`：7/7 已由本审核补上（填空答案唯一、辨识题 verdict+理由结构完整）。
- `independent_editorial`：仍 OPEN（AI 第二方审核不是人工编辑签字）。
- `runtime_e2e`：仍 OPEN（未在正式学习流内验证）。

## 下一步（按序）

1. 注册权威裁决 it-ku01 与 they-ku02 的挂接（二选一：重挂/新建/修订释义/判定归属），裁决前两条不得进入任何正式包。
2. 对 5 条 PASS 项做 Runtime 派生字段补齐（标注派生），生成 batch79 候选包（STAGING）+ manifest。
3. 5 条 PASS 项与 batch93 六条走同一 G1–G7 门禁；门禁闭合前不生成正式 Overlay 包。
