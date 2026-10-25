# 双AI认证记录：Batch93 六条（语义层）+ 主开发交付

- 认证线：双AI质量认证线（Issue #1 六线统一约定，2026-10-25 修订版；旧四线表述作废）
- 本记录格式：Issue #1 要求的最小记录（内容 ID/版本、ChatGPT 结论、Muse 结论、简短具体理由、最终状态）+ 每批最小交付（分支/SHA、资产路径、数据量、契约版本、实际 QA、已知问题、下一批计划）
- **最终状态：双AI语义认证通过 6/6，可交付主开发隔离集成。** 正式学习池/SRS/生产标志由主开发在集成后决定，不属认证线。

## 1. 内容与锚点

| 项目 | 值 |
|---|---|
| 教学包 | `tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json`，SHA `21d83151…`，版本 `2026.10.23-batch93-staging` |
| 注册绑定 | `tools/core20k_lexicon/staging/B217_SIX_KU_REGISTERED_CROSSWALK.json`（commit `2eac7df`），`KU_ANCHORED_SENSE`，`official_sense_id: null`，6/6 绑定，状态 `APPROVED_BINDING_REGISTRATION_ONLY` |
| 正式 Runtime | 分支 `core20k-lexicon-production-v1` HEAD `c7aae5a`，gz SHA `e91e2ab3…`（712,478 B，20,000 词头，16,617 KU） |
| QA 分支 | `core20k-teaching-qa-b162-20261024` HEAD `00f79eb` |
| 主开发分支 | `home-perf-safe-load-20261022` HEAD `334ce8c`（近期提交为恢复稳定预览的 revert） |
| 数据量 | 6 条 KU（person/time/know/people/talk/here） |
| 契约版本 | `KU_ANCHORED_SENSE`：以 Runtime 正式 KU ID 锚定；教学包遗留 `sense_id` 不当正式 Runtime ID；不改 Runtime/SRS |

## 2. 双方独立结论（事前互不参考逐条判断）

- **ChatGPT（英文教学内容线，B218，commit `00f79eb`）**：语义 6/6 PASS，例句翻译 6/6 PASS，逐条中文答案政策已给；总状态 `CONDITIONAL_PASS_PENDING_GRADING_IMPLEMENTATION_AND_SOURCE_ATTESTATION`，`release_eligible: false`，`production_ready: false`。4 项条件按 Issue #1 分离见第 4 节。
- **Muse（独立第二方，B216，报告 `64e26ad`、数据 `8b51375`）**：语义 6/6 PASS（义项契合、例句判别、翻译、形式、证据、教学价值六项标准），剑桥定义页与发音页 6 词全取且证据全 STRONG，判别矩阵逐条排除全部姊妹义。**针对教学线同步中“尚无 Muse 独立逐条认可记录”一说，特此指明：B216 认证 JSON 含逐 KU verdict 与理由（`per_ku` 6 条），即为 Muse 的逐条认可记录；本文件将其与 B218 并列为双AI记录，缺口就此闭合。**
- **分歧清单：语义分歧 0；答案政策待定项仅 1 项（D1），不影响语义通过。** 其余 5 条双方答案集完全一致（仅顺序不同）。

## 3. 逐条双AI记录

| 词头 / KU | ChatGPT（B218） | Muse（B216） | 中文答案政策（双方） | 分歧 |
|---|---|---|---|---|
| person w_0266_person_ku01 | 语义 PASS，翻译 PASS | PASS | 一个人/人/个人（双方一致） | 无 |
| time w_0049_time_ku01 | 语义 PASS，翻译 PASS；接受时长，拒绝时刻/次数 | PASS | 时间/时长一致；第三变体见 D1 | **D1** |
| know w_0041_know_ku01 | 语义 PASS，翻译 PASS | PASS | 知道/了解（双方一致） | 无 |
| people w_0057_people_ku01 | 语义 PASS，翻译 PASS | PASS | 人们/许多人/人（双方一致） | 无 |
| talk w_0139_talk_ku01 | 语义 PASS，翻译 PASS；教学 /tɑːk/ 可接受，Runtime /tˈɔk/ 不同、不改 Runtime | PASS（同结论：包值才是剑桥美音） | 交谈/说话（双方一致） | 无 |
| here w_0099_here_ku01 | 语义 PASS，翻译 PASS；方向性到这里、静态在这里均可 | PASS | 这里/到这里/在这里（双方一致） | 无 |

**D1（唯一分歧项，定向处理，不拖累其他 5 条）：** time 的第三可接受答案：ChatGPT 为“一段时间”，Muse/包 correct_answer 为“完成事情所需的时长”。双方一致接受“时间/时长”、一致拒绝“时刻”。语义本身无分歧（均为 duration 义）。处理：教学线决定 time 一题的 canonical 答案集（建议取并集并注明仅限本题语境）；该集仅在未来出现打字答题路径时才生效，自评流不受影响。

## 4. B218 四项条件的分离处置（按 Issue #1，不增设门禁）

| B218 条件 | 处置 |
|---|---|
| 主开发须实现中文等价答案判分并演示正反测试 | **仅在真实打字答题路径存在时适用。** 正式流为揭晓后自评（`answerHtml` 不读打字输入、不做机器等价判断），主开发 G4 申请亦载明此事实；隔离页的输入仅为自查提示，不以输入判分改写 SRS。本认证线确认运行时事实：正式流无影响 SRS 的自动打字判分路径。豁免决定属发布负责人，不属认证线。若未来出现打字路径，G4 立即恢复为 REQUIRED，须用 B216 22+24 项契约验收。 |
| 正式证书不得把包遗留 sense_id 当 Runtime 权威，须用批准的 KU_ANCHORED_SENSE | **已满足。** 注册绑定（`2eac7df`）即为 KU_ANCHORED_SENSE，`official_sense_id: null`；本记录与 B216/B217 均不把 s01 当 Runtime ID。 |
| B218 审查中未独立复取外部词典来源 | **在合并证据层面已满足。** Muse 的 B215/B216 亲自复取剑桥定义页与发音页 6 词（证据 STRONG）；ChatGPT 的语义/翻译判断独立，来源复取不要求双方重复做两遍。 |
| 主开发部署与发布门禁另行处理 | **边界声明，非内容条件。** 部署、集成 QA、回归、生产标志属主开发线；认证线不替主开发决定，也不因此扣留已认证内容。 |

## 5. 给主开发的交付（按 Issue #1 每批最小交付格式）

- **可直接消费的资产**：原教学包（SHA `21d83151…`，即双方评审的同一包）；注册绑定（`2eac7df`）；B218 审查（`00f79eb`）；B216 Muse 认证（`64e26ad`/`8b51375`）；勘误候选包（`batch93_errata_candidate_v1.json`，SHA `f1c927db…`，仅 time 难度 A1→A2 与两处证书链接对齐）作为教学线的下一版输入参考，不替代原包。
- **主开发侧已有的隔离集成物**（主开发分支实测）：`rebuild-preview/b218-isolated/`（六词隔离学习页，STAGING_ONLY、内存进度、不写正式 SRS）、`batch93-overlay-release-candidate-manifest.json`（STAGING_ONLY，`activation_allowed: false`）、`scripts/core20k-approved-teaching-overlay.mjs` 及其测试、教学候选适配器。注意：该 manifest 的 `source_commit` 为 `66ee1c4`，早于 `2eac7df` 注册，集成时请刷新。
- **请主开发交付**（Issue #1 格式）：集成 SHA、实际测试 URL、回归结果。近期主开发提交以恢复稳定预览为主（`334ce8c` 等 revert），尚未见正式学习流 E2E 与回归证据——这是主开发线的下一步工作，不是认证线的扣留理由。
- **已知问题（不阻塞交付）**：D1（time 第三答案变体，教学线定）；talk 美音与 Runtime IPA 差异（教学用包值，不改 Runtime）；注册绑定文件的 `registration_authority_signed` 字段为 false 而状态为 APPROVED（项目负责人授权记录在案，请项目负责人确认该授权记录是否足用）；主开发 manifest 的 open_gates 沿用旧门禁表述，集成时请按 Issue #1 更新。

## 6. 口径变更声明（重要）

- **旧四线表述作废，六线约定为准。** 本认证线此前一轮的 G0–G10 门禁框架（B217 报告的“不放行、PRODUCTION_READY 0”）即日起**退役，不再作为放行条件**；其证据（身份复算、判分契约、隔离核查）保留为 QA 信息，但不再构成认证线增设的审批层。按 Issue #1，认证通过即交付主开发隔离集成；集成 QA、回归与生产决定属主开发线。
- **B217 报告结论的修正**：该报告称“注册背书 BLOCKED、Sense 绑定 BLOCKED”，其后 `2eac7df` 已在项目负责人授权下执行绑定注册（范围仅首批 6 条，不改 legacy crosswalk/Runtime/SRS/main）。注册问题就此在认证线层面闭合；剩余的集成与生产事项属主开发线与发布负责人。

## 7. 下一批计划（按批滚动，不等待 20K）

- **batch79 七条语法 KU**：Muse 审核已完成（内容 7/7、身份命中 7/7）；其中 5 条（the/to/have/it-ku02/you）可进入双AI记录，待 ChatGPT 独立意见；2 条（it ku01、they ku02）身份挂接需教学线定向修正（it ku01 的形式主语目标撞 ku02 释义；they ku02 的泛指目标在 Runtime 无对应 KU），**不拖累其他 5 条**。
- **待对方输入**：ChatGPT 对 batch79 五条的独立意见；教学线对 it ku01/they ku02 的定向修正；主开发对 Batch93 的集成 SHA/测试 URL/回归结果；发布负责人对 G4 豁免的确认（仅涉打字路径适用性，不涉语义认证）。
