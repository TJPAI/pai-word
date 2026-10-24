# B215 / B216 结论更新：事实差异核对与三层区分

- 更新人：Muse Spark 1.3（独立 QA；与 B216 triage 作者、第一方 ChatGPT 审核人不同）
- 更新对象：B216 triage（commit `5793139`，文件 `tools/core20k_lexicon/staging/B216_INDEPENDENT_TRIAGE_AND_IDENTITY_GATE.md`）中关于身份的结论
- 不改动的文件：triage 原文、Batch93 冻结原包、正式 Runtime、crosswalk、预览文件。本更新是独立文档，只陈述差异与更新后的结论。
- 锚点：Batch93 包 SHA `21d83151…`（blob `2d7e1750…`）；正式 Runtime gz SHA `e91e2ab3…`（分支 `core20k-lexicon-production-v1` HEAD `c7aae5a6`）；batch91 文件 `batch91_six_source_alignment_verified.jsonl`（source_master_sha `4f709dfe…`，frozen_membership_sha `e3f84694…`）。

## triage 与 B215 之间是否存在事实冲突？

**不存在事实冲突，只存在时间差与描述对象的不同。** triage 写于 B215 独立 QA 完成之前，其身份结论（“权威 Runtime 映射尚未验证”）在当时是准确的；B215 随后以真实 Runtime 复算补上了这一环。两者陈述的对象也不同：

| 陈述 | 说的是什么 | 现状 |
|---|---|---|
| triage：“crosswalk 内 0 已验证” | crosswalk 文件的 `reviewed_crosswalk` 数组 | 仍为空（`[]`），状态仍 `BLOCKED_PENDING_ROW_LEVEL_VALIDATION`。属实，未变 |
| B215：“Runtime 中 ku_id 精确命中 6/6” | 正式 Runtime 本身（20,000 词头、16,617 KU） | 6/6 逐字命中（person/time/know/people/talk/here，含词头、rank、ku_type sense、playable）。属实 |
| triage：“正式教学包 0 条” | 已批准的正式教学包工件 | 集成-branch 上无正式教学包；STAGING_ONLY 预览 JSON 不是正式包。属实 |

把“账本为空”读成“Runtime 中不存在”是错；把“Runtime 中存在”读成“账本已完成”也是错。缺口是**记录缺口**，不是存在性缺口。

## 更新后的三层结论（取代 triage 身份段的“未验证”表述）

1. **KU ID 精确匹配：6/6 PASS。** B215 以锚定 Runtime 复算：ku_id、词头、rank、ku_type、playable 全部逐字命中；batch91 亦以 source_master（SHA `4f709dfe…`）验证同一 6 条身份（`identity_verified_against_source_master: true`，`source_sense_id_verified: true`）。已解决的问题不再列为未解决。
2. **Sense 归属：通过 KU 及释义间接支持，但正式 Sense 注册表仍缺失。** 支持链：源 master 义项（batch91）→ 包释义（改写）→ Runtime KU 释义（逐字对应，time/people 两处包内措辞差异见勘误清单）→ 剑桥义项节（B215/B216 独立重验）。这条链是证据链，不是注册表：没有任何一个工件以权威签名的方式声明“sense_id X 属于 Runtime ku_id Y”。间接证据不得夸大为注册表认证。
3. **正式认证：仍为 0。** PRODUCTION_READY 仍 0/6。语义认证（B216：6/6 PASS）+ KU 匹配（6/6）+ 剑桥外部验证（6/6）都已完成，但发布门禁（见正式认证包）仍有未闭合项。B216 的 STAGING_ONLY 决定维持不变。

## batch91 两个 pending 标志的闭合情况

batch91 当时留了两个 pending，本轮工作闭合了它们（针对这 6 条）：

- `original_sense_external_verification: "pending"` → **已闭合**：B215/B216 亲自查剑桥定义页与发音页，6 条义项节与美音全部重验通过。
- `original_ipa_requires_independent_replacement: true` → **已闭合**：包内剑桥美音 IPA 即为独立替换值（6/6 与剑桥美音逐字一致）；Runtime 旧 IPA（如 talk 的英式元音）仍待正式分支 owner 处理，见勘误清单。

batch91 自身的 `L2_CONTENT_CERTIFIED: false` / `PRODUCTION_READY: false` 不受影响：那是 batch91 时点的状态，不是当前状态；当前状态以本更新与正式认证包为准。

## 本更新不改变的结论

- STAGING_ONLY 预览资格 6/6（B215 的 6 条件不变）。
- 正式认证 KU 数仍为 0；任何 PRODUCTION_READY 标记都需全部发布门禁的真实证据。
- B216 triage 的其他判断（6 条句子层面 acceptable、许可未核、门禁优先级）除身份段按上文更新外，维持原样；其中“许可未核”一项已由正式认证包的许可处置清单补上（隔离 LOW，正式许可仍需发版方决策）。
