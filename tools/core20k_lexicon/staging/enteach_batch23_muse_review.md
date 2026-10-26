# ENTEACH Batch23（23 条完整教学）Muse 独立复审

- 复审人：MU-ENTEACH（英文词库教学线-配合），独立判断
- 诚实声明：**本复审非盲审。** 复审前已通过 Issue 知悉 CG-QA 对 NEXT15 的 3 项 CONDITIONAL（scanner/visa/logo）；逐条判断基于 V2 文本与语言学分析，ChatGPT 全文复审在逐条判断后读取、仅用于分歧对账，不复制其结论。
- 复审对象：合成固定版 V2（commit `88d0452`，`enteach-batch23-composed-staging.v2.json`，schema pai-word-enteach-batch23-composed-full-content-staging-v2，状态 CHATGPT_REVISED_V2_MUSE_EXACT_VERSION_REVIEW_PENDING，production_ready false，activation_allowed false，source_rights_cleared false，official_membership_verified false）
- 对照：合成 V1（`f126485`）、定向增量文件（`enteach-batch23-targeted-deltas.v1.json`，3 KU 4 字段）、ChatGPT 全文复审（`25231be`，原始候选版：23 条中 20 PASS + 3 小修订）、七条台账背景（S113 已闭合，不在本复审范围）
- 范围：23 条完整教学字段（15 条 NEXT15 + 8 条 NEXT8）；16:44–16:57 新增的 next15/next10 草稿文件无 HANDOFF 派发，**不在本复审范围**

## 1. 身份核查（正式 Runtime，SHA e91e2ab3…，本次重算）：23/23

全部 ku_id 在正式 Runtime 原样存在，core_rank/词头/类别（sense）/可玩（true）全部一致。注意：23 条 Runtime 英文释义全部为占位模板（"core modern learner use of …"），故教学英文释义即实质定义；V2 文件自述亦明确“23 条 ENLEX 基底释义 verdict 与本完整教学记录无关”，基底 PASS 不等于教学 PASS，本复审只判教学记录。

## 2. V1→V2 与定向增量核对（本复审独立执行）

- 合成 V1→V2：仅 3 条 4 字段变化——scanner 搭配、visa 例句英汉、logo 例句汉；其余 20 条零改动。
- 定向增量文件（原始候选→合成版）：3 KU 4 字段——additionally 搭配、gateway 例句英汉、mayor 搭配；均已落实在合成 V2 文本中。
- 合计 8 处定向改动，与 V2 checks.targeted_changed_fields=8 一致。

## 3. 逐条结论：23/23 PASS

| 词头 | 结论要点 |
|---|---|
| scanner | PASS。释义准确；V2 搭配 document scanner · flatbed scanner · barcode scanner 均为名词性搭配，CG-QA 的名词搭配 CONDITIONAL 已解决；例句与翻译准确；scanner（设备）vs scan（动词）辨析正确。 |
| amid | PASS。释义、搭配（amid growing concerns 等）、例句与翻译、介词+名词短语语法注、amid vs among 辨析全正确。 |
| liter | PASS。1000 毫升数值准确；one liter/复数 liters、英式 litre 注记正确；容量 vs 质量辨析正确。 |
| gym | PASS。场所义准确；go to the gym、gym membership、school gym 自然；gym vs stadium 辨析正确。 |
| noun | PASS。标准名词定义；countable/proper/plural 搭配标准；hotel 词类例句准确；同形异词性辨析正确。 |
| compatibility | PASS。兼容/共存义准确；compatibility with 搭配与软件例句正确；compatibility vs similarity 辨析正确。 |
| prototype | PASS。早期验证模型义准确；build/working/test 搭配标准；原型机例句准确；非正式成品辨析正确。 |
| additionally | PASS。释义准确；V2 搭配已改为完整句首连接模式（additionally, we need … 等），ChatGPT 的“省略号不算搭配”小修订已落实；例句与翻译、逗号语法注、additionally vs however 辨析正确。 |
| quiz | PASS。简短测验义准确；take a quiz、vocabulary quiz 自然；例句准确；quiz vs exam 规模/正式度辨析正确（有非绝对化措辞）。 |
| garbage | PASS。废弃物义准确；take out the garbage、garbage bin 自然；不可数注记（有“一般” hedged）正确；garbage（美）vs rubbish（英）正确。 |
| compute | PASS。数值计算义准确；compute the total/average 搭配标准；例句与翻译准确；compute vs estimate 辨析正确。 |
| visa | PASS。签证义准确；V2 例句 "I need to apply for a visa before my trip." / 我需要在出行前申请签证 已由 "You must" 改为个人需求表述，CG-QA 的绝对化 CONDITIONAL 已解决；visa vs passport 辨析正确。 |
| logo | PASS。标识义准确；V2 例句汉“每个包装上都有这家公司的徽标”自然忠实，CG-QA 的过具体/不自然 CONDITIONAL 已解决；logo vs slogan 辨析正确。 |
| kilometer | PASS。1000 米数值准确；five kilometers、km/h、one kilometer away 标准；美式 kilometer/英式 kilometre 注记正确；kilometer vs mile 辨析正确。 |
| adjustable | PASS。可调节义准确；adjustable seat/height、fully adjustable 自然；例句准确；adjustable vs adaptable 辨析正确。 |
| unification | PASS。合为一体义准确；political/national unification、the unification of two systems 标准；部门合并例句准确；unification vs cooperation 辨析正确；编辑注（不声称制度同一）合理。 |
| gateway | PASS。入口/网关义准确；V2 例句 "The payment gateway handles online payments." / 支付网关处理在线支付 已删去无来源的安全断言，ChatGPT 的语用小修订已落实；gateway to 搭配与 gateway vs doorway 辨析正确。 |
| snapshot | PASS。瞬间记录义准确；take a snapshot、a snapshot of … 自然；例句与翻译准确；snapshot vs forecast 辨析正确。附注：初读时对比注曾现疑似乱码显示，经原始字节核查文件无 U+FFFD 替换符，文本为“或概况”，干净无损，属显示假警。 |
| tier | PASS。分层档次义准确；top/lower tier、three-tier system 标准；定价档位例句准确；three-tier 复合形容词注记与 tier vs level 辨析（有 hedged）正确。 |
| intercept | PASS。途中截获义准确；intercept a message/pass/signal 标准；传球例句准确；intercept vs interrupt 辨析正确。 |
| mayor | PASS。市政负责人义准确；V2 搭配 "mayor of the city" 已替代偏冗余的 "the city mayor"，ChatGPT 的搭配小修订已落实；例句准确；mayor vs governor 辨析（有辖区 hedged）正确。 |
| painful | PASS。身体/精神痛苦义准确；painful experience/injury/memory 自然；例句与翻译准确；painful vs sore（范围较窄）辨析正确。 |
| officially | PASS。正式/官方方式义准确；officially announce/recognized/open 自然；例句准确；officially vs publicly（公开≠官方认可）辨析正确。 |

## 4. 与 ChatGPT 的分歧对账：V2 有效版本实质分歧 0

- ChatGPT 原始候选版：20 PASS + 3 小修订（additionally 搭配、gateway 安全断言、mayor 搭配）。
- 3 项小修订均已在合成 V2 落实（定向增量文件 + 本复审机械差异双重验证），且本复审对修复后文本独立判 PASS。
- CG-QA 的 NEXT15 3 项 CONDITIONAL（scanner 名词搭配、visa 绝对化、logo 过具体）均已在合成 V2 解决（见上表）。
- 本复审 V2：23/23 PASS；文件自记 ChatGPT 侧为 PASS_AFTER_TARGETED_EDITORIAL_CHANGES（23/23）。故合成 V2 有效版本双AI内容通过 23/23，版本来源如实记：ChatGPT 全文 verdict 针对原始候选、3 项修订经 V2 落实；最终记账由 CG-QA 按版本规则确认。

## 5. 不裁决

- 成员资格、正式启用、production_ready、activation、转载许可（V2 自记 source_rights_cleared false；各记录自述新写、无外部例句复制，权利仍未 clearing）一律不变。
- 基底释义 verdict（ENLEX 线）与本教学记录 verdict 互不代替。
- S113 七条已闭合，不在本复审范围；16:44–16:57 的新草稿文件无 HANDOFF，不审。
- 本复审不改 CG-ENTEACH 资产（V2 文件的 muse 字段仍为 NOT_REVIEWED_ON_COMPOSED_VERSION，由 CG-ENTEACH 更新）。
