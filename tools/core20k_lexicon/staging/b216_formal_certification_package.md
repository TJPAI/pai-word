# B216 正式认证包：Batch93 六条正式发布路径（整合报告）

- 认证人：Muse Spark 1.3（独立语言学 QA + Runtime 身份审计 + 发布门禁审核；与第一方 ChatGPT 审核人、triage 作者不同）
- 对象：Batch93 包（SHA `21d83151…`，blob `2d7e1750…`，6 条 person/time/know/people/talk/here）+ 勘误候选包（见第 4 节）+ 下一批 batch79（见第 7 节）
- 已完成、不重复：B215 独立 QA（24d15dc / ab6d4fb / ffe7b9d / 96c19cf）、B216 第二方语义认证（64e26ad / 8b51375）、B214 工程事务验收（85bffc1）。本包只做这些工作未覆盖的部分，并把三份工作的结论收敛到一条正式发布路径上。
- **正式认证 KU 数：0。** 本包不生成正式 Overlay 包——发布条件未全部满足（第 6 节），生成即是违规。勘误候选包是 STAGING 候选，不是正式包。

## 1. B215 / B216 事实差异与结论更新（摘要；全文见 b215_b216_conclusion_update.md）

triage 与 B215 无事实冲突，只有时间差：triage 写于 B215 之前，其“权威 Runtime 映射尚未验证”在当时准确；B215 随后以真实 Runtime 复算补上。更新后的三层结论：

- **KU ID 精确匹配：6/6 PASS**（B215 复算 + batch91 源 master 验证）。
- **Sense 归属：KU 及释义间接支持，正式 Sense 注册表仍缺失**（证据链存在，权威签名不存在；间接证据不得夸大为注册表认证）。
- **正式认证：仍为 0。**

batch91 的两个 pending 标志针对这 6 条已闭合：外部义项验证（剑桥重验）与独立 IPA 替换（包内剑桥美音）。batch91 自身的 `L2_CONTENT_CERTIFIED: false` / `PRODUCTION_READY: false` 是时点状态，不代表当前状态。

## 2. Sense 身份权威调查与最小变更注册方案

### 调查结果：不存在现成的权威 Sense 注册表

- 正式 Runtime（`core20k-lexicon-production-v1`，gz SHA `e91e2ab3…`）无 headword_id/sense_id 字段（sense_id 全文 0 次）；20,000 词头、16,617 KU 以 (rank, 词头, ku_id, ku_type, 释义) 五元组存在。
- QA 分支上的 sense_id 引用绝大多数是历史审计文档（BATCH17–50、OEWN 对齐工作）与 staging 文件，不是注册表。
- `core20k-v11-isolated/registered_pack.json` 是另一系统（v11 隔离包，3 条记录，`activation_allowed: false`，`runtime_accepted: false`），不是 Core20K Sense 注册表。
- `ENGLISH_CORE20K_INTEGRATION_CONTRACT.md` 未定义任何注册权威（全文无 authority/registration/certification/approval 条款）。**注册权威目前是缺位的，不是某个人或某个流程——这是正式发布的第一缺口，必须由用户（产品负责人）指定。**
- 现有的最接近注册的工件是 crosswalk（`tools/core20k_lexicon/runtime/v1/identity-crosswalk.json`，schema `pai-core20k-crosswalk-v1`）：状态 `BLOCKED_PENDING_ROW_LEVEL_VALIDATION`，legacy 16,816 条唯一，`reviewed_crosswalk: []`。它有 schema、有状态机、有 legacy 清单，缺的只是已审核的行与签名。

### Sense 归属证据链（这 6 条，全部可复算）

源 master（Core13K V26.7O，SHA `4f709dfe…`）→ batch91 验证（`identity_verified_against_source_master`、`source_sense_id_verified` 均为 true，6/6；源释义与当前 Runtime 释义逐字一致）→ 包释义（英文 6 条全部改写、中文 time 扩写/people 换序，见第 4 节）→ Runtime KU（B215 精确命中 6/6）→ 剑桥义项节（B215/B216 独立重验 6/6）。链上每一环都有文件与 SHA，缺的是把链“钉死”的一步。

### 最小变更注册方案（不伪造 ID、不改 Runtime、不改冻结包）

1. **不铸造任何新 ID。** sense_id 与 ku_id 全部沿用已有值（batch91 + Runtime）；注册只“记录绑定”，不“创造身份”。
2. **复用 crosswalk，不新建注册表。** 在 `reviewed_crosswalk` 中追加已审核行，每行：`{legacy_ku_id, runtime_ku_id, sense_id, headword, rank, evidence: {batch91_source_master_sha, runtime_gz_sha, cambridge_verified: true, semantic_certification_commit}, reviewer, reviewed_at, signature}`。schema 升级为 `pai-core20k-crosswalk-v1.1`（仅加签名字段，旧字段不动）。
3. **签名 = 注册。** 追加行由注册权威（用户指定的人或流程）签名后，crosswalk 状态方可从 BLOCKED 改为 REVIEWED_PARTIAL；未签名行不产生任何效力。本认证提供的只是**提案**（见 `b216_sense_registration_proposal.json`，标注 PROPOSAL_NOT_SIGNED），提案本身不是签名。
4. **一次只注册已通过全部其他门禁的 KU。** 注册行与门禁状态绑定：门禁未闭合的 KU 即使写了提案行也不得标记为已注册。
5. **Runtime 本体不动。** 正式 Runtime 的 sense 注册以 crosswalk + overlay manifest 的形式存在，不要求改写冻结 Runtime 文件（改写冻结 Runtime 是另一量级的决策，不在本方案内）。

## 3. 来源许可处置清单（逐条；正式展示决策仍需发版方）

| 项目 | 6 条情况 | 处置 |
|---|---|---|
| 英文例句 | 全部原创极简句（剑桥页上均未出现） | 原创，无复用问题 |
| 英文释义 | 全部 2–4 词改写，无一与剑桥定义措辞相同 | 改写，无逐字复用 |
| 中文释义 | 包内中文释义；time（时间；时长）相对源 master（时间）扩写、people（人们；人）相对源 master（人；人们）换序——两处为包内措辞调整，语义无变，见勘误清单 | 接受为措辞调整，记录在案 |
| 美音 IPA | 6/6 与剑桥美音逐字一致；IPA 转写属发音事实数据 | 事实数据，低风险 |
| 剑桥核验来源 | 每条定义页 + 发音页均由 B215/B216 亲自查得（person/time/know/talk/here 定义页，people /us/ 页 plural noun (PERSONS) 节；发音页 6 词全取） | 核验来源，不是内容来源；展示措辞用“已对照剑桥核对”，不出现剑桥品牌与背书暗示 |
| 隔离展示 | STAGING_ONLY 预览 | 风险 LOW |
| 正式展示 | 需发版方许可/合规决策 | **未决策，仍 OPEN**——本认证不授予许可 |

## 4. 教学内容勘误清单与勘误候选包

冻结 Batch93 原包**未改写**（SHA `21d83151…` 仍是唯一冻结版）。勘误全部落在新候选包 `batch93_errata_candidate_v1.json`（pack_version `2026.10.25-batch93-errata-candidate-v1`，SHA `f1c927db…`，13,903 B，manifest 见同名 manifest 文件）：

| # | 勘误 | 处理 | 状态 |
|---|---|---|---|
| E1 | time 难度 A1 为词级；剑桥时长/可用义标 A2/B1 | 候选包 time.difficulty A1 → A2（其余 5 条不动） | 已入候选包 |
| E2 | time 证书链接（`/us/pronunciation/english/time`）与归属链接（`/dictionary/english/time`）不一致 | 候选包证书 URL 对齐为归属 URL；发音页 URL 仍保留在本清单与 B215 证据中（信息无丢失） | 已入候选包 |
| E3 | here 证书链接（`/us/pronunciation/english/here`）与归属链接（`/us/dictionary/english/here`）不一致 | 候选包证书 URL 对齐为归属 URL | 已入候选包 |
| E4 | talk：包值 `/tɑːk/` 为正确剑桥美音；Runtime `/tˈɔk/` 为英式元音 | **包不动**（包值正确）；Runtime 差异记给正式分支 owner，是否修正冻结 Runtime 由其决策 | 观察项，不入候选包 |
| E5 | time 中文释义扩写（时间 → 时间；时长）、people 词序换序（人；人们 → 人们；人）相对源 master | 语义无变，接受为措辞调整；记录在案，不改候选包 | 已记录 |

候选包与原包逐行 diff 只有 4 行（pack_version + E1 + E2 + E3），其余逐字段全等；6 条 flags 仍全为 `content_certified: false / production_ready: false`。**候选包不是正式包**：勘误不等于认证，门禁未闭合前它与原包一样不得进入正式学习流。

## 5. 判分契约（全文与参考实现见 b216_scoring_contract.md）

**先说清一个关键事实：当前没有任何已实现的中文简答判分器。** 预览页无答题输入（只有身份核验按钮）；正式学习流是自评式（揭晓后自报 again/good 等，`learning-runtime.js` 的 tap flow），不是打字判分；包的 `assessment_type`（句中释义简答）与 `remaining_gate` 中的 `ASSESSMENT_ACCEPTABLE_ALTERNATES` 至今没有运行时实现。因此：

- **当前自评流不需要判分器**：time 的扩写答案只作为“显示的正确答案 + 解释”出现，不参与机器判分；扩写不构成误判风险。
- **一旦主开发实现打字简答评估，必须按契约实现，不得用严格字符串匹配**：可接受答案集 = 释义分词 + correct_answer + 其分词（每 KU 随包携带，判分器不得硬编码）；归一化（去空格、去中英标点）；句翻译（如 time 的“需要更多时间”）不得接受为词义答案；错义答案（time 的“时刻”、here 的“此时”、know 的“认识”、people 的“民族”）必须拒绝；辨识题（batch79 的 you/they）必须同时判 verdict + 理由关键词，且理由关键词集必须双语（参考实现开发中曾因单语关键词集误拒记录自身正确答案，测试已修正并记录）。
- **测试证据**：参考实现 `b216_scoring_reference.test.mjs`，Node 原生测试，**22/22 PASS，0 FAIL**（Batch93 释义答案接受/拒绝、Batch79 填空大小写容忍/错词拒绝、辨识题 verdict+理由）。

## 6. 正式集成门禁清单（责任方与状态）

| 门禁 | 责任方 | 状态 | 证据 |
|---|---|---|---|
| G1 权威行级映射补记（crosswalk 已审核行 + 签名） | 注册权威（待用户指定） | OPEN | 提案已备（b216_sense_registration_proposal.json），未签名 |
| G2 接受替代表述的判分实现 | 主开发（仅当实现打字简答时；自评流不适用） | OPEN（契约 + 参考测试已交付） | b216_scoring_contract.md，22/22 测试 |
| G3 签名版 overlay 清单（精确 Runtime SHA、记录数、覆盖、来源归属、不可变 KU 身份、发布决定）+ fail-closed 测试 | 注册权威 + 主开发 | OPEN | 候选包 manifest 已备模板字段，签名与 fail-closed 测试未做 |
| G4 隔离回归测试（开关关闭无变化、预览不可达 SRS 写路径、渲染后 Runtime 字节不变） | 主开发 | OPEN | 预览页现有门禁齐全但未跑回归测试 |
| G5 正式展示许可决策 | 发版方 | OPEN | 许可处置清单已备（第 3 节），决策未做 |
| G6 正式学习流内运行时端到端验证 | 主开发 | OPEN | 预览页验收只覆盖独立预览页 |
| G7 人工编辑签字（如发布政策要求） | 人工编辑（待指定） | OPEN | AI 第二方认证不是人工签字 |

**仓库自带门禁的机械复算（batch76 fail-closed 门禁，函数未改动）：** 6 条中 8/10 项有证据可背书，2 项恒为阻碍——`independent_editorial_signoff`（= G7）与 `runtime_e2e_verified`（= G6）。结果：**eligible 0，rejected 6**（见 `b216_gate76_evaluation.json`）。注意：`sense_identity_verified` 一项是按证据链背书的；若注册权威要求注册表背书，则该项也 revert 为 OPEN，阻碍变为 3 项——本包如实保留这一条件句，不把它藏起来。

**正式 Overlay 包：未生成。** 生成条件是 G1–G7 全部闭合；目前 0/7 闭合。候选包 + manifest 模板是正式 Overlay 的输入材料，不是正式 Overlay 本身。任何把 STAGING_ONLY 改标为 PRODUCTION_READY 的操作，在门禁闭合前都是违规。

## 7. 下一批：batch79 七条语法 KU 审核（摘要；全文见 b216_next_batch79_review.md）

选池调查：现有候选池中无第二个有现成证据的义项批；最接近的是 batch79 七条语法 KU（staging 最完整，剑桥语法页引用齐全，全部 `EDITORIAL_UNVERIFIED`、`release_eligible: false`）。独立审核结果：

- **身份：7/7 精确 ku_id 命中**（the 78、to 48、have 801、it 59、you 40、they 77）。
- **内容：7/7 语法规则正确**（剑桥语法页 5 页全部重验：a-an-the、infinitives、present perfect、dummy subjects、pronouns one/you/we/they）。
- **可按现有身份认证：5/7。** 2 条内容正确但身份不匹配，需权威裁决，不得按现有身份认证：
  - it ku01：教学目标是形式主语 it（`It is important to check…`），但其 Runtime KU 释义是“thing/situation pronoun”（指代 it）；形式主语对应的是 ku02（“dummy subject/object”）。两条 it 记录共享 sense_id s01，ku01 的目标与 ku02 的释义撞了。
  - they ku02：教学目标是泛指 they（`They say it will rain tomorrow`，不具体的人/机构），但其 Runtime KU 释义是“singular they”（性别未知/非二元单数）；泛指 they 在 Runtime 现有 they KU 中无对应释义。
- **结构缺口（全批）：** 记录缺 rank、headword_id、pos、us_ipa、gloss——均可从 Runtime 按词头机械补齐（词头唯一），但补齐必须标注为 Runtime 派生，不得冒充源提供；评估格式混杂（填空 + 辨识题），判分契约第 5 节已覆盖两类。
- batch79 的 5 条可认证项仍面临与 batch93 相同的 G1–G7 门禁；本包不将其中的任何一条标记为正式通过。

## 8. 本包交付文件（全部提交 QA 分支，见最终汇报 SHA）

- `b216_formal_certification_package.md`（本文件）
- `b215_b216_conclusion_update.md`（结论更新）
- `b216_sense_registration_proposal.json`（注册提案，未签名）
- `batch93_errata_candidate_v1.json` + `batch93_errata_candidate_manifest.json`（勘误候选包 + manifest，STAGING）
- `b216_scoring_contract.md` + `b216_scoring_reference.test.mjs`（判分契约 + 22/22 参考测试）
- `b216_gate76_evaluation.json`（仓库门禁机械复算：eligible 0）
- `b216_next_batch79_review.md` + `b216_next_batch79_review.json`（下一批审核：内容 7/7，身份匹配 5/7）
