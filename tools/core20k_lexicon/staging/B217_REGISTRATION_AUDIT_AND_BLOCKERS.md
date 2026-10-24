# B217 首批 6 条 KU 注册审核与剩余阻碍报告

## 三个状态，必须分开读（本报告的核心纪律）

| 状态 | 结论 |
|---|---|
| 技术验证（身份 + 绑定方案） | PASS：身份 6/6，绑定方案技术可行。 |
| 权威注册批准 | **0 条**。Muse 没有被明确授予的正式注册权限，未署名批准，未把任何状态改成 APPROVED。 |
| 正式 Overlay 发布 | **0 条**。未发布，不得据此进入正式学习池或 SRS。 |

把 6/6 技术验证写成正式发布 PASS 是本报告明确拒绝的写法。

## 实测锚点（本次重新拉取，非沿用）

- 正式 Runtime 分支 `core20k-lexicon-production-v1` HEAD `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`，文件 `data/core20k-runtime.json.gz`：712,478 字节，SHA-256 `e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b`，blob `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`。
- Batch93 教学包 `tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json`：SHA-256 `21d831519abdda34fadef88a601655373750ddf3385ea98d27370cfe2b1eec15`（与清单一致，本次重算）。
- QA 分支检查时 HEAD `ccbdd21`；前序注册候选提交 `f85e271`（ChatGPT，状态 CANDIDATE_AWAITING_RUNTIME_REGISTRAR_APPROVAL，签署 false）；B217 交接提交 `66ee1c4`。
- 本批新增记录相对候选的增量：候选记录 `sha256_recomputed_by_b217=false`（仅引 B215 证据）；本批重算了 Runtime SHA 与 Pack SHA，并逐条写入实际行级字段（rank、词头、POS、KU 类型、释义、发音、词头 KU 数、旧包对照）。

## 6 条身份核验结果（全部 PASS）

| 词头 | KU ID | rank | POS | 类型 | 释义（Runtime） | 身份 |
|---|---|---|---|---|---|---|
| person | w_0266_person_ku01 | 108 | n. | sense | 人；个人 / human individual | PASS |
| time | w_0049_time_ku01 | 111 | n. | sense | 时间 / measured duration | PASS |
| know | w_0041_know_ku01 | 138 | v. | sense | 知道；了解 / have knowledge | PASS |
| people | w_0057_people_ku01 | 142 | n. | sense | 人；人们 / persons collectively | PASS |
| talk | w_0139_talk_ku01 | 145 | v. | sense | 说话；交谈 / speak/converse | PASS |
| here | w_0099_here_ku01 | 153 | adv. | sense | 这里；在这里 / in this place | PASS |

旧包对照差异（均已记录，非身份冲突）：time 中文多“时长”、people 中文换序、here 英文释义简写方位一侧、talk 发音包值与 Runtime 值元音不同。KU 编号 4 位数字不是 rank；Runtime 无 `headword_id`/`sense_id` 字段，Sense 身份即 `kind=sense` 的 KU 行本身。

## Sense 绑定决策

- 方案：`KU_ANCHORED_SENSE`，锚点为 Runtime `ku_id`，`official_sense_id=null`。技术可行，理由：KU ID 全局唯一（16,617/16,617 实测）、每词头仅一行、无一对多歧义；六锚点均为 sense 类且可玩；零新标识符，故不碰撞 SRS 键。
- 风险与对策（详见决策文件）：释义文本共享导致重复归属风险——绑定只认 `ku_id + kind`，永不以释义文本定行；未来 Runtime 修订导致绑定过期——绑定钉死 SHA 与释义文本，加载时重验，漂移即拒绝；多包同锚——属 Overlay 去重规则，不是绑定冲突；未来若有消费方强制要求 `sense_id` 字段——须由注册方做 Schema 裁决，QA 不得把旧 `s01` 改名顶替。
- 授权状态：**PROPOSED_NOT_APPROVED**。决策文件内含可直接签署的授权文本（范围仅限这 6 条、钉死上述两个 SHA；签署仅批准绑定，不批准内容认证、Overlay 发布或主系统部署），签署栏目前为空。

## 授权核查结论（为什么没有 APPROVED）

检索了 B190 权威与证据协议、B201/B204 预检、B216 Sense 注册提案、集成契约、B217 交接与注册候选：

- B190：注册谓词只是本地字段检查，新 KU 分配未授予任何权威；每次状态迁移须有明确授权主体；该文件本身是 QA 政策提案，不改变谓词与 Runtime 状态。
- B216 Sense 提案原文：PROPOSAL_NOT_SIGNED，注册权威“由用户作为产品负责人指定”——未指定 Muse。
- B217 交接：提议的负责人是英文 Core20K Runtime / 身份注册维护者——是提议，不是授予。
- 注册候选自身：`authority_approval_required=true`，`registration_authority_signed=false`，全部 PENDING。
- 本对话中没有任何授予 Muse 正式注册权限的消息；任务本身也要求无明确权限时不得冒充。

因此：已批准数量为 0 不是工作未完成，而是权限事实。本批把“可签署的方案”做到注册方签字即可生效的状态，签字人缺位是唯一缺口。

## Fail-Closed QA 结果（实测，非声明）

脚本 `B217_FAIL_CLOSED_IDENTITY_QA.py`：正常模式身份 6/6 PASS；未批准时 Overlay 准入 6/6 正确拒绝（这是通过项，不是失败）。自测模式 13/13 通过：Runtime SHA 篡改、Pack SHA 篡改、KU 缺失、跨词头重复 KU、rank/词头不匹配、POS 不匹配、类型非 Sense、未批准绑定准入、注册表缺失/损坏/版本不兼容全部被拒绝；对照项（内存中已批准记录，未写入）正常放行，证明门在有批准时能打开；运行前后 Runtime 与 Pack 哈希不变（只读保证）。完整逐行记录见 `B217_FAIL_CLOSED_QA_RESULTS.txt`，机器可读摘要见 `B217_FAIL_CLOSED_QA_RESULTS.json`。

## 剩余阻碍（按缺口归属）

1. **缺产品负责人 / 指定注册方的签字**：签署决策文件中的授权文本（或等效签署提交），仅此一项可把 6 条从 PENDING 推为 APPROVED。这是当前唯一阻碍注册的缺口。
2. **最终认证门禁**：属 ChatGPT 英文教学线，与注册签字分离；签字不等于认证通过。
3. **主开发部署门禁**：含判分实现、隔离回归、正式 Overlay 清单与端到端验收；签字与认证全过后仍须此门。
4. **教学线人工复核项**：talk 发音取值、time“时长”答案政策（不影响身份，但影响正式内容）。

## 能否交主开发进入正式 Overlay 集成？

**不能。** 主开发可以拿本批做集成准备（按 fail-closed 校验与判分契约预研），但正式 Overlay 集成验收的准入条件是：注册签字 + 最终认证门禁 + 部署门禁三者齐备，目前三者均为 0/待定。任何提前写入正式学习池或 SRS 的行为都不被本报告授权。

## 未动事项（合规清单）

- 16,816 条遗留身份记录未覆盖、未改动（`identity-crosswalk.json` 的 `reviewed_crosswalk` 仍为空数组，由注册方签字后按制度追加，本批不代笔）。
- 冻结 Runtime、SRS、学习记录、main 均未修改；未合并 PR；未生成新正式 KU/Sense ID；B189 的 83 条未混入本批。
