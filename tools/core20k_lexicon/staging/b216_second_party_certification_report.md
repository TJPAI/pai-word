# B216 第二方独立认证报告：Batch93 六条教学内容（语义层）

- 认证人：Muse Spark 1.3（独立英语词典学审核专家；与第一方 ChatGPT 审核人、与 B216 triage 作者不同）
- 认证对象：`tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json`（6 条：person、time、know、people、talk、here；Pack SHA `21d83151…`，blob `2d7e1750…`）
- 第一方材料：B216 triage 报告 `tools/core20k_lexicon/staging/B216_INDEPENDENT_TRIAGE_AND_IDENTITY_GATE.md`（commit `5793139`，3,699 B，SHA `a36e454c…`）——其 6 条“Semantic alignment acceptable”在本认证中只作待交叉的初审意见，不作证据
- 正式 Runtime 锚点：分支 `core20k-lexicon-production-v1` HEAD `c7aae5a6`，gz SHA `e91e2ab3…`（B215 已核验，本认证复用其身份输入，不重复身份认证）
- 配套机器可读文件：`b216_second_party_certification.json`（逐 KU 判别矩阵、证据分级、交叉比较、剩余阻碍）
- 本认证零修改：教学包、正式 Runtime、crosswalk、预览文件、SRS、main、主开发分支均未动。**本认证不写 crosswalk 条目**——语义认证与身份认证必须分开，crosswalk 的补记是注册权威的工作，不是认证人的工作。

## 认证定义（先划清范围，避免误读）

**授予的是：第二方语义认证（内容层）。** 6 条全部通过，见下表。

**不授予的是：正式发布认证。** PRODUCTION_READY 仍为 0（与 triage 决定一致）。语义通过是正式发布的必要条件，不是充分条件。以下事项本认证一概不授权：SRS 写入、可玩池提升、正式 Runtime 改动、用户学习状态改动、任何 ku_id/sense_id 的铸造或重 assign。

**PENDING 的定义：** 指记录本身存在未解决的语义疑问。本次 PENDING 为 0——审查中提出的每个语义问题均已由判别分析或剑桥证据解决；剩余事项全部是非语义门禁，列在第 5 节，不记为 PENDING。

## 认证标准（6 项全过才 PASS）

- C1 义项契合：包释义对应剑桥真实义项节。
- C2 例句判别：例句只强制目标义项，且排除同一词头下每一个姊妹 KU 的义项（同释义的 morphology/grammar/collocation 型姊妹 KU 按 ku_type 排除，记为连接歧义而非语义歧义）。
- C3 翻译：中文翻译准确、自然，且译出的是目标义项而非他义。
- C4 形式：词性与 Runtime 一致；美音 IPA 与剑桥美音逐字一致。
- C5 证据：剑桥证据 STRONG（定义或发音节由本认证亲自查得）。
- C6 教学价值：例句只用 A1 词汇、属高频原型句式、提问无歧义（句中释义，非孤词翻译）。

## 逐条认证结论

| 词头 | 认证结论 | 剑桥证据 | 关键判别点 |
|---|---|---|---|
| person 108 | **PASS** | STRONG：个体义 + 翻译“人”；美音 `/ˈpɝː.sən/` 逐字一致 | `One person` 只读个体人；ku02 morphology 按类型排除 |
| time 111 | **PASS** | STRONG：TIME AVAILABLE + MINUTES/DAYS/YEARS；美音 `/taɪm/` 逐字一致 | `more time to finish` 只读可用时长；排除 occasion、period/era、schedule/timing |
| know 138 | **PASS** | STRONG：知识/知晓例证；美音 `/noʊ/` 逐字一致 | `the answer` 只读掌握事实；排除 familiar with、recognize |
| people 142 | **PASS** | STRONG：plural noun (PERSONS) 节（与 NATION、动词分立）；美音 `/ˈpiː.pəl/` 逐字一致 | `Many people live here` 只读集合人；排除 nation/community |
| talk 145 | **PASS** | STRONG：动词 [I] (SAY WORDS) A1；中文 讲话，谈话；美音 `/tɑːk/` 逐字一致 | 动词用法排除名词 talk；习惯性交谈排除正式讨论/谈判 |
| here 153 | **PASS** | STRONG：A1 `in, at, or to this place`；中文 在这里，到这里；美音 `/hɪr/` 逐字一致 | `come here` 只读方向性“到这里”；排除 discourse 的 at this point |

逐条完整依据（判别矩阵、翻译评价、教学价值、注意事项）见配套 JSON；以下只记每条的非显而易见点：

- **person**：教学上 `One person` 同时隔离可数性与个体义，场景为原型 A1 语境；其余词全 A1。
- **time**：附两项条件（非语义失败）：(a) `correct_answer`（时间；完成事情所需的时长）比释义多语境解读，仅在包自述的“接受任何精确等价”政策下成立——原串判分会误杀，判分实现仍是开放门禁；(b) 难度 A1 是词级，剑桥时长/可用义标 A2/B1，建议不把 A1 作为该义项级别展示。
- **know**：6 条中最短、最频的原型句（学校语境），是该动词理想的 A1 首例。
- **people**：与 person 配对教学价值高（单数/集合对照）；本认证在 /us/ 词典页上直接看到 plural noun (PERSONS) 独立义项节，证据由 B215 时的“一致”升级为 STRONG。
- **talk**：Runtime IPA `/tˈɔk/` 为英式元音（剑桥英音 `/tɔːk/`），包值 `/tɑːk/` 才是剑桥美音——本认证为展示背书包值；冻结 Runtime 不改，已记给正式分支 owner。
- **here**：包释义（at or to this place）恰为剑桥原文形式，比 Runtime 窄释义（in this place）更贴合方向性例句；同一义项、宽度不同，非不同义项。6 条中唯一没有同释义姊妹 KU 的词头。

## 与第一方初审的交叉比较（无自动 PASS）

| 维度 | 第一方 triage | 本认证 | 比较结果 |
|---|---|---|---|
| 6 条可接受性 | acceptable × 6 | PASS × 6 | 一致，但本认证的 PASS 各自由独立判别矩阵与剑桥重验证出，不因 triage 已接受而接受 |
| 判断层次 | 句子层面自然度 | 义项层面判别（例句 vs 每个姊妹义） | 本认证更深 |
| 外部词典取证 | 未取（自述） | 剑桥定义页 + 发音页 6 词全取，逐条分级 | 本认证补足 |
| 许可处置 | 未作（自述 URL 不等于复用权） | 已处置：未发现逐字复用，隔离展示 LOW，正式许可仍需发版方决策 | 本认证补足 |
| 身份表述 | crosswalk 内 0 已验证 | 见下“对账” | 两说并存，互不矛盾 |

**分歧：0。** 6 条结论全部一致；一致的原因是内容本身过硬，不是迁就。两处需要对账而非分歧：

1. **“crosswalk 0”与“Runtime 6/6”并存。** triage 的“0 verified current-runtime matches in the published crosswalk”说的是 crosswalk 文件（现仍 `reviewed: []`，状态 `BLOCKED_PENDING_ROW_LEVEL_VALIDATION`，legacy 16,816 条未审）；B215 直接查 Runtime 得 6/6 精确 ku_id。两者描述不同工件：空的审核账本 vs Runtime 本身。把账本为空读成“Runtime 中不存在”是错；把 Runtime 中存在读成“账本已完成”也是错。缺口是**记录缺口**，不是存在性缺口——补记是注册权威的事，本认证不代笔。
2. **triage 另两项事实主张本认证已独立核实：** 预览 JSON（集成-branch `rebuild-preview/batch93-staging-preview.json`，blob `cb284d7a…`）确为 6 条、全 `content_certified: false / production_ready: false`、状态 STAGING_ONLY、来源 blob 与 Pack blob `2d7e1750…` 逐字一致；其记录与 Pack 逐字段比对全等（仅不带 pos 字段，属子集投影、非改动）。“正式教学包 0 条”亦属实：集成-branch 上没有已批准的正式教学包工件，STAGING_ONLY 预览 JSON 不是正式包。

## 来源、授权与许可处置

- **原创与第三方区分：** 6 条例句全部原创极简句（剑桥页上均未出现）；6 条英文释义全部 2–4 词改写（无一与剑桥定义措辞相同）；IPA 转写属发音事实数据。6 条记录中未发现第三方材料。
- **隔离展示：** 风险 LOW。展示措辞应写“已对照剑桥核对”，不出现剑桥品牌与背书暗示。
- **正式展示：** 仍需发版方许可/合规决策；本认证不授予。
- **来源勘误（B215 已记，复述）：** time、here 两条证书链接与归属链接不一致，冻结包不改，记下批勘误。

## 剩余阻碍（语义认证之后、正式发布之前，全部仍 OPEN）

1. **权威行级映射补记：** crosswalk（或等效权威工件）中记入已验证的 6 条映射。事实已验证，记录未完成——注册权威补记，本认证不代笔。
2. **接受替代表述的判分实现：** 包政策有文字，实现未见；time 条已证明原串判分会误杀。
3. **签名版 overlay 清单：** 含精确 Runtime SHA、记录数、覆盖、来源归属、不可变 KU 身份、发布决定，及 fail-closed 测试。
4. **隔离回归测试：** 开关关闭无变化、预览不可达 SRS 写路径、渲染后 Runtime 字节不变（现有独立预览页之外的接线前必须做）。
5. **正式展示许可决策**（发版方）。
6. **正式学习流内的运行时端到端验证**（平行预览页验收只覆盖独立预览页，不覆盖正式学习流）。
7. **人工编辑签字**（如发布政策要求）：本认证是 AI 第二方认证，不是人工签字。

## 提交与复核

- 本报告与配套 JSON 提交至隔离 QA 分支 `core20k-teaching-qa-b162-20261024`（提交 SHA 见最终汇报）。
- 复核方法：任一复核人可用配套 JSON 中的锚点（Pack SHA、Runtime gz SHA、triage SHA、预览 blob、crosswalk blob）重算全部数量；用剑桥定义页与发音页重验 6 条 IPA 与义项节；用 Runtime 原始文件重验 6 条 ku_id（B215 复算脚本同路径可用）。
- **重申：** 即使 6 条语义全部通过，在身份映射补记与发布门禁通过前，PRODUCTION_READY 仍为 0；本认证的 PASS 只覆盖内容语义层。

---

*本认证只对锚定的 SHA 负责：Pack `21d83151…`、Runtime gz `e91e2ab3…`、triage commit `5793139`、预览 blob `cb284d7a…`、crosswalk blob `467d1592…`。任一锚点变化，结论需重审。*
