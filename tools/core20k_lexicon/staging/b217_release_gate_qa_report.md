# B217 独立发布门禁 QA 报告：Batch93 六条正式 Overlay

- 审核人：Muse Spark 1.3（独立语言学 QA + Runtime 数据契约审核 + 发布质量审计；不是注册权威、不是发布负责人、不是人工编辑）
- 交接：`tools/core20k_lexicon/staging/B217_RELEASE_GATE_OWNER_HANDOFF.md`（commit `66ee1c4`）
- 范围：本轮不重复 B215/B216 语义审核（G0 直接沿用）。本报告只做发布门禁的独立核验。
- 锚点：正式 Runtime 分支 `core20k-lexicon-production-v1` HEAD `c7aae5a`，gz SHA `e91e2ab3…`（712,478 B，20,000 词头，16,617 KU，本审核重新拉取实测）；QA 分支 HEAD `ccbdd21`；Batch93 包 SHA `21d83151…`。
- 配套机器可读文件：`b217_release_gate_results.json`；复算脚本：`b217_identity_recompute.py`（可重复运行，见第 2 节）。
- **结论：不放行。正式发布 PRODUCTION_READY = 0，维持 STAGING_ONLY。**

## 先纠正一个前提：crosswalk 并没有被提交

任务书说“Runtime 负责人提交 crosswalk 后，独立复算”。实测：QA 分支 HEAD 上的 crosswalk（`tools/core20k_lexicon/runtime/v1/identity-crosswalk.json`）仍是 `BLOCKED_PENDING_ROW_LEVEL_VALIDATION`，schema 仍 v1，`reviewed_crosswalk` 仍为空数组。**没有任何注册提交发生。** 本审核复算的对象因此是未签名的注册候选（`B217_SIX_KU_REGISTRAR_CANDIDATE.json`，commit `f85e271`）与 QA 证据（`da5fb94` 的权威 crosswalk 与 Runtime 抽取），不是已提交的 crosswalk。注册方日后若提交，须用本报告附带的复算脚本对提交行重跑一次——候选通过不等于提交通过。

## 门禁总表（PASS 2 / FAIL 0 / BLOCKED 9）

| 门禁 | 结论 | 一句话证据 |
|---|---|---|
| G0 第二方语义认证 | **PASS** | B216 6/6（沿用，不重审） |
| G1 身份记录独立复算 | **PASS** | 6 行对新鲜 Runtime 全字段重现（见第 2 节） |
| G2 注册背书（crosswalk 记录 + 签名） | **BLOCKED** | crosswalk 仍空；候选未签名；权威 crosswalk 自述不是签名 |
| G3 Sense 绑定决策（注册表 vs KU 锚定） | **BLOCKED** | KU 锚定只是提案，`official_sense_id: null`，待批准 |
| G4 中文等价答案判分实现 | **BLOCKED** | 无实现；只有两份契约（22 用例 + B189 的 24 用例），未合一、未跑应用测试 |
| G5 正式答题 UI 中英分离 | **BLOCKED** | 集成-branch 未变；答题页 e 仍英文数组，中文翻译无槽位 |
| G6 签名版 manifest + SHA 绑定 + fail-closed | **BLOCKED** | 无签名版 Batch93 manifest；runtime manifest 是空包；fail-closed 未跑测试 |
| G7 Overlay 隔离回归测试 | **BLOCKED** | 无测试；当前泄漏风险仅因“无正式通路”而低，非经测试证明 |
| G8 正式展示许可决策 | **BLOCKED** | 无发布负责人签署的许可决策；仅有 staging 级 LOW 处置 |
| G9 正式学习流 E2E | **BLOCKED** | 仅有独立预览页验收；正式流内零证据 |
| G10 人工编辑签字（政策 + 签名） | **BLOCKED** | 政策 UNDECIDED；无签字；p0 先例要求编辑批准 |

**FAIL 与 BLOCKED 的区别（本报告刻意区分）：** 没有一扇门是 FAIL——没有记录是错的、没有泄漏存在、没有测试失败。9 扇 BLOCKED 全部是在等某个责任方的动作（签名、决策、实现），不是在等内容修正。BLOCKED 不是较软的 PASS：它同样禁止发布；它的修复是责任方行动，不是内容修改。

## 1. 身份与 Sense 归属：三份工件三角验证一致，但都不是注册

- **B215 证据**：6 条 ku_id 对锚定 Runtime 精确命中。
- **注册候选（f85e271）**：6 行，rank/词头/词性/ku_type sense/Runtime 中英释义/playable 全部与 Runtime 一致；状态 `CANDIDATE_AWAITING_RUNTIME_REGISTRAR_APPROVAL`，`registration_authority_signed: false`，`production_ready: false`，`release_eligible: false`；Sense 绑定提案为 `KU_ANCHORED_SENSE_BINDING`，`official_sense_id: null`，`authority_approval_required: true`；qa_contract 列出 fail-closed 拒绝条件（SHA 不符、ku_id 缺失/重复、类型非 sense、rank/词头漂移、词性不符、缺注册批准、包 SHA 不符）。
- **权威 crosswalk（da5fb94）**：6 条 `VERIFIED_HISTORICAL_MAPPING`，`CONFLICT: 0`，`EXACT_MATCH: 0`（其术语：Runtime 无 sense/headword 字段可供“精确相等”，故不用 EXACT_MATCH——与本报告的三层区分一致）；`runtime_headword_id: null`（正确地没有从 legacy 复制）；`safe_to_publish_formal_overlay: false`，`release_eligible: false`；authority_statement 明确写：本文件是 QA 验证的映射证据，**不是注册签名，不授权正式发布**。
- **他方门禁报告的对账**：`7bbd69b` 门禁文件的 `BLOCKED_RUNTIME_ROW_NOT_READ` 是那位审核人读不到二进制 Runtime 的证据局限，不是 Runtime 的属性；da5fb94 的抽取与本审核的直接复算仅在**身份证据**上取代它，发布门禁维持关闭（da5fb94 的 supersedes 注记原文亦如此）。

## 2. 独立复算方法与结果（G1 PASS 的全部依据）

方法：从生产分支重新拉取 Runtime gz（SHA 重算 `e91e2ab3…`，与钉住值一致；生产 HEAD 未变 `c7aae5a`），本地解压（20,000 词头），逐行核对候选 6 行的 rank、词头、词头词性、KU 类型（须为 sense）、Runtime 中英释义、playable、包内词头/rank 一致性，以及候选顶层 flags（须为未签名/非正式/不可发布）。脚本见 `b217_identity_recompute.py`，运行结果 exit 0：

- person 108 n. / time 111 n. / know 138 v. / people 142 n. / talk 145 v. / here 153 adv.：**6/6 ALL OK**。
- 候选顶层 flags 诚实：signed false、production_ready false、release_eligible false。

复算通过验证的是**候选内容**，不是注册。候选内容正确 + 无人签字 = G1 PASS、G2 BLOCKED，两者并存，不矛盾。

## 3. 判分实现审计（G4 BLOCKED）：契约有两份，实现为零

- 集成-branch HEAD 仍为 `b99fc35`（自 B215 预览验收后未变）；正式学习流仍为自评式，无打字简答判分代码。
- QA 分支上唯一的判分代码是本审核人上一轮的参考测试（`b216_scoring_reference.test.mjs`，22/22 PASS，QA 工具非应用代码）；另一份是 da5fb94 的 B189 判分契约（24 用例，针对 B189 83 条，非 Batch93）。
- **测试重点的预判（实现后必须跑的向量，契约已覆盖）：** 正确变体（time 的“时间/时长/完成事情所需的时长”、标点空白变体）必须接受；错误近义（time 的“时刻”、here 的“此时”、know 的“认识”、people 的“民族”）必须拒绝；跨 Sense 误判（用姊妹义答案答目标义）必须拒绝；句翻译（“需要更多时间”）不得接受为词义答案；辨识题须 verdict + 理由双条件且理由关键词双语。
- **修复建议：** 主开发先把两份契约合并为一份（B189 的归一化/后缀/撇号规则 + B216 的答案集/填空/辨识题规则），再实现；实现后以合并后的正反向量为验收测试，全部通过方可合入。

## 4. 隔离门禁审计（G7 BLOCKED）：今天不泄漏，但没经测试证明

- 现状核查：预览页仅 2 次 GET、无存储 API、无跳转/登录/写入（B215 预览验收）；App 运行时无任何对 batch93 的引用（B215）；正式 Overlay 工件不存在——因此今天没有泄漏通路，风险 LOW。
- 但门禁要求的是**测试证据**，不是缺席论证：flag-off 无变化、预览不可达 SRS 写路径、渲染后 Runtime 字节不变，三项回归测试一项未跑。通用 overlays 测试文件是 Scene500 会话策略测试（srs/staging/batch93 出现 0 次），不是 Batch93 隔离测试。
- **修复建议：** 正式 Overlay 接线后（而非之前）跑三项回归测试并留存结果；接线前跑只能证明“未接线”，不能证明“接线后隔离”。

## 5. Manifest、许可与 fail-closed（G6/G8 BLOCKED）

- **Manifest：** 无签名版 Batch93 manifest。B216 候选 manifest 未签名（`release_eligible: false`）；`runtime/v1/manifest.json` 描述的是另一个空包（`record_count: 0`、`production_ready_ku_count: 0`、`release_eligible: false`，阻碍 `NO_FULLY_CERTIFIED_KU_IN_REVIEWED_SOURCES`）——manifest 系统自身当前说的就是 0。fail-closed 的**模式**存在（batch76 门禁函数、p0 overlay 构建器“仅批准 KU 输出”、注册候选 qa_contract），但针对 Batch93 Overlay 的 fail-closed **测试运行**不存在。
- **许可：** 无发布负责人签署的正式展示许可决策。现有处置（原创例句、改写释义、事实 IPA、隔离 LOW）只是 staging 级；本审核不替发布负责人批准许可。
- **SHA 绑定：** 绑定值本身无误（Runtime `e91e2ab3…`、包 `21d83151…`、候选包 `f1c927db…` 均已核验），缺的是把绑定值写进签名版 manifest 并经 fail-closed 测试的那一步。

## 6. E2E 与人工签字（G9/G10 BLOCKED）

- **E2E：** 仅有独立预览页验收（6 词可切换、身份按钮 6/6、STAGING_ONLY 门禁齐全）。正式学习流内（真实学习池、SRS 写入、复习调度）零证据；集成-branch 未变，说明正式流代码侧无新增。
- **人工签字政策：** 发布政策**未决定**是否要求人工编辑签字（交接原文：conditional on release policy / UNDECIDED；冻结后政策文件无批准/签字条款）。无任何人工编辑签字存在。最接近的先例是 p0 overlay 构建器：其队列要求 `editorial_checked + reviewer + reviewed_at` 才输出批准 KU——若该模式适用于 Batch93，则签字是强制的且目前缺失；若政策决定不需要签字，则需政策文件明文记载。本审核不把 AI 第二方语义认证（B216）当成人工签字，也不在此替政策做决定。
- **修复建议：** 发布负责人先以文件形式决定签字政策；若要求签字，指定签字人并签署 6 行（可与 G2 注册签名同批，但签字人与注册人身份须分别记录，不得混同）。

## 7. 阻碍清单与修复顺序（按序，全部闭合方可发布）

1. **注册权威签字（G2+G3）：** 指定注册维护人；对 KU 锚定绑定方案做决定（或建 Sense 注册表）；签署 crosswalk 行（schema 升 v1.1 亦可，但须保留旧字段）；随后用复算脚本对提交行重跑。
2. **判分实现（G4+G5）：** 合并两份契约；实现打字简答判分（含正反向量验收）；正式答题 UI 分离 example_en/example_zh（中文翻译槽位）。
3. **Manifest 与 fail-closed（G6）：** 生成签名版 manifest（钉 Runtime SHA + 包 SHA + 批准状态）；跑 fail-closed 测试（SHA 漂移、ku_id 缺失/类型变化时拒绝加载）。
4. **隔离与 E2E（G7+G9）：** 接线后跑隔离回归三项 + 正式流端到端，留存结果。
5. **许可与签字政策（G8+G10）：** 发布负责人签署许可决策；以文件形式决定签字政策，若要求则取得人工签字。

## 8. 最终结论

- **真正满足 PRODUCTION_READY 的 KU 数量：0。**
- **建议：不发布第一批 6 条，维持 STAGING_ONLY。** 内容侧（语义 6/6、身份 6/6、判分契约、候选包）已经就绪；缺的 9 扇门全是责任方动作，不是内容返工。待上述 5 步全部闭合后，本审核可重跑（复算脚本 + 门禁表）并据实更新结论；在此之前，任何把 STAGING_ONLY 改标为 PRODUCTION_READY 的操作都是违规。
- 本报告不签署身份、不批准许可、不授予人工签字效力；三项权力分别属于注册维护人、发布负责人、人工编辑。
