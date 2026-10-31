# PAI Word 27K Sense/KU 原始数据恢复日志（2026-10-31）

恢复身份：独立数据恢复与取证负责人（Muse）。状态：**未认证恢复（UNCERTIFIED_RECOVERY）**——恢复的是原始记录本身，不是语义认证；全部 `semantic_certified=false`、`production_ready=false`，未改正式 Runtime，未改冻结 Rank/Sense Key/Sense ID/KU ID。

## 1. 恢复结果总表（实测数，非审计报告数字）

| 项目 | 目标 | 实际恢复（逐字原始记录） | 来源 |
|---|---|---|---|
| Sense 候选 | 27,471 | **27,471**（唯一 teaching_sense_id 27,471；覆盖 19,995 个 rank/lemma） | 用户 2026-10-30 上传的 `core20k_v95_checkpoint_audit.zip` 内层 V93 全量登记 |
| KU 候选 | 27,501 | **315**（V5–V8 增量 311 + V27 缺口 4；ku_id 唯一 315，315/315 挂到登记 Sense，孤儿 0） | GitHub `tools/core20k_sense_v1/editorial/` 三个文件逐字合并 |
| Batch88 结构候选 | 5,438 | **0**（仅审计 JSON + 分流脚本在仓，5,438 行池文件未找到） | 见 §3 |
| V179 分片（已在仓） | 1,676 | 已在分支（commit e5d55336），与 V93 登记按 rank+lemma+定义重合 924/1,676，其余 752 条为 V179 之后的新编候选 | 分支 `v179_persistence/shards/` |

## 2. 搜索过的来源与实际发现

### 2.1 GitHub TJPAI/pai-word（2026-10-31 核验）
- 分支 `experiment/enlex-v3-production-rebuild-20261030`：上传前 HEAD `e5d55336b45c4d0c314c1ad1eca544cbb2c81634`（V179 9 分片）；核验时最新 HEAD 已变为 `8ef71463dd93ba84f7ca646bff3c72ff0c5af8e2`（2026-10-31 11:28，CG-ENLEX 当日仍在该分支提交 V218–V221，含 Batch90 163 条候选）。上传恢复包前须以最新 HEAD 为准，不得覆盖 CG-ENLEX 当日提交。
- 全仓库 77 个分支（API 2026-10-31 列出）：含 `enlex-v92-v3rc-ledger-qa`（HEAD dfc1cfc2，V94 清单分支）、`core20k-v13-recovery-20261028`（311 增量来源分支）、`ku-clean-*`/`ku-factory-*`（主线 KU 生产线，与 V27 KU 文件不是同一谱系）。
- 历史提交检索：`Batch88` 提交信息 0 命中；`27471/27501` 仅 V31 审计提交 ed3fbaf；Batch88 相关提交仅两件：313c720（分流脚本）与 61b4229（审计 JSON），均不含 5,438 行数据文件。
- V94 清单（enlex-v92 分支）白纸黑字：ZIP/JSONL payload 未上传 GitHub，仅指纹；V28–V34 各审计 JSON 同样写明全量数据在本地可下载 ZIP、GitHub 仅有审计元数据。
- Actions Artifacts：列表 712 个，已与分线核查合计覆盖全部 8 页（本侧 612 个 + 分线最新 200 个，含重叠页；第 2 页曾因未登录 API 限流暂未取回，后由分线补查）。与本次目标直接相关的 live artifact：`core20k-oewn2025-full-source-candidates` 12813992646（21,312,985 B，2026-10-28，OEWN 全量源 Sense 候选）、`core20k-semcor-evidence-v9` 多个（约 5–6.7 MB，SemCor 证据）、`enlex-v98-source-evidence` 12945425804（267,501,203 B，所属 run 结论 failure，内容为冻结的公开词典输入、非 27K 登记）、`core20k-sense-v1-runtime-inventory`（2,272,104 B，反复出现）。**没有**名为 batch88/batch86/v18/v27/v93-register/ku-27501 的 artifact。Artifact 下载需登录授权，未登录 API 只能列名、不能下载——下载其中任何一件都须经浏览器已登录会话，见 §5 后续路径。另：V221 清单（commit 1f55fd73）明文写 **“The complete V29 27471 Sense / 27501 KU archive was not located.”**——CG-ENLEX 当日已在 GitHub 侧找过完整 V29 档案，未找到；本专项的 Sense 全量来源是用户聊天上传的 V95 zip，不是 GitHub。
- 当日新增的 GitHub 原始记录（与本包不同 lineage/有重叠，须在汇报中区分）：HEAD 新增 `coverage/recovered_rank001_500_v179_batch90_candidates.jsonl`（163 行；157 行 sense_key 在 V179 内，6 行为 Batch90 行，sense_key 为 null，新增词头仅 2 个）。
- Releases：0 个（此前核查；本次 API 调用触及未登录限流，未重复宣称）。

### 2.2 Google Drive（2026-10-31 11:34–11:36 独立分线核查，账号 erwu.liu@gmail.com，已连接；只读，未下载/移动/删除/分享）
- **无**可识别为 27,471 Sense、27,501 KU 或 Batch88 5,438 条原始记录的文件：`core20k_v95_checkpoint_audit.zip` 不存在（精确名/含 v95/含 checkpoint/全文/回收站五路 0 命中——该 zip 只在用户聊天上传中出现过，未进 Drive）；`core20k_v34_full_candidate_401_zh.zip` 不存在（此前“Drive 中找不到”的记录重新核实成立）；`27501` 文件名与全文均 0 命中；`27471` 仅在 `core20k_v220_cross_source_join.zip`（23,116 B）内文出现一次；`Batch88/batch88` 文件名、全文、回收站均 0 命中；`5438` 全文命中 3 个文件均为正文子串偶合。
- Drive 上 `name contains 'core20k'` 全量 255 个文件合计约 29.6 MB；版本 ZIP 谱系：v187、v189–v221 共 35 个（缺 v188），**v90–v99、v100–v186 的 ZIP 一个都没有**；v197–v221 除 v221 外全部 <50 KB，均为 editorial_review/reconciliation/risk_queue/patch/evidence_qa/audit 类 QA 小包。
- 唯一原始分片类文件：`source_v179_shards.zip`（216,956 B，MD5 cc141664…，Drive ID 1xl0m3mikwD4wr7kd0lLil3J2wabbrkrY，2026-10-31 02:14 CST，My Drive 根目录，未共享）——其 1,676 条为此前 GitHub 入库核验数，本次 Drive 侧未复数。
- 其余相关大文件均为非原始记录：`core20k_production_identity_registry.json`（10,520,904 B，身份注册表）、`zh-core20k-v0101-scene500-runtime.json`（6,454,987 B，Scene500 Runtime）、`core20k-runtime.json`（2,438,913 B，Runtime 成品）、`core20k_v221_legacy13k_crosswalk.zip`（563,387 B，名示 13K 级 crosswalk，非 27K）。
- v220/v221 两包内容下载尝试：Drive CLI `files download` 只返回 downloadUri、不直接给字节，curl 该 URI 得 403（缺有效 API key），内容未直接验看；按文件名与大小（23 KB join 包、563 KB legacy13k crosswalk）已可排除其为 27K 原始记录，结论不依赖开箱。
- 局限：Drive 元数据只给 MD5、无 SHA256；全文检索对 ZIP 内文索引不完整；仅覆盖已连接账号的 My Drive 与已共享内容，未做 Shared Drive 专项遍历。

### 2.3 本机 workspace
- 唯一的全量 Sense 来源就是用户 2026-10-30 上传的 `~/workspace/user/files/core20k_v95_checkpoint_audit.zip`（外层 SHA 0d35f4de…，内层 V93 zip SHA a298ad5a…，与 V94 清单逐字一致）。
- KU 全量文件指纹 e46e566f…（V28–V34 冻结）在本机 106 个候选 KU/运行时文件逐一比对中**无一命中**；27,186 条基线 KU 的本地 ZIP（`core20k_v18_verified_baseline.zip` 等）不在本机。
- Batch88 池文件 `eligible_structure_pool.jsonl` 与源 ZIP `core20k_batch86_200_content_sense_review.zip` 在本机无文件命中；仅审计 JSON 与分流脚本存在于多个历史工作目录副本中。

### 2.4 tools/core20k_sense_v1/（生产脚本与审计记录）
- 154 个脚本、46 个 workflow 的分支已在 2026-10-30 审计中核查；本次复核 sense_v1 审计 JSON V11–V35：KU 27,501 的构成链为 V18 基线 27,186（cloze 14,222 + definition_recall 12,964；其中 SemCor KU 14,060）→ V26 并入 GitHub V5–V8 增量 311 → 27,497 → V27 补 4 条 attested 缺口 → 27,501。Sense 27,471 的构成链为 V13 工作集 27,156 + V5–V8 311 + V27 4 = 27,471，与登记实测一致。
- Batch88 口径（sense_v1 README + 审计 JSON + 分流脚本三方一致）：5,438 行是 Core13K 旧 KU 池的结构筛选工作集（3,851 词头，442 条带例句，29 条词典抽查），**不是** 27,471 登记的子集，也不是 27,501 KU 文件的子集；L2=0、L3=0。

## 3. 未恢复数据与失败原因

1. **KU 基线 27,186 条**：文件本身从未进 GitHub（V18–V34 审计 JSON 反复声明“full ZIP is local/downloadable, not GitHub”）；本机与 Drive/GitHub Actions 搜索均未见该文件；只有 SHA 指纹（V18 ku_jsonl f519d411…；V28–V34 冻结 e46e566f…）可供日后比对。315 条增量已恢复，其余 27,186 条缺失。
2. **Batch88 池 5,438 条**：池文件只存在于一次对话交付的本地 ZIP（`core20k_batch86_200_content_sense_review.zip`）中，该 ZIP 不在本机、不在 GitHub、不在 Drive 已查范围；GitHub 只有其审计指纹（complete_queue SHA c6041899…、priority SHA 792279a9…）。池行源自 Core13K 旧 KU，与 V93 登记无直接 ID 对应关系，不能用登记“拼出”Batch88。
3. **V28–V34 各版全量 Sense/KU ZIP**（`core20k_v28…v34_*_candidate.zip`）：与 V93 登记仅差中文草稿字段增量（V93 登记已含 V27/V28 两版候选字段，见 zh_candidates）；各版 Sense 文件哈希不同（V28 6b77072c…、V29 eba0803f…、V30 e9887944…、V31 0548bdf4…、V32 3b7bc886…、V33 1e4bd3d2…、V34 2c6fbd78…），但内容主体即 V93 登记，未单独恢复各版不影响 Sense 全量；KU 各版哈希恒为 e46e566f…（KU 文件自 V28 起未变）。

## 4. 验证结果（独立重算，脚本见工作目录 work/validate_recovery.py）

- 登记 27,471 行 / 唯一 teaching_sense_id 27,471 / 唯一 rank 19,995 / 唯一 lemma 19,995；缺失 rank 5 个：11104 acte、12959 officier、13676 courte、16482 everytime、16842 selle（与 V27 审计一致）。
- 双向 Delta：台账 1,020 行唯一 ID，与登记内嵌 `v3rc_editorial_delta` 的 ID 集合精确相等；v93_new99 99 条是台账与登记的子集；p1_remaining 401 条是登记子集、与台账交集 0。
- OEWN 2025（本地 xml.gz，SHA 9ca6d1dc…）：有 synset 的 26,767 行中，按 XML 首个 Definition 归一化比对，定义一致 26,767/26,767；按末个 Definition 计唯一差异 1 条（rural，登记定义与 OEWN 定义不同）；704 行无 synset（编辑/原生行，pos 为空 107 条）。
- POS 共 22 种取值未归一（s 3,176、adj 111、adv 27、null 107 等），与 2026-10-30 审计一致。
- KU 增量 315/315 挂到登记 Sense，孤儿 0，ku_id 唯一 315；render_kind：cloze 221、definition_recall_draft 94。
- V179 1,676 条与 V93 登记按 rank+lemma+定义重合 924 条，752 条为 V179 新编候选（不在 V93 登记中）；V179 逐行 semantic_certified/production_ready 全为 false。
- 分片重组：6 个 Sense 分片按序拼接与原始登记文件逐字节一致（SHA 22b0d24e…）。
- 全部 27,471 行 `sense_selection=PENDING_EDUCATIONAL_REVIEW`，`semantic_certified/production_ready/release_eligible` 全为 false（0 真值）。

## 5. 后续可行的恢复路径（按可行性排序）

1. **用户/CG-ENLEX 提供本地 ZIP**：`core20k_v18_verified_baseline.zip`（27,186 KU 基线）或任一版 `core20k_v27…v34_*_candidate.zip`（内含同版 KU 文件）——拿到后以 KU 指纹 e46e566f…（V28–V34）或 f519d411…（V18）比对，命中即补齐 27,501。这是唯一能逐字恢复 KU 全量的路径。
2. **浏览器已登录会话下载 Actions Artifacts**：`core20k-semcor-evidence-v9`（SemCor 证据，约 5–6.7 MB/件）与 `core20k-oewn2025-full-source-candidates` 12813992646（21.3 MB）——可恢复 SemCor KU 候选 14,060 条的源证据与 OEWN 全量源 Sense，但**不是** V18 的 27,186 条 KU 文件本身；且 definition_recall 脚手架 12,964 条须按 V13 模板重建，属于重建而非原始恢复，须单独标注。
3. **Drive 再查**：若用户 Drive 中存有 `core20k_batch86_200_content_sense_review.zip` 或 v27–v34 ZIP，提供文件 ID 后下载并以 Batch88 审计指纹（c6041899…）比对，命中即补齐 5,438 条。
4. **GitHub Actions Artifacts 第 2 页补查已完成**（本侧 612 个 + 分线最新 200 个合计覆盖全部 712 个的元数据）：无 register/batch88 相关 artifact。剩余动作仅为认证下载并开箱已列出的 `core20k-semcor-evidence-v9` 与 `core20k-oewn2025-full-source-candidates`（见路径 2）。
5. **不建议的路径**：用 27,471 登记 + OEWN/SemCor“拼”出 27,186 KU——拼出的是重建数据，不是原始记录；若日后走这条路，必须另立 `reconstructed/` 目录、不得混入本次 `recovery/` 原始恢复目录，不得冒充原始 SHA。
