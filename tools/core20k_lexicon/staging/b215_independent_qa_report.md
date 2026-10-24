# B215 独立 QA 报告：英文 Core20K Batch93 教学包与正式集成资格核验

- 审核人：Muse Spark 1.3（独立语言学 QA 负责人；与包内 ChatGPT 审核人不同）
- 审核对象：B215 交接文档 `tools/core20k_lexicon/staging/B215_INTEGRATION_HANDOFF_STAGING_ONLY.md`（commit `5fecf26`）与教学包 `tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json`
- 审核分支：`core20k-teaching-qa-b162-20261024`（审核时 HEAD `85bffc1`）
- 正式 Runtime 锚点：分支 `core20k-lexicon-production-v1` HEAD `c7aae5a6`，文件 `data/core20k-runtime.json.gz`（712,478 B，SHA-256 `e91e2ab3…`，已逐字节核验命中），解压 2,438,913 B，schema `pai-core20k-runtime-v1`，release `core20k-unified-mvp-1`，20,000 词头，16,617 KU
- 方法声明：包内 ChatGPT 的 `review_status: PASS` 在本审中只作“待复核的主张”，不作证据。以下每项结论均由本审独立复算、独立查词典、独立比对 Runtime 得出。B214 工程验收（本地 36/36、CI 14/14、真实库 PASS）只证明事务层可用，不证明 Batch93 内容已认证——本审不因 B214 通过而放宽任何内容门禁。
- 配套证据：`b215_identity_and_review_evidence.json`（机器可读逐条结果与 SHA 锚点）、`b215_identity_check.py`（身份复算脚本，取 Runtime 与 Pack 两路径作参数；Runtime 在正式分支上，故本脚本为手工复算工具，非 CI 测试）
- 本审零修改：教学包、正式 Runtime、正式 SRS、main、主开发分支均未动。冻结包（SHA 已钉住）发现的小问题一律记为勘误、不改包。

## 结论总表（分项给 verdict，不合成总 PASS）

| 分项 | 结论 |
|---|---|
| 交接文档准确性 | PASS（1 处 HEAD 陈旧但系分支正常推进，见第 1 节） |
| 身份匹配（ku_id 精确） | PASS 6/6；sense 注册表缺口仍 OPEN（见第 2 节） |
| 逐条语言学内容（义项、例句、翻译） | PASS 6/6，可用于隔离预览（附注见第 3 节） |
| 美音 IPA | PASS 6/6，与剑桥美音逐字一致（本审从剑桥发音页逐条重验） |
| 来源与许可（隔离展示） | LOW RISK；正式展示仍需发版方许可决策（见第 4 节） |
| STAGING_ONLY 预览资格 | ELIGIBLE 6/6（内容层面），附 6 项集成条件（见第 5 节） |
| 正式认证资格 | NOT ELIGIBLE 0/6；正式认证 KU 数仍为 0，不变（见第 6 节） |

## 1. 交接文档逐项核验

| 交接文档主张 | 本审复核 |
|---|---|
| 正式分支 HEAD `c7aae5a6` | VERIFIED（远端查询一致） |
| 主集成分支 HEAD `16881c29` | STALE_BUT_VALID：`16881c29` 是现任 HEAD `b99fc35` 的祖先，分支正常推进，非文档错误；本报告以 `b99fc35` 为现任锚点 |
| Pack blob `2d7e1750` | VERIFIED（QA 分支树内一致） |
| Pack 13,900 字节、SHA-256 `21d83151…`（交接文档自述“未独立重算”） | VERIFIED_BY_RECOMPUTATION：本审重算 13,900 字节、SHA 逐字一致 |
| Manifest schema `pai-core20k-teaching-pack-v1` | VERIFIED；另核：`record_count` 6、`production_ready_ku_count` 0、`release_eligible` false、`release_blocker` 为 `INDEPENDENT_SIGNOFF_AND_RUNTIME_QA_PENDING`，均与包内 6 条 `production_ready: false` 一致 |
| Manifest `source_commit_sha 59bfbbb`（历史来源、非现任 HEAD） | VERIFIED：是真实提交，信息为“test(core20k): attest six AI-reviewed L2 records and explicitly block L3 promotion”，2026-10-23，同时存在于正式分支与 QA 分支历史中；其“明确阻止 L3 提升”的主旨与包的 `production_ready: false` 完全一致 |
| 6 记录 / 6 词头；例句中英 6/6；collocation、usage_note_zh、contrast 均为 0 | VERIFIED（包内逐条清点；三字段在记录中根本不存在，不是空值） |
| Batch92 QA：6 AI 审核、0 人工编辑认证、0 L3 就绪 | VERIFIED（`batch92_l2_certification_qa.json`：`l2_ai_reviewed_certificates` 6、`l2_human_editor_certificates` 0、`l3_production_ready` 0；其 limits 自述“AI 审核不等于人工独立编辑认证”“未执行任何单 KU 的 SRS/Runtime 集成”“未发布正式包”） |
| B160 审计：290 候选 KU、0 语义认证、0 可发布 | VERIFIED（`b160_intake_audit_20261024.json`：rows 290、unique_ku 290、`semantically_certified` 0、`release_eligible` 0、`authoritative_registry_checked` false、`production_runtime_changed` false） |
| 适配器初始化 `e: []、c: ''、x: ''`（数据缺失、非渲染 bug） | VERIFIED（集成-branch `scripts/core20k-unified-runtime-adapter.mjs` 第 14 行） |
| “Runtime KU 匹配数 UNKNOWN，不是 6” | 交接时正确，现已被本审取代：ku_id 精确匹配现已确立 6/6（第 2 节）；sense 注册表缺口仍在，不可因此宣称 sense 层已确立 |
| `PRODUCTION_READY = 0；正式可部署教学 KU = 0` | VERIFIED，且本审结束后仍为 0（见第 6 节） |

另核：冻结成员 SHA `e3f84694…` 在 Batch92 QA 记录与 Batch93 manifest 中一致（两处独立记录互证）；但成员文件本体不在 QA 分支上，本审无法重算该哈希——记为未重算，不作失败。

## 2. 身份匹配：ku_id 精确 6/6，sense 层缺口仍在

Runtime 结构实测：词头为位置数组 `[rank, lemma, pos, ipa, [KU 元组]]`，KU 元组为 `[ku_id, ku_type, gloss_zh, gloss_en, playable]`。整份 Runtime 文本中 `sense_id` 出现 **0 次**——Runtime 没有 sense 字段、没有 sense 注册表、没有 headword_id 字段。

| 记录 | rank→lemma | 词性 | ku_id 精确命中 | ku_type | playable | gloss_zh 对 Runtime | gloss_en 对 Runtime |
|---|---|---|---|---|---|---|---|
| person 108 | ✓ | n. ✓ | `w_0266_person_ku01` ✓ | sense ✓ | true | 完全一致（人；个人） | 同义改写（human individual / individual human being） |
| time 111 | ✓ | n. ✓ | `w_0049_time_ku01` ✓ | sense ✓ | true | 差异：包多“时长”（时间 / 时间；时长） | 同义改写（measured / measurable duration） |
| know 138 | ✓ | v. ✓ | `w_0041_know_ku01` ✓ | sense ✓ | true | 完全一致（知道；了解） | 同义改写（have knowledge / possess information） |
| people 142 | ✓ | n. ✓ | `w_0057_people_ku01` ✓ | sense ✓ | true | 差异：两词调序（人；人们 / 人们；人） | 同义改写（persons / human beings collectively） |
| talk 145 | ✓ | v. ✓ | `w_0139_talk_ku01` ✓ | sense ✓ | true | 完全一致（说话；交谈） | 一致（speak/converse，or 与 / 之别） |
| here 153 | ✓ | adv. ✓ | `w_0099_here_ku01` ✓ | sense ✓ | true | 完全一致（这里；在这里） | 包更宽（in this place / at or to this place，见第 3 节 here 条） |

三点必须说清：

1. **headword_id 不是 Runtime 键。** 包内 `core20k:rank:108` 之类字符串在 Runtime 文本中 0 命中。它正确编码了 rank（6/6 rank→lemma 一致），但属于遗留/外部标识体系。任何连接必须用 `(rank, lemma, ku_id)` 三者，绝不能拿 headword_id 字符串去 Runtime 里查。
2. **sense_id 没有 Runtime 对应物。** 包内 `w_…_s01` 在 Runtime 文本中 0 命中。sense 归属是经由 ku_id 精确命中 + 释义对应间接确立的，s01↔ku01 的绑定依据是共享 `w_` 词干的命名惯例，不是注册表查询。未来注册权威必须二选一：建立 sense 注册表，或明文授权“命名惯例绑定”——在那之前，sense 层结论只能写“经 ku_id 间接确立”，不能写“注册表确立”。
3. **禁止按释义连接。** 6 个词头中有 5 个带有与 ku01 释义完全相同或高度相近的姊妹 KU（person ku02 morphology、time ku03 collocation、know ku03 grammar、people ku03 grammar、talk ku04 grammar，释义与 ku01 相同）。按词形、按 rank、按释义连接都会撞上歧义；只有 ku_id 精确连接是无歧义的。本审全部按 ku_id 精确匹配，未用任何猜测。

## 3. 逐条语言学审查（Muse 独立判断，非 ChatGPT 结论复述）

统一标准：例句必须只强制目标义项；中文翻译必须准确、自然；释义必须与剑桥对应义项一致；IPA 必须与剑桥美音一致。6 条例句均为原创极简 A1 句，剑桥页面上均未出现相同句子（非摘抄）。

### person（108，`w_0266_person_ku01`）— MUSE_PASS_STAGING
- 义项：individual human being（人；个人），与 Runtime ku01 一致。
- 例句：`One person is waiting outside.` → `有一个人在外面等候。` PASS。“One person”只强制“个体的人”义，不触发角色/人物义；翻译准确自然。
- IPA：包 `/ˈpɝː.sən/`，剑桥美音逐字一致。Runtime `/pˈɝsən/` 只是记法差异（重音位置、长音符、音节界），发音相同。

### time（111，`w_0049_time_ku01`）— MUSE_PASS_STAGING（附注）
- 义项：measurable duration（时间；时长）。剑桥对应义项为 TIME AVAILABLE（可用于做事的时间量）与 MINUTES/DAYS/YEARS（被测量的存在），例句 `We need more time to finish.` → `我们需要更多时间才能完成。` PASS：`more time to finish` 只强制时长/可用时间义，不触发“时刻”义；`才能完成` 忠实传达了“为完成而需要”的语气。
- 附注三则：(a) 包释义比 Runtime 多“时长”，属时长义的合理展开，非矛盾；(b) `correct_answer`（时间；完成事情所需的时长）比释义多出语境解读，仅在包自述的“接受任何精确等价、不要求原串”政策下成立——若 App 按原串判分会判错，主开发必须实现接受替代表述的判分（见第 6 节）；(c) 难度 A1 是词级：剑桥对时长/可用义标 A2/B1（时刻义才是 A1），建议不把 A1 作为该义项的级别展示，或将本条难度改为 A2。

### know（138，`w_0041_know_ku01`）— MUSE_PASS_STAGING
- 义项：possess information（知道；了解），与 Runtime ku01 完全一致。
- 例句：`I know the answer.` → `我知道答案。` PASS。“the answer”只强制“掌握事实”义，不触发“认识某人”义。
- IPA：包 `/noʊ/`，剑桥美音逐字一致。

### people（142，`w_0057_people_ku01`）— MUSE_PASS_STAGING
- 义项：human beings collectively（人们；人）。例句 `Many people live here.` → `许多人住在这里。` PASS：`Many people` 只强制集合义，不触发“民族/人民”义（ku02）；`correct_answer`（人们；许多人）忠实反映 many。
- 附注：包释义与 Runtime 仅词序不同（人们；人 / 人；人们），语义同一。

### talk（145，`w_0139_talk_ku01`）— MUSE_PASS_STAGING（附 Runtime 侧观察）
- 义项：speak or converse（说话；交谈），剑桥动词 [I] (SAY WORDS) A1（“to say things or speak to someone”，中文 讲话，谈话）一致。
- 例句：`We talk every evening.` → `我们每天晚上交谈。` PASS：习惯性 `every evening` 只强制“交谈”义，不触发“发表讲话”（ku02）或“正式讨论”（ku03）。
- **IPA 冲突（Runtime 一侧，非包错误）：** 包 `/tɑːk/` 与剑桥美音逐字一致；剑桥英音为 `/tɔːk/`。而 Runtime 自带 IPA 为 `/tˈɔk/`——元音是英式 /ɔ/。结论：美音展示必须用包的 `us_ipa`，绝不能把 Runtime IPA 字段当作权威美音。冻结的 Runtime 本审不改，此问题记给正式分支 owner，待下次 Runtime 发版时决定是否修正。

### here（153，`w_0099_here_ku01`）— MUSE_PASS_STAGING
- 义项：at or to this place（这里；在这里）。剑桥 A1 定义原文即 `in, at, or to this place`，中文 在这里，到这里；剑桥自示例式 `Come here` 与包例句同构。
- 例句：`Please come here.` → `请到这里来。` PASS：`come here` 只强制方向性“到这里”分支。注意：包释义（含 to 分支）比 Runtime 释义（仅 in this place）更贴合本例句；属同一义项的不同宽度改写，非不同义项。6 条中 here 是唯一没有同释义姊妹 KU 的词头（ku02 “在这一点；此时”明显不同）。
- IPA：包 `/hɪr/`，剑桥美音逐字一致。

## 4. 来源与许可

- **无逐字复用证据：** 6 条英文释义均为 2–4 词改写，无一与剑桥定义措辞相同；6 条例句均为原创极简句，剑桥页面上均未出现。IPA 转写属发音事实数据，非独创表达。因此隔离展示这 6 条自有文本的许可风险为 LOW。
- **措辞建议：** 包把剑桥 URL 列为 `source_attribution`（范围“英文定义与美音”），易被误读为“释义出自剑桥”。建议展示措辞改为“已对照剑桥核对”，不出现剑桥品牌与背书暗示。正式展示仍需发版方另作许可/合规决策——本审不授予。
- **来源勘误（不改冻结包）：** time 与 here 两条的 `certificate.dictionary_source_url` 与 `source_attribution.url` 不一致（time：词典页 vs 发音页；here：词典页 vs 发音页）。属来源记录 hygiene 问题，非内容错误；冻结包 SHA 不得为此改写，记为下批勘误。
- **诚实度：** 包内 6 条 `human_editor_reviewed` 均为 false，`reviewer_type` 明言“ChatGPT AI 辅助编辑审核、无人工签字主张”，未夸大。本审的独立复核不改变“无人工编辑签字”这一事实——本审是第二方 AI 独立证据，不是人工签字。

## 5. STAGING_ONLY 预览资格：ELIGIBLE（内容层面，附集成条件）

**隔离现状（实测，非推断）：** QA 分支整树检索，`batch93` 仅被 staging 工具引用（batch94 清单生成器、batch94 完整性测试、batch95 答案质量审计）与 B215 交接文档本身；**没有任何 App 运行时代码加载该包**。因此隔离目前是“因未接入而成立”，不是“经测试证明成立”。交接文档的隔离契约（opt-in 开关、STAGING_ONLY 标签、精确 ID 连接、不改 `byKU`/`byScene`、不写 SRS、不改 Runtime）是未来接入的要求，不是已证明的属性。

**本审新增的集成关键发现（回答了交接文档遗留的第 2 项）：** App 答题页的 `e` 是**英文例句字符串数组**（`learning-runtime.js` 对 `u.s.e` 作 map 渲染，每条配发音按钮）；中文翻译在现有渲染器中**没有位置**。因此主开发不能把 `example_zh` 塞进 `e`（会渲染成第二条例句并配英文发音按钮，错误）。必须新增翻译展示通道，或做独立的预览组件；`c` 与 `x` 本包为空，保持空，不伪造。

**另一层隔离语义（避免误读）：** 6 个基础 Runtime KU 的 `playable` 本已为 true。包增加的是覆盖层字段（例句对、翻译），不是把新 KU 推进 playable 池。隔离要求约束的是**覆盖层内容**（不得漏进正式答题页与 SRS 习题），不是基础 KU 的可玩性。

**预览放行条件（全部满足后方可接线，缺一不可）：**
1. 默认关闭的显式 opt-in staging 预览开关；
2. 每条记录醒目的 STAGING_ONLY 标签；
3. 只按本审验证的精确 ku_id 连接，禁用词形/rank/释义连接；
4. 发音展示用包的 `us_ipa`（talk 一条绝不能用 Runtime IPA）；
5. `example_zh` 走新增翻译通道，不进 `e` 数组；
6. 隔离回归测试通过：开关关闭时加载包无任何变化；预览不可达任何 SRS 写路径；预览渲染后基础 Runtime 字节不变（代码库已有先例：scene500-b85 staging 目录测试对未批准项抛 UNAPPROVED）。

## 6. 正式认证资格：NOT ELIGIBLE 0/6，正式认证 KU 数仍为 0

本审提供的是**独立 staging 证据**，不是正式认证。包自列的三项剩余门禁中，仅“双语内容独立复核”一项由本审补足；其余仍 OPEN，正式认证 KU 数因此**维持 0，不变**：

| 剩余阻碍 | 状态 |
|---|---|
| 独立双语签字（INDEPENDENT_BILINGUAL_SIGNOFF） | 本审补足内容层证据（第二方 AI 独立双语复核）；人工编辑签字仍无 |
| 可接受替代表述的判分实现（ASSESSMENT_ACCEPTABLE_ALTERNATES） | OPEN：政策有文字，实现未见；time 条答案已证明原串判分会误杀 |
| 旧 sense 全记录对齐（OLD_SENSE_FULL_RECORD_ALIGNMENT） | OPEN：sense 注册表不存在，s01↔ku01 绑定仅凭命名惯例 + 释义对应，需注册权威定夺 |
| 显式注册权威（任何 ku_id/sense_id 的正式注册） | OPEN：本审未铸造、未重 assign 任何身份 |
| 运行时端到端验证（`runtime_e2e_verified: false`） | OPEN：未在真实 App 内渲染验证 |
| 正式展示许可/合规决策 | OPEN：见第 4 节 |
| 集成隔离回归测试 | OPEN：见第 5 节条件 6 |

**正式发布前还必须有的：** 上述全部关闭 + 独立认证 + 显式注册权威批准的、单独版本化的 approved overlay（交接文档第 5 项原意，本审赞同）。在此之前，任何把 Batch93 记为“已认证”“可发布”“PRODUCTION_READY”的表述均为错误。

## 7. 修复与提交

- **内容修复：无。** 教学包与正式 Runtime 均未发现需要改写冻结物的错误；发现的问题（time/here 来源 URL 不一致、time 难度级别、talk 的 Runtime IPA 英式元音）全部记为勘误与观察，不改冻结包、不改 Runtime。这是刻意决定，不是遗漏。
- **本审提交物（QA 分支）：** 本报告 `tools/core20k_lexicon/staging/b215_independent_qa_report.md`、证据 JSON `tools/core20k_lexicon/staging/b215_identity_and_review_evidence.json`、复算脚本 `tools/core20k_lexicon/staging/b215_identity_check.py`（三文件提交 SHA 见分支提交记录与最终汇报）。
- **测试结果：** 身份复算脚本对锚定 Runtime 与 Pack 重跑，6 条匹配行数值与初算完全一致（仅新脚本标签措辞更短）；剑桥 6 条美音发音页逐条重验 6/6 逐字一致；QA 分支整树检索确认无 App 运行时引用 batch93；集成-branch 适配器与答题页渲染器实测确认 e 形与翻译无槽位。未新增 CI 测试——复算脚本依赖正式分支上的 Runtime 文件，不宜进 CI；其可复算性由本报告的 SHA 锚点保证。

## 8. 给主开发的验收清单（更新交接文档 5 项）

1. 身份：ku_id 6/6 已确立，可按精确 ID 连接；sense 注册表缺口仍需注册权威定夺——**已回答一半**。
2. e 形：已实测为英文字符串数组，中文翻译需新增通道——**已回答**。
3. 双语 QA：本报告即独立复核证据——**已完成**。
4. 隔离测试：第 5 节条件 6 的三项回归测试——**仍需做**。
5. 正式认证与注册权威——**仍需走流程**，本审不代授。

---

*本报告只对锚定的 SHA 负责：Pack SHA `21d83151…`、Runtime gz SHA `e91e2ab3…`、交接文档 commit `5fecf26`。任一锚点变化，结论需重审。*
