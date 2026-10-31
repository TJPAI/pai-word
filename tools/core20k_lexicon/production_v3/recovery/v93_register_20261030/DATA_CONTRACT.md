# 数据契约：PAI Word 27K 恢复包（CG-ENLEX 直接消费版）

- 恢复包 ID：`PAI-WORD-27K-RECOVERY-20261031`
- 建议 GitHub 位置（独立恢复目录，不碰正式 Runtime、不碰 CG-ENLEX 生产文件）：`tools/core20k_lexicon/production_v3/recovery/v93_register_20261030/`
- 状态：**UNCERTIFIED_RECOVERY**——原始记录恢复，未做语义认证；`semantic_certified=0`，`production_ready=false` 全量。CG-ENLEX 的每轮 400 条语义审核可据此恢复，但审核结论须另行记录，不得直接改写本包文件。
- 冻结项：rank、lemma、teaching_sense_id、source_sense_id、synset_id、ku_id 一律不动；合并/拆分只走 `DEPRECATED_MAPPED` / `split-` 后缀映射（另行建表，不改本包）。

## 1. 文件清单

| 文件 | 记录数 | 字节 | SHA256（前 16 位，完整值见 manifest.json） |
|---|---|---|---|
| `shards/senses_001.jsonl` | 5,000 | 4,678,122 | a32ee71e17356e5c… |
| `shards/senses_002.jsonl` | 5,000 | 4,741,121 | 440f41ee14e3d97e… |
| `shards/senses_003.jsonl` | 5,000 | 4,676,737 | e68982d5a13d8f85… |
| `shards/senses_004.jsonl` | 5,000 | 4,707,222 | dd0a7251ff836791… |
| `shards/senses_005.jsonl` | 5,000 | 4,746,976 | 6a05c15f5dcab4f9… |
| `shards/senses_006.jsonl` | 2,471 | 2,296,932 | 70cd94de32b6ed5a… |
| `shards/deltas_001.jsonl` | 1,020 | 388,934 | ed9eeca130fe0ae8… |
| `shards/new99_001.jsonl` | 99 | 35,795 | 6b3e9d4ee4295c5e… |
| `shards/p1_remaining_001.jsonl` | 401 | 354,554 | 63a6b77d4a5b58f0… |
| `shards/ku_increment_001.jsonl` | 315 | 217,278 | 8e7a17c589e063aa… |
| `shards/ku_increment_sense_link.json` | 315（派生映射） | 77,712 | 2913ba4e334886d3… |
| `manifest.json` | — | — | 见文件内各分片条目 |
| `RECOVERY_LOG.md` | — | — | 搜索来源、未恢复项、后续路径 |
| `validation_report.json` | — | — | 独立验证全量数字 |
| `DATA_CONTRACT.md` | — | — | 本文件 |

重组校验：`cat shards/senses_001.jsonl … senses_006.jsonl | sha256sum` 须等于 `22b0d24e0e2e9f8d32c24d23a5a29ea93939cb6bd6969a9678d76f472e5eb2e4`（V93 登记原文件，与 V94 清单一致）。

## 2. Sense 记录 schema（逐字保留的 V93 登记行，JSONL）

每行 25 个键（顺序固定，与源文件一致），示例见源文件首行：

```
teaching_sense_id: "core20k:rank:1::oewn-out__5.00.00.dead.02"   # 稳定 ID，唯一键
headword_id: "core20k:rank:1"
rank: 1            # 冻结词表 rank（1–20000；缺 11104/12959/13676/16482/16842）
lemma: "out"
pos: "s"           # 22 种取值未归一（s/adj/adv/null 等）；null 共 107 行
definition_en: "being out or having grown cold"   # OEWN 2025 定义原文（26,767/26,767 与 OEWN 首个 Definition 一致）
synset_id: "oewn-00100933-s"   # 704 行为空（编辑/原生行）
source_sense_id: "oewn-out__5.00.00.dead.02"
semcor_occurrences: null | int
selection_tier / original_status: 多为 null（历史字段，保留原值）
original_source: "Open English WordNet 2025"
origin_review_status / priority / evidence_tier / production_lane: 历史分流字段，保留原值，不作认证依据
zh_candidates: [] | [{"field": "gloss_zh_v27_editorial_candidate", "value": "…"}]   # 8,025 行有候选，共 9,766 条；字段名 38 种（历史多版本字段并存，无唯一现状字段）
risk_flags: []
sense_selection: "PENDING_EDUCATIONAL_REVIEW"（全量）
internal_semantic_qa: "NOT_PERFORMED"（全量）
muse_review: "PENDING_RC"（全量）
semantic_certified: false（全量）/ production_ready: false（全量）/ release_eligible: false（全量）
v3rc_editorial_delta: <object>（仅 1,020 行，ID 集合与 deltas_001.jsonl 精确相等）
v3rc_editorial_candidate / v3rc_candidate_source_version: 仅 335 行
latest_editorial_version: 仅 104 行
```

## 3. KU 记录 schema（仅恢复的 315 行增量）

- 来源文件：GitHub `tools/core20k_sense_v1/editorial/` 下 `core20k_v5_v8_contextual_ku_20261029.jsonl`（217 行 cloze）、`core20k_v5_v8_definition_fallback_94_20261029.jsonl`（94 行 definition_recall_draft）、`v27_four_attested_gap_ku_20261029.jsonl`（4 行 cloze）。
- 键：`rank, lemma, headword_id?, sense_id, teaching_sense_id, ku_id, render_kind, question, response, source_example_en?, source_sense_definition_en?, gloss_zh?, definition_en?, source, qa_flags, semantic_certified:false, production_ready:false, release_eligible:false`。
- 映射：每行 `teaching_sense_id` 均在 27,471 登记中（315/315，孤儿 0）；`ku_increment_sense_link.json` 为派生映射（ku_id → teaching_sense_id），不是原始文件。
- **未恢复的 KU 基线 27,186 条不在本包中**：其文件指纹为 V18 `f519d411…` / V28–V34 `e46e566f9c541c98a9d72e202145fb0de0acd7c93afca45699eefd16fbe6d2f3`，待用户/CG-ENLEX 提供本地 ZIP 后以该指纹比对补入（另立 `shards/ku_baseline_001.jsonl` 起的分片，不得改写现有分片）。

## 4. Sense–KU 映射关系（本包实测）

- 登记 Sense 27,471 ↔ 已恢复 KU 315：1 个 Sense 至多 1 条已恢复 KU（本包内）；其余 Sense 的 KU 在未恢复的 27,186 条基线中，按 V18 口径为 27,126 个 Sense 各 1 条 KU + 30 个 Sense 各 2 条 KU（该口径来自审计 JSON，基线文件未到手前不得当作本包事实引用）。
- Batch88 5,438 条与本包无 ID 级映射关系（它是 Core13K 旧 KU 池工作集，见 RECOVERY_LOG.md §2.4）；不得用本包 Sense/KU 行数去“凑”Batch88。

## 5. CG-ENLEX 消费方式

```sh
# 1. 取分片并验哈希（与 manifest.json 对照）
# 2. 重组登记
cat shards/senses_001.jsonl shards/senses_002.jsonl shards/senses_003.jsonl \
    shards/senses_004.jsonl shards/senses_005.jsonl shards/senses_006.jsonl \
    > all_27471_v3rc_working_register.jsonl
sha256sum all_27471_v3rc_working_register.jsonl
# 须得 22b0d24e0e2e9f8d32c24d23a5a29ea93939cb6bd6969a9678d76f472e5eb2e4
# 3. 双向校验：deltas_001.jsonl 的 ID 集合 == 登记中含 v3rc_editorial_delta 的 ID 集合（1,020）
# 4. KU 增量按 ku_id 唯一、teaching_sense_id 外键校验（315/315 已验）
# 5. 语义审核结果写新文件/新 Delta，不得原地改写本包分片；审核通过的条目另行登记，不得把本包任何行的 semantic_certified 改为 true
```

## 6. 已知局限（消费前必读）

- 中文候选字段多版本并存（`gloss_zh_v27/v28/v29/v30…`），无唯一现状 `gloss_zh` 字段；8,025 行有候选、19,446 行无候选。
- POS 未归一（22 种取值）；704 行无 synset；5 个 rank 缺失（acte/officier/courte/everytime/selle）；定义 <5 词 5,296 行（2026-10-30 审计实测）。
- V179 1,676 条中有 752 条不在本包登记中（V179 为后续新编候选），消费时不得把 V179 当作 V93 的子集。
- 本包不含 Batch88 池、不含 KU 基线 27,186 条；任何“27,501 KU 已恢复”的说法都是错误的——实际恢复 KU 为 315 条。
