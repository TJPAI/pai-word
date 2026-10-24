# B216 Batch93 六条教学 KU 权威 Runtime 身份 QA 报告

## 结论（先说清楚三层状态，不要混为一谈）

| 层次 | 结论 |
|---|---|
| 身份映射（本报告解决的问题） | 6/6 VERIFIED_HISTORICAL_MAPPING，CONFLICT 0，BLOCKED 0。7bbd69b 门禁的 `BLOCKED_RUNTIME_ROW_NOT_READ` 证据阻碍已解除：Runtime 行已实际读出并逐条比对。 |
| 正式 Overlay 发布资格 | 仍为 **false**（全部 6 条）。身份通过不等于发布；仍需最终认证门禁（ChatGPT 英文教学线）、注册方背书决定（见下）、主开发部署门禁。 |
| 教学内容认证 | 不在本报告裁决范围。B216 第二方语义认证（另案）为语义层 PASS 6/6、生产批准 0/6；本报告不改变该结论。 |

## 权威来源（实测，非沿用旧值）

- 仓库 TJPAI/pai-word，生产分支 `core20k-lexicon-production-v1`，HEAD `c7aae5a662b2e32843dae8c2473cb7ceab3e0053`（与任务给出的线索一致，已重新拉取核验）。
- 文件 `data/core20k-runtime.json.gz`：712,478 字节，SHA-256 `e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b`，Git blob `56cd4ba51ecc99ce56e4d73c69bae305b68aab5c`。
- 解压 JSON：2,438,913 字节，SHA-256 `fd7f1d82267b1144d139526cf71580f6630c67d2421841b3cba2f1ed2369c145`，schema `pai-core20k-runtime-v1`，release `core20k-unified-mvp-1`，20,000 词头，16,617 KU。
- 教学包 `tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json`：SHA-256 `21d831519abdda34fadef88a601655373750ddf3385ea98d27370cfe2b1eec15`，6 条，`production_ready` 全 false。
- QA 分支 `core20k-teaching-qa-b162-20261024` 检查时 HEAD `66ee1c4fb32e1f53d6485350a9ec3f6d5b030765`；门禁文件提交 `7bbd69bd882091f2f07c7ca0c426780c950c513f`。

## Runtime 真实数据结构（决定了什么能叫“权威身份”）

- 词头行：`[rank, lemma, pos_raw, ipa, kus]`；KU 行：`[ku_id, kind, gloss_zh, gloss_en, playable]`。
- **Runtime 没有 `headword_id` 字段，也没有 `sense_id` 字段**（行是位置数组，不可能有这两个字段）。因此：
  - 旧教学 `headword_id`（如 `core20k:rank:108`）不能说“与 Runtime 的 headword_id 相同”——Runtime 根本没有这个字段。只能说：该编号与 Runtime 行的 rank（108）及词头（person）一致，记为定位符，不冒充字段值。
  - Runtime 的 Sense 身份就是 KU 行本身：`kind=sense` 的 KU 行的 `ku_id`。旧教学 `sense_id`（如 `w_0266_person_s01`）与 Runtime `ku_id`（如 `w_0266_person_ku01`）之间不存在字段级相等，只能做历史对应验证（见下）。
- KU 编号中的 4 位数字**不是 rank**：rank 1 的 out 是 `w_0055`，rank 108 的 person 是 `w_0266`。rank 与 w_ 编号绝不能混用；本报告从未用 rank 推导 w_ 编号，反而用两者独立一致作为证据。
- `compatibility_orphans` 只有 dem、nome 两条，与六词无关。

## 逐条映射结果

| 词头 | 旧 KU ID | Runtime 行 | KU 身份 | Sense 对应 | 状态 |
|---|---|---|---|---|---|
| person | w_0266_person_ku01 | rank 108, pos n., kind sense, 可玩 | 原样存在 | s01→ku01，词干+首义项行+释义等价 | VERIFIED_HISTORICAL_MAPPING |
| time | w_0049_time_ku01 | rank 111, pos n., kind sense, 可玩 | 原样存在 | s01→ku01，同上 | VERIFIED_HISTORICAL_MAPPING |
| know | w_0041_know_ku01 | rank 138, pos v., kind sense, 可玩 | 原样存在 | s01→ku01，同上 | VERIFIED_HISTORICAL_MAPPING |
| people | w_0057_people_ku01 | rank 142, pos n., kind sense, 可玩 | 原样存在 | s01→ku01，同上 | VERIFIED_HISTORICAL_MAPPING |
| talk | w_0139_talk_ku01 | rank 145, pos v., kind sense, 可玩 | 原样存在 | s01→ku01，同上 | VERIFIED_HISTORICAL_MAPPING |
| here | w_0099_here_ku01 | rank 153, pos adv., kind sense, 可玩 | 原样存在 | s01→ku01，同上 | VERIFIED_HISTORICAL_MAPPING |

为什么不是 EXACT_MATCH：EXACT_MATCH 要求 Runtime 字段值与旧字段值完全相等。KU ID 本身确实完全相等，但 Sense 与 Headword 身份在 Runtime 里没有对应字段可供相等——把整体标为 EXACT_MATCH 会虚构一个不存在的字段。VERIFIED_HISTORICAL_MAPPING 是该 Schema 下能达到的最强诚实状态：KU 身份是精确的，Sense 对应是经验证的历史对应（共享 w_ 词干、首个 sense 类行、释义语义等价），且已排除仅凭字符串相似度的可能（见“为什么这不是字符串相似度匹配”）。

为什么这不是字符串相似度匹配：

1. KU ID 是在权威文件中原样找到的字符串，不是算出来的相似项；且所在行的 rank、词头、词头级 POS、KU 类别（sense）与旧记录全部一致。
2. 仅凭释义文本无法定行：同词头下另有行共享释义文本但类别不同（如 person ku02 morphology、time ku03 collocation、know ku03 grammar），本映射用 KU ID + 类别排除它们，不用释义文本定行。
3. w_ 词干是独立于 rank 的旧索引（person 的 0266 ≠ rank 108），它在 Runtime 中原样保留，这一跨文件一致性本身就是历史连续性的证据，而不是相似度猜测。

## 释义与发音差异（已逐条记录，均不构成身份冲突）

- person：英文释义为词序改述（individual human being / human individual），中文逐字一致。
- time：教学中文多“时长”（时间；时长 / 时间），英文 measurable / measured 之差。义项同为“时长/持续时间”；“时长”是否进正式答案，属教学线答案政策问题（B217 已列为 OPEN），不是身份问题。
- know：英文改述（possess information / have knowledge），中文逐字一致。
- people：中文两词换序（人们；人 / 人；人们），英文改述；同义。
- talk：英文仅标点之差（speak or converse / speak/converse），中文逐字一致。发音注意：教学包 /tɑːk/ 与 Runtime /tˈɔk/ 元音不同，IPA 不影响身份，由教学线决定正式版发音值（B216 第二方已按剑桥美音页核过教学包值）。
- here：Runtime 英文释义只写了方位一侧（in this place），旧释义含方向一侧（at or to this place）；中文逐字一致。标准词典处理把 in/at/to 归为同一义项，且 here 下没有独立的方向义项行（ku02 是时间义 at this point），因此这属于 Runtime 释义文本的简写问题，不是身份冲突；若教学线要求方向义单独注册，那是向 Runtime 所有者提的 Schema 问题，本报告不擅自造 Sense ID。

## 结构测试与 QA 脚本结果

- `B216_BATCH93_SIX_KU_IDENTITY_QA.py`（随本批提交）：对 pinned gzip 重算 SHA、解压、6 条计数、旧 KU 唯一性、提取行逐字一致、Crosswalk 每条 ku_id 存在且 rank/词头/POS/类别/释义一致、状态合法、BLOCKED 不可发布规则。实测：**ALL QA PASSED**。
- 20,000 词头身份未动；正式 Runtime、SRS、学习记录、main 均未修改；未生成任何新正式 KU ID 或 Sense ID。

## 仍未解决的阻碍（身份之后的三道门）

1. **注册方背书决定（B217 已提出，仍 OPEN）**：Runtime 所有者须二选一：(a) 建立带稳定 ID 的 Sense 注册表，或 (b) 正式批准“以 kind=sense 的 KU 行为 Sense 锚点”的绑定写法。本 Crosswalk 提供的是 QA 证据，不是注册方签名；不得冒充。
2. **最终认证门禁**：属 ChatGPT 英文教学线，与本身份报告分离。
3. **主开发部署门禁**：含判分实现（含 time 答案政策）、隔离回归、正式 Overlay 清单与 fail-closed 测试；本报告不发布 Overlay。

## 正式发布建议

**不发布正式教学 Overlay。** 身份证据已齐备，可直接交给注册方做背书决定、交给教学线进最终认证门禁、交给主开发做部署验收；三者任一未过，Overlay 保持 STAGING_ONLY，`production_ready` 保持 0。

## 集成说明（可直接转发）

- 给 ChatGPT 英文教学线：六条身份已验（Crosswalk 文件见提交），Sense 字段缺失是 Schema 事实而非本批缺陷；最终认证请按认证门禁独立执行，time 的“时长”答案政策与 talk 的发音取值请一并裁决。
- 给 PAI Word 主开发：Overlay 接入前必须实现 fail-closed 加载校验（每次加载重验 Runtime SHA、ku_id、kind、释义，任一不符即拒绝，不降级、不猜测）；判分实现以 `B189_GRADING_CONTRACT.json` 为准（本批不含判分代码）；在三门禁全过之前，不得把 Staging 内容写入正式学习池或 SRS。
