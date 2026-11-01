# 语境化填空题 130 条实质性审核汇总

- 审核对象：`qa_reports/active_recall_v7_contextual/curated_candidates.jsonl`（16 条）
  + `active_recall_v8_contextual/curated_candidates.jsonl`（30 条）
  + `active_recall_v9_contextual/curated_candidates.jsonl`（30 条）
  + `active_recall_v10_contextual/curated_candidates.jsonl`（54 条），合计 **130 条**，全部为
  `question_format=contextual_cloze_draft`。
- 审核分支：`experiment/enlex-v3-production-rebuild-20261030`，本地克隆 HEAD `4e8357f82`。
- 审核方式：逐条人工语义审核（非仅规则扫描）。每条检查：填空句自然度与语法；
  在“首字母 + 字母数 + 中文义项”三重约束下答案是否唯一（只计常见词）；
  中文义项与句意、与 `gloss_en` 是否一致；是否泄露答案；词形/词性是否与句中用法一致。
- 逐条结果：`work/contextual130_audit.jsonl`（130 行，字段：batch / ku_id / lemma /
  gloss_zh / sentence / verdict / alternative_answers / issue / fix_suggestion）。
  生成脚本：`work/gen_contextual130_audit.py`（只读源文件，ku_id、lemma、gloss_zh、
  sentence 均由程序从源文件原样复制，避免转录错误）。
- 本任务只读：未修改任何 GitHub 文件，未 push，未调用付费 API。

## 一、总体统计

| verdict | 数量 | 占比 |
|---|---|---|
| PASS | 100 | 76.9% |
| NEEDS_FIX | 29 | 22.3% |
| REMOVE | 1 | 0.8% |
| RECOGNITION_ONLY | 0 | 0% |
| **合计** | **130** | **100%** |

分批统计：

| 批次 | 条数 | PASS | NEEDS_FIX | REMOVE |
|---|---|---|---|---|
| V7 | 16 | 9 | 7 | 0 |
| V8 | 30 | 21 | 9 | 0 |
| V9 | 30 | 28 | 2 | 0 |
| V10 | 54 | 42 | 11 | 1 |

说明：V7 的 NEEDS_FIX 率最高（43.8%），主因是高频多义词（left/below/give/see/people/
pay/watch/stay/agree）的义项与句意错位；V9 质量最好（仅 2 条需改）。

## 二、机器预检（审核前已验证，非语义结论）

- 130 条 ku_id 全部唯一；题头“首字母 + 字母数”与 response 全部一致（0 处不符）；
  无重复填空句。
- 4 个 lemma 出现两次，均为不同义项的合法复用：give（V7 提供 / V8 促成）、
  see（V7 认为 / V10 观看）、pay（V7 奉献 / V10 带来收益）、impose（V8 降临于 / 征收）。
- 2 条 pos 字段缺失（null）：anyone（V9，应为代词 pronoun）、amongst（V10，应为介词
  preposition）。两条本题本身判 PASS，缺失只记为元数据问题。
- 其余 128 条 pos 与句中用法一致（含 WordNet 的 s = 卫星形容词，如 left / right /
  leftover / rotten / deceased 的用法无误）。

## 三、问题类型分类（29 条 NEEDS_FIX + 1 条 REMOVE）

### A. 中文义项与句意/义项错位：20 条（最主要问题，占需改条目的 69%）

义项本身是对的词，但中文释义贴错了另一个义项，或句意考的是另一义：

| 条目 | 中文义项 | 句中实际意思 | 建议 |
|---|---|---|---|
| V7 right | 得体的；符合社会规范的 | 道德上的“正确” | 改句为正式场合着装语境 |
| V7 pay | 奉献；致力于 | pay attention = 注意 | 改义项为“付出（注意）” |
| V7 question | 提出一个问题 | question the witness = 审问 | 改义项为“审问；盘问” |
| V7 watch | 观看；观赏 | watch the baby = 照看 | 改句为看电影语境 |
| V8 make | 从事；参与 | make conversation = 交谈 | 改义项为“进行（交谈）” |
| V8 shift | 四处移动 | shift the furniture = 挪动 | 改义项为“移动；挪动” |
| V8 transfer | 四处移动 | transfer the patient = 转送 | 改义项为“转移；转送” |
| V8 bear | 带来收益；产生收入 | bear fruit = 结果子 | 改义项为“结出；产生” |
| V8 revisit | 与……搏斗；抗争 | revisit = 重访 | 改义项为“重访；再访”（疑似串位） |
| V9 crumble | 倒坍 | biscuit crumble = 碎掉 | 改义项为“碎掉；崩碎” |
| V10 state | 提出；呈交 | state reasons = 陈述 | 改义项为“陈述；说明” |
| V10 correct | 得体的；符合社会规范的 | 道德上的“正确” | 同 right，改句 |
| V10 wheel | 使想起；提醒 | wheel the patient = 推病人 | 改义项为“用轮子推”（疑似串位） |
| V10 crumple | 倒坍 | crumple = 起皱；揉皱 | 改义项 + 改句（见下） |
| V10 rotten | 糟糕透顶的 | gone rotten = 腐烂 | 改义项为“腐烂的”或改句为 rotten luck |
| V10 entangle | 使混乱 | entangle a seabird = 缠住 | 改义项为“缠住；使陷入” |
| V10 maltreat | 侮辱 | maltreat = 虐待 | 改义项为“虐待” |
| V10 bide | 居住；暂住 | bide his time = 等待时机 | 改义项为“等待（习语）” |
| V10 bluster | 吹嘘 | bluster = 虚张声势；咆哮 | 改义项为“虚张声势” |
| V10 mistreat | 侮辱 | mistreat = 虐待 | 改义项为“虐待” |

其中 **revisit、wheel、bide 三条属于义项与句意完全无关**（疑似中文释义串入他词），
应优先核查释义来源，不只是改一句中文。

### B. 答案不唯一（存在符合句意 + 首字母 + 字母数的常见替代词）：9 条

| 条目 | 答案 | 替代词 | 备注 |
|---|---|---|---|
| V7 people | people | public | the public = 民众，完全同义 |
| V7 stay | stay | stop（弱） | 英式 stop = 暂住 |
| V7 agree | agree | align | figures do not align 为自然商务英语 |
| V8 emerge | emerge | escape（弱） | escape from its chrysalis 合理 |
| V8 submit | submit | supply | supply their documents 自然 |
| V8 boost | boost | build（弱） | build attendance 为营销常用语 |
| V8 reclaim | reclaim | recover | 追回失物，两者完全同义 |
| V9 unify | unify | unite | unite several teams 自然 |
| V10 crumple | crumple | crumble | 纸一碰就碎，crumble 亦成立（且兼 A 类问题） |

9 条中 3 条为弱替代（stop / escape / build），其余 6 条为强替代。
每条的 fix_suggestion 均给出具体改句；其中 reclaim 一案改句难以彻底区分，
建议接受 recover 为第二答案。

### C. 古义/罕用义导致句式不自然：2 条

- **touch（V10，REMOVE）**：touch = 理解为古义/罕用义，现代英语不说
  “touch the meaning”，见第四节第 1 条。
- **abide（V10，NEEDS_FIX）**：abide = 居住为古义/书面语，现代常用义为“忍受；
  遵守（abide by）”；建议转为 Recognition 或改考 abide by。

## 四、最严重的 10 条

### 1. touch（V10）——REMOVE：古义 + 不自然句式
- 句：I cannot quite ____ the meaning of that argument.（义项：理解；领会）
- 现代英语不说 touch the meaning，应说 grasp the meaning；touch = comprehend
  是 WordNet 古义/罕用义，不值得作为 Core20K 主动回忆项。
- 建议：删除该义项的 Active Recall KU（Sense 降级为 Recognition 并注明古义，
  或整条移除）；如需保留 touch 的主动回忆，改考 touch on 或物理“触摸”义，另立义项。

### 2. revisit（V8）——NEEDS_FIX：义项完全错误
- 句：We hope to ____ the city where we first met.（义项：与……搏斗；抗争）
- 中文义项与 revisit（重访）及句意完全无关，gloss_en “visit again”与之矛盾，
  疑似中文释义串位。改义项为“重访；再访”，并核查释义来源。

### 3. wheel（V10）——NEEDS_FIX：义项完全错误
- 句：A nurse will ____ the patient into the examination room.（义项：使想起；提醒）
- 句意为“用轮椅推病人”，与“使想起；提醒”完全无关，gloss_en
  “wheel somebody or something”亦与之矛盾，疑似串位。改义项为“用轮子推；推送”。

### 4. bide（V10）——NEEDS_FIX：义项完全错误
- 句：He decided to ____ his time until an opportunity arose.（义项：居住；暂住）
- 句中考的是固定习语 bide one’s time（等待时机），与“居住”无关。
  改义项为“等待；静候（bide one’s time：等待时机）”，并注明考习语。

### 5. crumple（V10）——NEEDS_FIX：双重问题
- 句：The old paper began to ____ when touched.（义项：倒坍）
- (1) 答案不唯一：crumble 同样成立（纸一碰就碎）；(2) 义项错误：crumple 本义为
  “起皱；揉皱”，不是“倒坍”。
- 建议：义项改为“起皱；揉皱”，句改为“He ____ the paper into a ball and threw
  it away.”（crumple into a ball 为固定搭配，crumble 不适用）。

### 6. watch（V7）——NEEDS_FIX：高频词义项错位
- 句：Can you ____ the baby while I prepare dinner?（义项：观看；观赏）
- watch the baby 意为“照看孩子”，考的是 look after 义；学习者按“观看”义项
  无法推出本题。改句为“Can you ____ the film with me tonight?”，或将义项改为
  “照看；看护”。

### 7. question（V7）——NEEDS_FIX：义项错位
- 句：The detectives plan to ____ the witness again.（义项：提出一个问题）
- question the witness 意为“审问；盘问证人”，不是“提出一个问题”。
  改义项为“审问；盘问”（gloss_en 同步改为 interrogate）。

### 8. pay（V7）——NEEDS_FIX：义项错位
- 句：Please ____ close attention to the instructions.（义项：奉献；致力于）
- pay attention 意为“注意；留心”，与“奉献；致力于”（dedicate）错位。
  改义项为“付出（注意）；给予（pay attention：注意）”，并注明考固定搭配。

### 9. submit（V8）——NEEDS_FIX：答案不唯一
- 句：Applicants must ____ their documents before the deadline.（义项：提出；呈交）
- supply 同样成立（supply their documents 为自然英语）。改句为
  “Applicants must ____ their applications before the deadline.”

### 10. people（V7）——NEEDS_FIX：答案不唯一
- 句：A democratic government should listen to the ____ it represents.
  （义项：普通民众；大众）
- public 同样成立（the public = 民众），首字母 p、6 字母均符合。
  改句为“The census counts all the ____ living in the country.”

## 五、PASS 但有备注的 22 条（不判错，但需注意）

### 固定搭配/习语框架即提示（4 条）
give（give rise to）、pass（come to pass）、expression（facial expression），
及 V7 的 pay attention（已因义项错位判 NEEDS_FIX）。判定口径：搭配/习语本身即
考查目标，框架提示不视为作弊性泄露；但应在题库中注明“本题考习语/固定搭配”。

### 同义项近义词组：仅凭首字母 + 字母数区分（14 条）
多组近义词共用同一中文义项、且句子可互换，单题内答案唯一，但组内学习者无法
仅凭义项区分词形，教学时应加辨析备注：

- assign / allot（分摊指定，V9-07/25）
- aggravate / exacerbate（使恶化，V9-17/18）
- boast / brag / bluster（吹嘘，V9-19 / V10-39 / V10-49，其中 bluster 已判 NEEDS_FIX）
- unify / merge（使一元化，V9-12/13，其中 unify 已判 NEEDS_FIX）
- legalize / legitimize（使合法，V9-27 / V10-35）
- maybe / perhaps（也许；可能，V10-07/09）
- enormously / hugely（极大地，V10-19/22）
- unresolved / unsolved（未解决的，V10-23/24）

### 语体/罕用备注（4 条）
- evidence（V8，动词“表明”偏正式/罕用，日常多用 support）
- occasion（V10，动词“引起”偏正式/罕用）
- longitudinally（V10，罕用技术副词，14 字母拼写负担大；建议考虑转 Recognition）
- amongst（V10，among 的英式变体，是否单独立项值得商榷）

## 六、与 V11 剩余 5 条的关系

`qa_reports/active_recall_v11_context_qa/remaining_five.jsonl` 的 5 条（issue、
manner、establish、trust、overhaul）已被标记为 `not_unique_answer_ready` /
`recognition_only_until_context_verified`，不在本次 130 条之内，本次未重复
评审。注意：establish 在 V10 有另一义项（制定；设立，V10-11）已判 PASS，
与 V11 的 establish（bring about 义）是不同义项，不冲突。

## 七、仍需人工决策的问题

1. **reclaim / recover（V8-30）**：两者在该句完全同义，改句难以彻底区分；
   接受 recover 为第二答案，还是重写题目？（建议接受为第二答案。）
2. **近义词组共用中文义项**（第五节 8 组）：是否在义项层加辨析（如 assign 分配
   任务 vs allot 分配时间），还是仅靠字母约束区分？（建议加辨析备注。）
3. **古义项去留**：touch（已建议删除）、abide（建议转 Recognition）；
   longitudinally 是否转 Recognition？需拍板。
4. **revisit / wheel / bide 的中文释义串位**：是否系统性核查中文释义来源？
   三条同类错误集中出现，提示释义生成环节可能存在批量串位风险，建议抽查
   其余义项的中英对齐（本次仅审 130 条语境题，未覆盖全库）。
5. **习语题定位**：give rise to、come to pass、pay attention、bide one’s time
   等习语/搭配题，是保留为主动回忆（注明考习语），还是统一转 Recognition？
6. **amongst 单独立项**：作为 among 的英式变体是否值得占一个 Core20K 义项？

## 八、结论

- 130 条中 100 条 PASS（其中 22 条有备注但不判错），29 条 NEEDS_FIX，1 条 REMOVE，
  无 RECOGNITION_ONLY 结论（abide 的转 Recognition 建议写在 fix_suggestion 中，
  未单独成 verdict，因其改句/转认读均可由修订方选择）。
- 主要系统性问题是**中文义项与句意错位（20 条）**，而非句子本身不自然；
  其次是**答案不唯一（9 条）**。填空句的英语自然度总体良好，未发现语法错误句。
- 130 条中无一题因“泄露答案”判错；固定搭配框架提示按习语题口径处理。
- 本次审核为逐条人工语义审核结论，`single_answer_verified` 仍为源文件原值
  false，未改动源文件；修订后需重新验证。
