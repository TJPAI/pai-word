# B217 首批 6 条 KU 正式绑定注册执行报告

## 结论

- **正式注册成功：6/6**（person、time、know、people、talk、here；KU_ANCHORED_SENSE 绑定）。
- **身份注册阻碍：0**。本批身份门禁已关闭。
- **这不是发布**：release_eligible 仍 false、production_ready 仍 false、教学 Overlay 未写入正式学习池。教学最终认证与部署门禁仍待分别通过。

## 授权（角色分离，不伪造签名）

- 授权方：PAI Word 项目负责人，2026-10-25 以指令方式授权 Muse 担任本批注册执行负责人，范围仅限上述 6 条，绑定规则 KU_ANCHORED_SENSE、official_sense_id = null、不新建 Sense ID、不改 KU ID / headword 身份 / SRS 键，钉死 Runtime SHA e91e2ab3… 与 Batch93 包 SHA 21d83151…。
- **未提供项目负责人亲笔签名或 GitHub 签名，也未伪造**：授权证据就是负责人指令本身；决策文件中原空白签名字段原样保留空白，授权以指令记录形式另行记载。
- 执行方：Muse（仅本批范围）。
- 独立 QA：Fail-Closed 脚本 v2 自动重验（身份 + 故障注入），不等同于教学认证门禁与部署门禁。

## 交付（教学 QA 隔离分支，tools/core20k_lexicon/staging/）

1. B217_SIX_KU_REGISTERED_CROSSWALK.json（新增，正式注册 Crosswalk，6 条 APPROVED）
2. B217_SENSE_BINDING_DECISION_AND_AUTHORIZATION.json（更新为 v2，记录授权；原提案与空白签名字段保留）
3. B217_REGISTRATION_AUTHORIZATION_AND_EXECUTION.json（新增，授权与执行记录）
4. B217_FAIL_CLOSED_IDENTITY_QA.py（更新为 v2）
5. B217_REGISTRATION_QA_RESULTS.json / .txt（新增）
6. B217_REGISTRATION_EXECUTION_REPORT.md（本文件）

## QA 证据

- Runtime 身份 QA：6/6 PASS（rank、词头、POS、ku_id、sense 类、中英释义、playable、包归属逐条重验）。
- 绑定准入：6/6 PASS（身份 + APPROVED + 授权证据三者齐备）。
- 发布门禁：CLOSED（release_eligible false、production_ready false、overlay NOT_PUBLISHED；脚本 v2 强制此边界，任一翻转即判 FAIL）。
- 13 项故障注入自测：13/13（Runtime SHA、包 SHA、KU 缺失、跨词头重复、rank 不匹配、POS 不匹配、非 Sense 类型、未批准准入、已批准对照放行、release_eligible 翻转、注册表缺失/损坏/版本不兼容；另只读断言 PASS）。
- 对照：旧 PENDING 权威记录在 v2 脚本下身份仍 6/6 PASS、准入仍正确拒绝，证明门禁未被放宽。
- 诚实记录：v2 脚本首轮自测为 12/13——脚本内授权来源字面量与注册文件记载不一致导致已批准对照误拒；仅修正脚本字面量（注册文件未动、门禁检查未变），重跑 13/13。
- 只读保证：运行前后 Runtime 与包 SHA 不变。

## 未动事项

正式 Runtime、main、SRS、用户学习记录、16,816 条遗留身份记录（identity-crosswalk.json 未改动，本批以新增 Crosswalk 文件登记；将其 6 行并入遗留 crosswalk 的 reviewed 数组是主开发/注册方的后续机械步骤，不在本批擅自改动旧文件）、B189 83 条（未混入）。

## 剩余门禁

1. 教学最终认证：OPEN，归 ChatGPT 英文教学线（另含 talk 发音、time“时长”两项教学线人工复核）。
2. 正式部署：OPEN，归主开发；须待认证门禁通过后，方可把 Overlay 接入正式学习池。
3. 漂移规则：Runtime SHA、KU 身份、KU 类型或释义任一变化，相关绑定加载时必须拒绝并重新审核。

