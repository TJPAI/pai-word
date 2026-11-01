# PAI Word 英文 Core20K｜Muse 全量独立语义审核报告 V2026.11.01

- 审核分支：`experiment/enlex-v3-production-rebuild-20261030`
- 分支 HEAD（本地克隆核验时）：`4e8357f82`（提交信息 "CG-ENLEX isolated release gate audit for 27471 KU"）
- 审核对象：`tools/core20k_lexicon/production_v3/qa_reports/active_recall_unified_review_pack_v1/review_pack.jsonl`
- 审核包 SHA256：`e9b9c158a5563ff6396be66d0993a5a0cd9ef6379c433cf2fd4d578862a68fac`（与包内 `summary.json` 一致，27,471 行）
- 审核身份：Chief Independent Lexicographic Auditor（独立审核，非生产线执行）
- 审核日期：2026-11-01
- 原则：未修改任何正式 Runtime Pack、main 或已有生产文件；全部结论以独立报告与修订候选（patch）形式保存；未调用付费模型 API、未使用付费云资源。

## 0. 结论先行

| 结论 | 数字 / 状态 |
|---|---|
| 审核包真实完整 | 27,471 行，KU ID 与 Sense ID 全部唯一；已有 release gate 脚本在隔离环境重跑，`summary.json` **逐字复现**；`formal_release_eligible = 0` 属实 |
| 英文定义侧基本可信 | `gloss_en` 与 V93 登记 `definition_en` **27,471/27,471 逐字一致**（V93 登记此前已独立验证与 OEWN 首定义一致 26,767/26,767） |
| 中文释义侧是主要风险 | 分层抽样外推：全库约 **7.3% 非正确（约 2,004 条，95% CI 约 1,125–2,883 条）**，其中硬错误（中英错位 / 定义错误）约 7.1% |
| 歧义标记基本属实但覆盖不全 | 5,285 条已标记；另有 **569 条**同中文释义对应多词的记录未被标记；5,150 条英文语义线索的唯一性**全未验证**（`semantic_hint_uniqueness_verified` 全为 false） |
| 本轮可认证 Production Ready | **仅 100 条**（语境填空形式的 130 条中逐条通过的 100 条）；其余 27,371 条**一律不认证** |
| 已确认需修订的 KU（去重并集） | **372 条**（patch A/B/C/D/F + 词性补全 + 语境题需改 + 抽样非正确项，详见 §6） |
| 建议删除候选 | 词头 5 个（法语词 / 非标准拼写）+ 义项若干（见 §6.4） |
| 最大系统性问题 | 中文释义**批量串位**（非零星笔误）：同一批记录里出现 pipe、federal、Union、liberal、overseas 等他词释义；另有 WordNet 粒度过细导致的过度细分 |

**一句话定性**：这是一份结构完整、英文定义有源可依、但中文释义存在成批错位、单答案主动回忆在设计上尚未自洽的草稿包。不能发布；按 §6 修订后需重新抽样复核。

## 1. 审核输入核验

### 1.1 文件与工作流（均以 GitHub 实际文件为准）

- `qa_reports/active_recall_unified_review_pack_v1/review_pack.jsonl`：27,471 行；`summary.json`：total = unique_ku = unique_sense = 27,471；overlay 来源 V2 862 / V3 5,381 / V4 4,963 / V5 187 / V7 16 / V8 30 / V9 30 / V10 54；`release_ready: false`。
- `qa_reports/active_recall_release_gate_v1/summary.json`：`structurally_clean_unverified` 22,082 / `hold_for_review` 5,389 / `ambiguous_prompt` 5,285 / `contextual_cloze_requires_editorial_review` 130 / `explicitly_disabled` 5 / `missing_pos` 107 / `source_semantic_dispute` 3；`formal_release_eligible: 0`。**本审核在 /tmp 隔离副本中重跑 gate 脚本，结果与仓库内 summary.json 逐字一致。**
- `.github/workflows/cg-enlex-active-recall-release-gate.yml`：仅在 gate 脚本或工作流本身变更时触发；脚本内断言 `formal_release_eligible == 0` 且结构检查通过才写报告；工作流本身不做语义判断。**结构检查通过不代表语义准确——脚本注释与 summary 的 policy 字段均已明说，本审核复核确认。**
- V7–V10 链条自洽：原始待处理队列 135 条 → V7 16 + V8 30 + V9 30 + V10 54 = 130 条语境题候选，剩余 5 条即 V11 `remaining_five.jsonl` 的 5 条禁用。130 条在包内 `question_format = contextual_cloze_draft`，与 V7–V10 文件逐条对得上（ku_id 无一缺失、无一多余）。
- 包内每条记录 `draft: true, production_ready: false, release_eligible: false, single_answer_verified: false`（27,471/27,471）。**全库没有任何一条被标记为已验证单答案。**

### 1.2 组成与覆盖

- Sense 来源：OEWN 26,767 条 / editorial（editorial-core20k / editorial-gap / editorial-provisional 等）556 条 / runtime-native 150 条，合计 27,471。
- 词头：19,995 个唯一 lemma，rank 1–20,000 中 **5 个 rank 完全没有 Sense**：11104 `acte`、12959 `officier`、13676 `courte`、16482 `everytime`、16842 `selle`。核对 runtime 词头表，这 5 个在正式 Runtime 中 `ku_count` 同样为 0，且均为法语词或非标准拼写（见 patchE），**不是缺义项，而是垃圾词头，应删除**。
- 每词头义项数：中位数 1；≥5 义项 522 个词头；≥10 义项 84 个；最多 `take` 30、`give` 26、`run` 25、`make` 23、`open` 23。过度细分风险集中在高频多义词（见 §5.2）。

## 2. 全量机器可验证的风险筛查（27,471 条，100% 覆盖）

筛查脚本与原始输出见 `evidence_logs/screen1.txt`、`screen2.txt`、`screen3.txt`、`screen4.txt`、`screen8.txt`、`screen9.txt`、`screen10.txt`。本节只列数字与判定，**规则扫描结果不冒充语义审核**。

| # | 检查项 | 结果 | 判定 |
|---|---|---|---|
| S1 | KU ID / Sense ID 唯一性 | 27,471 / 27,471 唯一 | PASS（结构） |
| S2 | gloss_zh / gloss_en 为空 | 0 / 0 | PASS |
| S3 | question 为空 | 0 | PASS |
| S4 | response = lemma，answer_variants = [lemma] | 27,471 / 27,471 | 结构 PASS；但**单答案从未验证**（single_answer_verified 全 false） |
| S5 | 同一中文释义对应多个词头（精确匹配） | 2,474 个中文释义 → 多词头，涉及 **5,850 条**；最大一组“一致”→ 12 词 | 结构性歧义，见 §5.4 |
| S6 | S5 中已被 ambiguity 标记 | 5,281 条已标记；**569 条未标记（漏标）** | 标记覆盖不全，需补标 |
| S7 | 同词头 + 同中文释义出现多个 Sense | 111 组 / 227 条 | 重复义项候选，见 §4.4 |
| S8 | 词性体系 | WordNet 单字母 n/v/a/s/r 26,729 条；全名 adj/adv/prep/pron/det/conj/interj/modal/abbr 607 条；其他代码 i/p/c/d/expl/combining/prefix 28 条；缺失 107 条 | 三套混用，见 §5.3 |
| S9 | 同一词头同时用 a 与 s（形容词两套代码） | 285 个词头；r 与 adv 并存 4 个词头 | 词性不统一 |
| S10 | 英文释义为占位模板 `core modern learner use of “X”` | **96 条**，全部 runtime-native，其中 95 条同时缺词性 | 无可验证的英文定义，见 patchF |
| S11 | lemma 与义项 ID 内嵌 OEWN 词头不一致 | **98 条**（独立复核与抽样方计数一致） | 77 条需改词头，21 条可保留，见 patchC |
| S12 | gloss_en ≤ 10 字符 | 268 条；抽查 28 条中 26 条正确 | 短本身不是缺陷（多为功能词） |
| S13 | question 文本含词头原词 | 17 条；逐条核查多为缩写括号（WHO/IT/WASP/COD 等），**实质泄露 0 条** | 不构成问题，记录在案 |
| S14 | 187 条 masked hint 中仍含词头 | 3 条（assign / slow / rick：词头出现在引号内未被遮蔽） | 遮蔽失效，需修复 |
| S15 | 4,963 条未遮蔽 hint 的 gloss_en 含词头子串 | 116 条（如 give 的定义 "give or supply"） | 循环定义，线索不能区分 |
| S16 | gloss_zh 含编辑批注（原定义/疑错/词头待核等） | **44 条**（如 firewall、relegation、opossum、stamina、unintentional） | 释义含元评论，需清出并修义项，见 patchB |
| S17 | 语境题题头（首字母 + 字母数） | **130/130 正确**；但存在两种题干模板（“请结合…填写英语单词”与“请根据…填写英文词”） | 题头 PASS；模板需统一 |
| S18 | 同一英文定义对应多个词头 | 3,502 个英文定义 → 多词头 | WordNet 同义词共享 synset 所致；单答案设计需面对，见 §5.4 |
| S19 | gloss_en 与 V93 登记 definition_en 对比 | **27,471/27,471 逐字一致** | 英文定义有源可依（正面结论） |
| S20 | 5,150 条歧义行的英文线索唯一性 | `semantic_hint_uniqueness_verified` **全部为 false** | 线索未验证，不能作为单答案证据 |

### E5 中英相似度全量筛查

### E5 中英相似度全量筛查

方法：本地 multilingual-e5-small（ONNX 量化模型，`~/workspace/e5-model/`，与 Scene500 E5 同款模型），对 27,471 条逐条计算 `cosine("query: " + gloss_zh, "passage: " + gloss_en)`，未调用任何付费 API。完整分数见 `zh_en_sim.jsonl`，脚本见工作目录 `e5_sim.py`。

- 分布：均值 0.840，中位数 0.841，p5 0.791，p1 0.770，最低 0.717，最高 0.938。**分布极窄**：全部 27,471 条都在 0.717–0.938 之间。
- 校准（关键结论）：该分数**不能作为错位 verdict**。已知错例 `neglect`“烟斗”0.766、`silent`“妈妈”0.795、`server`“服务器”0.810，与已知正确例 `mom`“妈妈”0.867、`dog`“狗”0.816 大面积重叠——短中文释义与长英文定义之间的跨语言相似度对“译错”不敏感（同属服务、身体等宽泛语义域即得高分）。
- 但底部分层确有富集：人工核查相似度最低的 60 条，其中 **14 条为已确认的硬错位**（已补入 patchA，使 patchA 从 24 条增至 38 条）：`cope` 压顶砖误作“应对”、`fiddle` 小提琴误作“电影预告片”、`distinct` 不同的误作“集结军队”、`van` 先锋派误作“厢式货车”、`touchdown` 达阵误作“用化学溶液冲洗”、`curry` 咖喱误作“宁愿选择”、`blog` 博客误作“防守队”、`demonstration` 论证误作“车顶”、`capsule` 胶囊误作“官方授权令”、`surf` 冲浪误作“归纳概括”、`distribution` 分销误作“声音刺耳”、`trap` 存水弯误作“雌性动物”、`curve` 曲线球误作“雌性的”、`rave` 狂欢舞会误作“立体声音响设备”。其余约 46 条多为音译/度量衡/专名（比基尼、加仑、石刁柏、大哥大、三月泡等），释义本身正确，只是 E5 不识——底分 ≠ 错。
- 处置：相似度最低 5%（sim < 0.791，**1,373 条**）作为**复核队列**交付（`e5_low_sim_review_queue.jsonl`），标注为 REVIEW_QUEUE_ONLY_NOT_A_VERDICT，不得直接当作错误清单使用。按最低 60 条约 23% 的硬错误率粗估，该队列约含 150–300 条真错位，需人工逐条复核；队列之外仍有错位（如 silent“妈妈”0.795 就在队列之外），**E5 队列不能替代抽样外推**。

## 3. 实质性语义审核：方法

- **分层抽样（624 条）**：15 个义项最多词头的全部义项（316 条）+ ambiguity 已标记层随机 120 条 + 未标记层随机 120 条（种子 `random.Random(20261101)`）+ 定向全量（gloss_zh='妈妈' 7 条、lemma='equalled' 1 条）+ gloss_en ≤10 字符随机 30 条 + 同词头同中文组随机 20 组（35 条）。逐条判定 gloss_en/gloss_zh 对齐与定义质量。判定文件 `sample_semantic_audit.jsonl`，汇总 `sample_semantic_summary.md`。
- **语境题全量（130 条）**：逐条审核填空句自然度、首字母+字母数+中文义项三重约束下的答案唯一性、义项与句意一致性、泄露与词形。判定文件 `contextual130_audit.jsonl`，汇总 `contextual130_summary.md`。
- **107 条缺词性**：逐条核对 ECDICT、runtime 词头表 pos_raw 与释义语义，全部给出建议词性。`pos107_proposals.jsonl`。
- **5 条禁用 + 3 条源争议 + 44 条批注**：逐条核验并给出修订方案。`patchD_disabled_five.jsonl`、`patchB_source_disputes.jsonl`。
- **98 条词头不一致**：以义项 ID 内嵌 OEWN 词头为基准全量普查，逐条分类。`patchC_headword_mismatch98.jsonl`。
- **24 条已确认中文错位**：以记录内中英自相矛盾为证据（如中文“烟斗”对英文 lack of attention），逐条给出正确中文；另有 14 条由 E5 底部分层人工核实补入，合计 38 条。`patchA_confirmed_zh_errors.jsonl`。

## 4. 实质性审核结果

### 4.1 分层抽样 624 条

| 层 | n | CORRECT | 硬错误（错位+定义错） | 合并候选（重复+过度细分） | 罕用 |
|---|---|---|---|---|---|
| 多义词 15 词头（普查） | 316 | 254（80.4%） | 10（3.2%） | 38（12.0%） | 12（3.8%） |
| 随机：已标记层 | 117 | 93（79.5%） | 23（19.7%） | 0 | 1 |
| 随机：未标记层 | 120 | 115（95.8%） | 5（4.2%） | 0 | 0 |
| 定向小层 | 71 | 55 | 7 | 17 | 0 |
| **合计** | **624** | **511（81.9%）** | **43（6.9%）** | **55（8.8%）** | **13（2.1%）** |

**外推（仅以两个随机层为依据，Wilson 95% CI）**：未标记层非正确率 4.2%（CI 1.8%–9.4%）；已标记层非正确率 20.5%（CI 14.2%–28.7%）；分层加权外推全库约 **2,004 条非正确（约 7.3%，CI 约 1,125–2,883 条）**，其中硬错误约 1,959 条（约 7.1%）。**已标记层的错误率约为未标记层的 5 倍**——标记确实富集了真问题，但未标记层仍有约 4% 硬错误，**22,082 条“结构干净”绝不能直接认定合格**。

最严重抽样发现（已逐条写入 patchA / 判定文件）：`neglect` 中文“烟斗”对英文 lack of attention；`server` 中文“服务器”对英文餐厅侍者；`requirement` 中文“同样地”对英文 required activity；`silent`/`mum` 形容词义中文误作“妈妈”；`heartbeat` 中文“脉搏”对英文动脉搏动定义；`lid` 中文“盖子”对英文眼睑定义。

### 4.2 语境题 130 条：100 PASS / 29 NEEDS_FIX / 1 REMOVE

- 问题分类：中文义项与句意/义项错位 **20 条**（最主要问题）；答案不唯一 **9 条**（6 条强替代：people/public、agree/align、submit/supply、reclaim/recover、unify/unite、crumple/crumble；3 条弱替代）；古义/罕用致句式不自然 2 条。
- 最严重：`touch`（"I cannot quite ____ the meaning"——现代英语不说 touch the meaning，古义，**REMOVE**）；`revisit`（句为重访，义项写“与……搏斗”）；`wheel`（句为推病人，义项写“使想起”）；`bide`（句为 bide one's time 等待时机，义项写“居住”）；`watch`（watch the baby 是照看，不是观看）；`question`（question the witness 是审问）；`pay`（pay attention 是注意，不是奉献）；`submit`/`people`（替代词完全成立）。
- PASS 但有备注 22 条：固定搭配题（give rise to、come to pass 等，搭配本身即考查目标，不视为泄露，但应注明考习语）；8 组近义词共用同一中文义项（assign/allot、aggravate/exacerbate、boast/brag/bluster、unify/merge、legalize/legitimize、maybe/perhaps、enormously/hugely、unresolved/unsolved），单题内靠首字母+字母数可区分，但组内学习者无法仅凭义项辨词，**应加辨析备注**。
- 另：语境题中有 2 条缺词性（anyone、amongst），本题判 PASS，词性缺失已计入 §4.3。

### 4.3 107 条缺词性：全部核实，逐条有解

- 12 条有真实英文定义（anyone、everyone、whereas、anybody、ourselves、hey、everybody、whenever、onto、whilst、versus、amongst）：建议词性均为高置信度（pron/conj/interj/prep，ECDICT 与 runtime pos_raw 交叉印证）。
- 95 条英文释义为占位模板（`core modern learner use of "X"`），无可验证的英文定义：词性按中文释义 + ECDICT + runtime pos_raw 建议，**其中 6 条为低置信度**（coli、trans、centerist、yuppy、fro、petit），需先解决拼写/定义问题。
- 2 条建议删除而非补词性：`peter`（人名，非通用词头）与 `versa`（仅是 vice versa 的片段，不是独立词头）。
- 另发现 runtime pos_raw 本身有误：`reseller` 标 adj（应为 n）、`onboard` 标 n（应为 adj）、`mony` 标 n（应为 adj）、`dis` 标 DT（应为 v）、`pre`/`multi` 标 n（应为 prefix）。补词性时不应照抄 runtime。

### 4.4 重复与过度细分

- 同词头 + 同中文释义：111 组 / 227 条。抽查 20 组（35 条）中 17 条非正确（9 条 DUPLICATE_SENSE、8 条 OVER_SPLIT），即这类组里约一半的行是冗余的；按此比例，111 组约 110 行左右可合并或删除（粗估，置信度有限，余下 91 组未逐条审）。
- 典型模式：（1）同义英文定义仅换措辞；（2）跨词性同形同释（如 orange 名词/形容词、link、brush），单答案主动回忆根本无法区分，必须合并；（3）仅宾语/目的不同的三分（如 see 的 "go to see" 式三分、give 的 convey 义群、make 的 cause 义群）。
- 多义词层合并候选 12.0%（38/316），但硬错误仅 3.2%——**高频多义词的主要问题不是中英错位，而是 WordNet 粒度过细**。`light` 是反例：22 义中 6 条罕用但无一条过度细分——义项多本身不是问题，可区分度才是标准。
- 522 个 ≥5 义项的词头需定向合并复核（本次只审了最多的 15 个），不能只靠随机抽样。

### 4.5 词头错误（98 条普查）

- 77 条需改词头为原形：动词过去式/过去分词/动名词（如 travelled、scanned、withdrawn、equalled、stripped、sank）、形容词比较级（dryer、easier、stronger、deeper）、复数作词头（bookshelves→bookshelf）、词头贴错（stamina→stamen、capita→caput、skinned→skin 相关、squatter→squat）。
- 21 条可保留：重音符号变体 9 条（café、cliché、résumé 等）、连字符编码差异 3 条（in-law、vis-à-vis、x-ray）、复数/集合形式作词头合法 8 条（media、criteria、phenomena 等）、动名词名词 1 条（crying）。
- 注意：704 条非 OEWN 行无法用义项 ID 核对词头，可能还藏有同类问题。

### 4.6 5 条禁用与 3 条源争议

| 词头 | 现状 | 建议 |
|---|---|---|
| issue（从……流出） | en "come out of"，定义过弱 | Recognition Only（罕用/古义） |
| manner（种类） | en "a kind"，定义过弱 | Recognition Only |
| establish（促成；引发） | en "bring about"，可被 cause/produce 替代 | **可转语境题**：首字母 e + 9 字母 + 句 "The new policy may ____ rise to unexpected costs."（give 为 4 字母，已排除） |
| trust（委托） | en "confer a trust upon"，法律罕用义 | Recognition Only |
| overhaul（从旁边经过） | en "travel past"，罕用义 | Recognition Only（常用义“彻底检修”另有义项） |
| firewall（最大推力状态） | 英文是油门推满俚语，与防火墙无关 | Remove Candidate（或另立俚语义重写） |
| relegation（授权下属决策） | 英文是 delegation 的定义 | 改英文为 demotion 义 + 中文“降级；降职；贬谪” |
| opossum（澳洲树栖有袋动物） | 英文是 possum 的定义 | 二选一需拍板：词头改 possum，或保留 opossum 重写美洲负鼠定义 |

## 5. 系统性问题诊断

### 5.1 中文释义批量串位（最严重）

证据不是孤立的：`neglect` 7 义中有 3 条中文属于 pipe/federal/Union；`captain` 5 义中有 4 条中文属于 embark/keep mum/silence/fairly；`creation`/`protest`/`rescue`/`conservative`/`impress`/`swallow`/`village`/`weapon` 在相邻 rank（2128–2145）集中错位；语境题中 `revisit`/`wheel`/`bide` 同样串位；抽样中 `server`/`requirement` 同类错误。**形态符合释义生成或合并环节的跨词串位，而非逐条笔误。** 建议：溯源中文释义的生产步骤（按 synset 批量翻译时的排序/键错位是首要怀疑方向），在修复前不要只改已发现的几十条；E5 相似度筛查（§2，E5 节）给出的低分清单应作为下一批复核队列。

### 5.2 WordNet 粒度过细

近乎逐条照搬 WordNet 义项粒度，导致同一中文提示对应同一词头的多个义项（111 组），以及 522 个 ≥5 义项词头的合并债。合并标准应是“中文释义是否可区分 + 英文定义是否实质不同”，保留义项最宽的一条，KU 随之合并。目标不是把义项数压到某个数字，而是消除“同一中文提示对应多个同词义项”。

### 5.3 词性体系三套混用

26,729 条用 WordNet 单字母（n/v/a/s/r），607 条用全名（adj/adv/prep…），28 条用 i/p/c/d 等其他代码，107 条缺失。学习者看到的“词性：s”“词性：r”没有意义；`a` 与 `s` 都是形容词，`r` 与 `adv` 都是副词。建议统一显示为 n / v / adj / adv / prep / pron / det / conj / interj / modal / abbr / prefix，并做一次全库映射（a/s→adj，r→adv，i→prep，p→pron，c→conj，d→det，expl→—）。

### 5.4 单答案主动回忆在设计上尚未自洽

- 同一中文释义对应多个词头是常态：2,474 组 / 5,850 条。即使释义全对，学习者也无法仅凭中文提示锁定唯一答案。
- 5,150 条英文线索的唯一性全未验证；其中 4,963 条是未遮蔽的英文定义原文，116 条的定义本身含有答案词（循环定义）；187 条遮蔽线索中有 3 条遮蔽失效。
- 目前唯一经逐条验证可用的单答案形式是语境填空（130 条中 100 条通过），其有效性依赖首字母 + 字母数 + 句意的三重约束。**建议**：主动回忆默认按“中文 + 英文线索 + 首字母/字母数”或“语境填空”两种可验证形式出题；纯“中文 → 词”形式仅在中文释义全库唯一时使用（当前满足该条件的约 24,036 − 2,474 = 21,562 个中文释义对应 21,621 条，仍需逐条复核唯一性）。

### 5.5 其他

- 96 条占位英文定义：无可验证的英文定义，Sense 本身不可审计，应补写或删除。
- 5 个垃圾词头（法语词 / 非标准拼写）：应从 20,000 词头表中删除或替换，而非补义项。
- 44 条释义含编辑批注：批注本身是好事（说明有人发现了问题），但批注进了面向学习者的 gloss_zh，应移入独立的 review_note 字段。

## 6. 分级结论

分级定义：Production Ready 必须有本轮逐条审核证据；Needs Revision 为已确认需改的条目（去重并集）；Recognition Only 为不适合单答案主动回忆但义项本身可保留认读的条目；Remove Candidate 为建议删除的条目；Unresolved 为本轮无法定论的条目。

### 6.1 Production Ready：100 条

130 条语境题中逐条通过的 100 条（**仅限语境填空形式**；其非语境形式仍在 5,285 条歧义标记内，未认证）。清单见 `contextual130_audit.jsonl`（verdict = PASS）。其余 27,371 条本轮**无一认证**。

### 6.2 Needs Revision：已确认 372 条（去重并集）

| 来源 | 条数 | 文件 |
|---|---|---|
| 已确认中文错位（附正确中文） | 38 | patchA_confirmed_zh_errors.jsonl |
| 源争议与批注义项（可修 11 条 + 未决 5 条） | 16 | patchB_source_disputes.jsonl |
| 词头屈折/贴错（需改词头） | 77 | patchC_headword_mismatch98.jsonl |
| 5 条禁用（4 转认读 + 1 转语境题） | 5 | patchD_disabled_five.jsonl |
| 占位英文定义（需补写定义） | 96 | patchF_placeholder_definitions96.jsonl |
| 缺词性补全（不含 2 条删除） | 105 | pos107_proposals.jsonl |
| 语境题需改 | 29 | contextual130_audit.jsonl |
| 抽样非正确项（去重后新增） | 113 判定行（并集后新增约 101 条） | sample_semantic_audit.jsonl |
| **去重并集** | **372** | — |

另：111 组同词头同中文重复义项（227 条）需逐组合并复核（已抽查 20 组，余 91 组未审）；522 个 ≥5 义项词头需定向合并复核；569 条漏标歧义需补标。

### 6.3 Recognition Only：至少 8 条已确认

5 条禁用中的 issue、manner、trust、overhaul（4 条）+ 语境题 abide（古义“居住”，建议转认读或改考 abide by）+ 抽样中 good 的方言副词义与口语强化义（2 条）+ jellyfish 僧帽水母义（patchB，建议降级认读并加注）。其余候选：longitudinally（语境题备注）、522 词头复核中可能新增。

### 6.4 Remove Candidate

- 词头 5 个：acte、officier、courte、everytime、selle（patchE）。
- 义项：`peter`（人名）、`versa`（vice versa 片段）、语境题 `touch`（古义 "touch the meaning"）、`firewall` 最大推力俚语义（patchB，二选一）。
- 抽样 RARE_NOT_WORTH_TEACHING 13 条为删除/降级候选（以 `light` 22 义中 6 条罕用为代表），需结合词频与教学目标逐条定，不宜批量删除。

### 6.5 Unresolved（本轮无法定论，需人工决策）

1. E5 中英相似度筛查的低分清单复核：最低 5% 共 1,373 条队列待人工逐条复核（见 §2 E5 节；按最低 60 条约 23% 硬错误率粗估，队列约含 150–300 条真错位）。
2. `opossum` 二选一（改词头 possum / 重写美洲负鼠定义）。
3. patchB 中 5 条 UNRESOLVED：snowdrop、prima、topaz、chromatic、voltage（需核对 WordNet synset 后定）。
4. 522 个 ≥5 义项词头的合并复核（只审了 15 个）。
5. 111 组重复义项中余下 91 组的保留方案。
6. `reclaim`/`recover`（语境题）：两者在该句完全同义，接受 recover 为第二答案还是重写题目？
7. 8 组近义词共用中文义项：义项层加辨析备注，还是仅靠字母约束区分？
8. 习语题定位：give rise to、come to pass、pay attention、bide one's time 等，保留为主动回忆（注明考习语）还是统一转 Recognition？
9. `neglect`/`captain` 等串位错误的来源：是单批生产事故还是多批？需 CG-ENLEX 溯源后决定排查范围。
10. 中文释义过宽导致的跨词歧义（2,474 组）是否纳入主动回忆可用性判定，需另定规则。

## 7. 修订前后质量差异

- 修订前（gate 数字）：22,082 条“结构干净未验证” + 5,389 条待复核；单答案验证 0 条；词性缺失 107 条；占位定义 96 条；已确认中文硬错误未修。
- 应用本报告 patch 后（预期，未经复核不得宣称）：38 条已确认中文错位修正；77 条词头修正；107 条词性补全（105 条 + 2 条删除）；96 条占位定义进入补写队列；5 条禁用定性；100 条语境题可进入 Production Ready 候选。
- **不能宣称的**：全库错误率在修订后是多少——外推的约 7.3% 是修订前的估计；修订后需重新抽样（建议同口径再抽 240 条）才能给出修订后的错误率。E5 低分清单复核完成后，错位检出数还会上升。

## 8. 交付清单

本目录（`tools/core20k_lexicon/production_v3/qa_reports/mu-independent-audit-v20261101/`）内全部文件均为新增的独立审核文件，未修改任何生产文件与 Runtime：

| 文件 | 内容 |
|---|---|
| AUDIT_REPORT.md | 本报告 |
| manifest.json | 审核元数据：分支、HEAD、包 SHA、计数、方法 |
| patchA_confirmed_zh_errors.jsonl | 38 条已确认中文错位 + 正确中文 |
| e5_low_sim_review_queue.jsonl | 1,373 条 E5 相似度最低 5% 复核队列（仅队列，非 verdict） |
| patchB_source_disputes.jsonl | 16 条源争议 / 批注义项修订方案 |
| patchC_headword_mismatch98.jsonl | 98 条词头与义项词头不一致（77 改 + 21 保留） |
| patchD_disabled_five.jsonl | 5 条禁用逐条建议 |
| patchE_junk_headwords.jsonl | 5 个垃圾词头删除建议 |
| patchF_placeholder_definitions96.jsonl | 96 条占位英文定义补写队列 |
| pos107_proposals.jsonl | 107 条缺词性逐条建议（105 补 + 2 删） |
| dup_sense_groups.jsonl | 111 组同词头同中文重复义项 |
| contextual130_audit.jsonl / contextual130_summary.md | 130 条语境题逐条审核（100/29/1） |
| sample_semantic_audit.jsonl / sample_semantic_summary.md | 624 条分层抽样逐条审核 |
| zh_en_sim.jsonl | E5 中英相似度全量筛查（见 §2） |
| evidence_logs/screen*.txt | 全量机器筛查原始输出 |

GitHub 提交信息：分支 `experiment/enlex-v3-production-rebuild-20261030`（基线 4e8357f82）；提交 1：`027594950604a12e4d90ab5b8484ae17ba56838d`（新目录根部 16 个文件）；提交 2：`46efc2d4eb86449907b75d8c2679ec8925fb6adf`（evidence_logs/ 8 个文件）。远端回读：独立浅克隆验证 HEAD 为 46efc2d4，目录 24 个文件齐全（见下）。未改任何生产文件，未创建 PR。

## 9. 给 CG-ENLEX 的可复制交接（一句话版，供用户转发）

> 独立审核完成：27,471 条包真实完整，英文定义与 V93 登记逐字一致；中文释义抽样外推约 7.3% 非正确，`neglect`/`captain` 等存在批量串位，E5 全量筛查又确认 14 条串位；仅 100 条语境题可认证 Production Ready；372 条已确认需修订（patch A–F + 词性补全），另有 522 个多义词头与 111 组重复义项待合并复核，E5 最低 5%（1,373 条）为待复核队列；报告与补丁在 `qa_reports/mu-independent-audit-v20261101/`，未动生产文件。
