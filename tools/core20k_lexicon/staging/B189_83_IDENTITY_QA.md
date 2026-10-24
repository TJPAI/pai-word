# B189 83 条 Runtime 身份核验与一致性 QA 报告

## 结论

- 83/83 VERIFIED_HISTORICAL_MAPPING，CONFLICT 0，身份 BLOCKED 0。83 条全部具备**进入最终认证门禁的身份条件**。
- 这不等于最终认证通过，也不等于可部署：最终认证门禁（ChatGPT 英文教学线）与主开发部署门禁仍须分别通过；全部记录 `release_eligible` 保持 false，不自动发布。
- 教学内容本身不改动：本批不重写 83 条已对账文本，只做身份核验。

## 核验输入与权威来源

- 对账文件 `core20k_b189_dual_ai_reconciled_83.json`（Drive id `1wX55A_XpPc17hhcuUvGi6qIgm5MCmIYI`）：83 条，状态 `RECONCILED_STAGING_NOT_CERTIFIED`。Drive 副本已下载比对：与本地规范文件除 CLI 附加的 `retrieved_at` 元数据外完全一致。
- 权威 Runtime：生产分支 `core20k-lexicon-production-v1` HEAD `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`，`data/core20k-runtime.json.gz` SHA-256 `e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b`，blob `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`，20,000 词头 / 16,617 KU。
- 重要来源说明：单独的 ChatGPT 原版 B189 JSON 未在 Drive 上定位到；对账文件由 B188 加任务消息中逐字给出的 ChatGPT extra 新句构建（该来源限制已记入 `B189_HISTORY_ADJUDICATION.json`）。若原版文件出现，须先与对账文件做字节对账再过最终认证门禁。内容风险低，因为唯一变更（extra）已全文引用且经 Muse 独立复核 PASS。

## 逐项核验方法（每条 10 项，脚本可重算）

对每条记录核对：KU ID 在 Runtime 中存在；rank 一致；词头一致；旧 `headword_id` 形式与 rank 一致；中英文释义逐字一致；KU 类别为 sense；playable 为 true；填空代入还原例句；Sense 编号对应（见下）；候选词性与词头级 `pos_raw` 的关系（见下）。

## 结果统计

| 项目 | 数量 |
|---|---|
| 总记录 | 83 |
| VERIFIED_HISTORICAL_MAPPING | 83 |
| EXACT_MATCH（整体状态） | 0（原因见 Sense 说明；KU 身份本身 83/83 精确） |
| CONFLICT | 0 |
| BLOCKED_INSUFFICIENT_EVIDENCE（身份） | 0 |
| KU ID 存在 / rank / 词头 / 释义逐字 / sense 类 / 可玩 / 填空还原 | 83/83（每项） |
| 词头级 `pos_raw` 未含候选词性（已标旗，非冲突） | 2（natural ku03：候选 n.，词头仅 adj.；float ku_s02：候选 n.，词头仅 v.） |

## Sense 身份缺失的安全处理方案（本批的核心判断）

事实：Runtime 没有 `sense_id` 字段；`candidate_sense_id_unverified`（形如 `w_XXXX_lemma_sNN`）是候选侧的未验证编号，**绝不能直接写入正式 Overlay 当作权威 Sense ID**。

已验证的对应关系（83/83）：候选 Sense 编号的数字与 Runtime KU 编号的数字一致（Runtime KU 编号有 `kuNN` 与 `ku_sNN` 两种写法，均按尾数对应），且对应 KU 行类别均为 sense、释义逐字一致。因此：

1. **KU 锚定绑定（工作方案）**：正式 Overlay 如需 Sense 锚点，应以 Runtime 的 `kind=sense` KU 行的 `ku_id` 本身为锚点，并在 Crosswalk/清单中写明该绑定；候选 `sNN` 编号仅作为旧引用保留，不得转正。
2. **Fail-closed 加载**：Overlay 加载时必须重验 Runtime SHA、ku_id、kind、释义，任一不符即拒绝加载，不得降级、不得猜测、不得用旧缓存顶替。
3. **注册方裁决（仍 OPEN）**：按 B217 的二选一，由 Runtime 注册方决定：(a) 建立带稳定 ID 的 Sense 注册表，或 (b) 正式批准 KU 锚定绑定。在裁决前，任何文件不得自称已注册 Sense ID。
4. **门禁定义问题**：若最终认证门禁把“Runtime sense_id 字段相等”列为硬性条件，则在 Schema 变更前没有任何一批能通过——那是门禁定义的修订问题，不是这 83 条的缺陷，应由门禁制定方明确，而非由 QA 侧伪造字段通过。

## 历史警示与判分（摘要，详见配套文件）

- 历史裁决记录：`B189_HISTORY_ADJUDICATION.json`——原始审核历史原样保留，裁决另列字段。已解决：B188 extra 形容词错误（B189 新句修正）、master/chart 修订、touch/quiet 分歧；未解决：Sense 注册裁决、最终认证门禁、部署门禁、原版 B189 字节对账；需人工复核：talk 发音取值、time“时长”答案政策。
- 判分契约：`B189_GRADING_CONTRACT.json`——Muse 只提供契约与 24 个测试用例，判分代码由主开发实现。核心规则：归一化（去空白、NFC、弯引号→直引号、大小写折叠）后必须与标准答案精确相等；屈折/所有格后缀是答案的一部分，词干单独出现必须判错（functions/struck/degrees/master's/academics）；`master's` 的直引号与弯引号等价，但无撇号的 `master`/`masters` 判错；句首 Remote 的大小写差异不判错。

## 结构测试与 QA 脚本结果

- `B189_83_IDENTITY_QA.py`（随本批提交）：重算全部 83 条核验、计数、唯一性、状态一致性与 BLOCKED 不可发布规则。实测：**ALL QA PASSED**（checked 83 records）。
- 判分契约自检：24 个测试用例按契约归一化规则逐条验算，0 不一致。
- 未修改 20,000 词头身份、正式 Runtime、SRS、学习记录、main；未生成新正式 KU/Sense ID；未改动 83 条已对账文本。

## 集成说明（可直接转发）

- 给 ChatGPT 英文教学线：83 条身份条件已齐备，可进最终认证门禁；认证时请注意 Sense 字段缺失是 Schema 事实（见上方案），不要把 `candidate_sense_id_unverified` 当作已验证的 Sense ID 使用；原版 B189 字节对账为门禁前置核对项。
- 给 PAI Word 主开发：部署验收前请按 `B189_GRADING_CONTRACT.json` 实现判分器并跑通 24 个用例（含 master's 撇号等价与词干拒绝用例）；Overlay 加载必须 fail-closed（SHA/ku_id/kind/释义任一不符即拒）；在最终认证与部署门禁全过之前，不得把 Staging 内容写入正式学习池或 SRS。
