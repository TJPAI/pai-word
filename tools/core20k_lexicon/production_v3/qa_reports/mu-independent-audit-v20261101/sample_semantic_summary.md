# Core20K 主动回忆 KU：分层抽样实质性语义审核汇总

- 审核包：`tools/core20k_lexicon/production_v3/qa_reports/active_recall_unified_review_pack_v1/review_pack.jsonl`
- 分支：`experiment/enlex-v3-production-rebuild-20261030`，本地克隆 HEAD `4e8357f82`
- 包 SHA256：`e9b9c158a5563ff6396be66d0993a5a0cd9ef6379c433cf2fd4d578862a68fac`（27,471 行，与 screen1 复核一致）
- 审核方式：逐条人工语义判定（gloss_en 与 gloss_zh 是否对得上、定义是否准确自然、有无重复/过度细分），不是规则扫描
- 判定文件：`work/sample_semantic_audit.jsonl`（624 行，每行 ku_id / lemma / pos / gloss_zh / gloss_en / stratum / verdict / reason）
- 随机抽样种子：`20261101`（Python `random.Random(20261101)`）

## 抽样设计

| 层 | 设计 | 实际 n |
|---|---|---|
| 多义词全量（take 30 / give 26 / run 25 / make 23 / open 23 / play 22 / light 22 / place 20 / set 20 / get 18 / line 18 / have 18 / see 17 / good 17 / cover 17） | 15 个义项最多词头的全部义项 | 316 |
| 随机：ambiguity_review_needed=true（5,285 条总体） | 随机抽 120 | 117（3 条与多义词层重合，按多义词层优先计） |
| 随机：未标记（22,082 条总体） | 随机抽 120 | 120 |
| c_mama：gloss_zh='妈妈' 的全部 | 全量 | 7 |
| c_equalled：lemma='equalled' | 全量 | 1 |
| c_short：gloss_en ≤10 字符（268 条总体） | 随机抽 30 | 28（2 条与多义词层重合） |
| c_dup：同一 lemma+同一 gloss_zh 多条的 111 组（227 行） | 随机抽 20 组 | 35（5 条与多义词层重合） |
| **合计唯一 KU** | | **624** |

## 各层 verdict 统计

| 层 | n | CORRECT | SUSPECT_MISALIGNED | WRONG_DEF | DUPLICATE_SENSE | OVER_SPLIT | RARE_NOT_WORTH_TEACHING | RECOGNITION_ONLY |
|---|---|---|---|---|---|---|---|---|
| poly_take | 30 | 23 | 1 | 1 | 0 | 5 | 0 | 0 |
| poly_give | 26 | 19 | 0 | 0 | 0 | 6 | 1 | 0 |
| poly_run | 25 | 24 | 0 | 0 | 0 | 1 | 0 | 0 |
| poly_make | 23 | 17 | 0 | 0 | 1 | 4 | 1 | 0 |
| poly_open | 23 | 15 | 1 | 2 | 0 | 4 | 1 | 0 |
| poly_play | 22 | 17 | 0 | 0 | 1 | 4 | 0 | 0 |
| poly_light | 22 | 16 | 0 | 0 | 0 | 0 | 6 | 0 |
| poly_place | 20 | 16 | 1 | 1 | 0 | 2 | 0 | 0 |
| poly_set | 20 | 19 | 0 | 0 | 1 | 0 | 0 | 0 |
| poly_get | 18 | 17 | 0 | 0 | 0 | 0 | 1 | 0 |
| poly_line | 18 | 15 | 2 | 0 | 0 | 0 | 1 | 0 |
| poly_have | 18 | 13 | 0 | 0 | 2 | 2 | 1 | 0 |
| poly_see | 17 | 14 | 0 | 0 | 0 | 3 | 0 | 0 |
| poly_good | 17 | 14 | 0 | 0 | 1 | 0 | 0 | 2 |
| poly_cover | 17 | 15 | 0 | 1 | 0 | 1 | 0 | 0 |
| **多义词小计** | **316** | **254 (80.4%)** | **5 (1.6%)** | **5 (1.6%)** | **6 (1.9%)** | **32 (10.1%)** | **12 (3.8%)** | **2 (0.6%)** |
| random_ambiguous | 117 | 93 (79.5%) | 19 (16.2%) | 4 (3.4%) | 0 | 0 | 1 (0.9%) | 0 |
| random_unmarked | 120 | 115 (95.8%) | 4 (3.3%) | 1 (0.8%) | 0 | 0 | 0 | 0 |
| c_mama | 7 | 5 | 2 | 0 | 0 | 0 | 0 | 0 |
| c_equalled | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| c_short_gloss_en | 28 | 26 | 2 | 0 | 0 | 0 | 0 | 0 |
| c_dup_lemma_gloss_zh | 35 | 18 | 0 | 0 | 9 | 8 | 0 | 0 |
| **合计** | **624** | **511 (81.9%)** | **32 (5.1%)** | **11 (1.8%)** | **15 (2.4%)** | **40 (6.4%)** | **13 (2.1%)** | **2 (0.3%)** |

## 错误率估算及依据

以两个随机层为依据（Wilson 95% 置信区间）：

- 未标记层（总体 22,082）：非 CORRECT 5/120 = **4.2%**（CI 1.8%–9.4%）
- 已标记层（总体 5,285）：非 CORRECT 24/117 = **20.5%**（CI 14.2%–28.7%）；其中硬错误（SUSPECT + WRONG_DEF）23/117 = 19.7%（CI 13.5%–27.8%）
- 分层加权外推至全库 27,471 条：**约 2,004 条非 CORRECT（约 7.3%，95% CI 约 1,125–2,883 条）**，其中硬错误约 1,959 条（约 7.1%，CI 约 1,083–2,835 条）。
- 外推假设：两随机层各自代表其总体；多义词层是 15 个词头的普查，不参与外推。**已标记层的错误率约为未标记层的 5 倍，说明 ambiguity 标记确实富集了真问题，但未标记层仍有约 4% 的硬错误，不能直接认定合格。**
- 多义词层：非 CORRECT 62/316 = 19.6%（CI 15.6%–24.4%），但其中硬错误仅 10/316 = 3.2%（CI 1.7%–5.7%）；大头是合并候选（OVER_SPLIT + DUPLICATE = 38/316 = 12.0%，CI 8.9%–16.1%）。即高频多义词的主要问题不是中英错位，而是 WordNet 粒度过细。
- 随机层中 OVER_SPLIT / DUPLICATE 为 0/237：过度细分集中在多义词上，无法从随机抽样外推；522 个 ≥5 义项的词头需定向合并复核，不能只靠随机抽样。

## 最严重的 15 条（逐条）

1. **neglect（n）| 中文“烟斗” | 英文 lack of attention and due care** — SUSPECT_MISALIGNED。中文“烟斗”（pipe）与“疏忽”完全无关，疑似行错位/数据损坏，须溯源修正。
2. **server（n）| 中文“服务器” | 英文 a person whose occupation is to serve at table** — SUSPECT_MISALIGNED。中文是计算机服务器，英文是餐厅侍者，分属两个义项，严重错位。
3. **silent（s）| 中文“妈妈” | 英文 failing to speak or communicate etc. when expected to** — SUSPECT_MISALIGNED。“妈妈”是名词义，英文是“不作声的”；应作“沉默的；不作声的”。
4. **mum（s）| 中文“妈妈” | 英文 failing to speak or communicate etc. when expected to** — SUSPECT_MISALIGNED。同上：mum 此行为形容词义（keep mum），中文误用了名词义。
5. **requirement（n）| 中文“同样地；也如此” | 英文 required activity** — SUSPECT_MISALIGNED。中文“同样地”与“必需的活动”完全无关，严重错位。
6. **equalled（v）| 中文“是” | 英文 be identical or equivalent to** — WRONG_DEF。lemma 字段为过去式（应为原形 equal），且中文“是”过宽，无法锁定该义。
7. **scanned（v）| 中文“扫描” | 英文 examine minutely or intensely** — WRONG_DEF。lemma 字段为屈折形式，应为原形 scan。
8. **withdrawn（v）| 中文“撤退；退出” | 英文 pull back or move away or backward** — WRONG_DEF。lemma 字段为过去分词，应为原形 withdraw。
9. **stripped（v）| 中文“丧失” | 英文 take away possessions from someone** — WRONG_DEF。lemma 字段为过去分词，应为原形 strip。
10. **bookshelves（n）| 中文“书架” | 英文 a shelf on which to keep books** — WRONG_DEF。lemma 字段为复数形式，应为单数 bookshelf。
11. **dryer（adj）| 中文“干的” | 英文 free from liquid or moisture…** — WRONG_DEF。lemma 字段为比较级，应为原形 dry；义项属 dry。
12. **heartbeat（n）| 中文“脉搏” | 英文 the rhythmic contraction and expansion of the arteries…** — SUSPECT_MISALIGNED。英文描述的是动脉搏动（pulse），heartbeat 应为“心跳”。
13. **lid（n）| 中文“盖子” | 英文 either of two folds of skin that can be moved to cover or open the eye** — SUSPECT_MISALIGNED。英文是眼睑，中文“盖子”属容器盖义，应作“眼睑；眼皮”。
14. **open（s）| 中文“无防守的；难以防守的” | 英文 not defended or capable of being defended** — WRONG_DEF。英文自相矛盾、语义混乱，不是可用定义。
15. **take（v）| 中文“拿；带” | 英文 carry out** — WRONG_DEF。英文“carry out”通常解作“执行”，作 take 的定义会误导；该义实为拿走/带走。

次严重（SUSPECT_MISALIGNED，见判定文件）：fog“阴沉”≠雾气、meadow“牧场”≠干草场（应为草地）、thought“思想”≠思考过程、lawfully 英文未表达“合法地”、laboriously“不流畅地”≠费力地、answer（v）“回答”过泛（英文特指应门/接听）、counteract“反对”应为“抵消；对抗”、deputation“代理人”单复数错位（英文为代表团）、fury“发狂”应为“暴怒”、goggle“痴呆着看”用词错误、keen 中文多出“热衷的”、scroll“卷”过泛、honor 中文多出“履行”、viewer“旁观者”应为“观众”、alleyway“偏僻街道”应为“小巷”、possessive“所有的”易读作“全部的”、merge“使一元化”语态错误、ensconce 英文定义不完整。

## 过度细分与重复义项的总体判断

- **这是全库最系统的结构性问题，根源是近乎逐条照搬 WordNet 义项粒度。** 多义词层 12.0% 的义项是合并候选；同 lemma+同 gloss_zh 的 111 组（227 行）抽查 20 组（35 行）中 17 行非 CORRECT（9 条 DUPLICATE_SENSE、8 条 OVER_SPLIT），即这类组里约一半的行是冗余的——按此比例，111 组约 110 行左右可合并或删除（粗估，置信度有限）。
- 典型模式有三类：（1）同义英文定义仅换措辞（如 have #11/#14“拥有；持有”、set #10/#11、childhood、duration、mere、logically）；（2）跨词性同形同释（orange 名词/形容词、link、brush、glimpse、bloom、under），单答案主动回忆根本无法区分，必须合并；（3）仅宾语/目的不同的“go to see”式三分（see #14/#15/#16）、“convey”义群（give #3/#4/#19）、“cause”义群（make #7/#8/#11/#15）。
- **light 是反例**：22 义中 6 条 RARE 但无一条 OVER_SPLIT/DUPLICATE——义项虽多但各有区分，过度细分不是义项数量本身的问题，而是义项间可区分度的问题。
- 建议：对 522 个 ≥5 义项的词头做定向合并复核（以中文释义是否可区分 + 英文定义是否实质不同为准），目标不是把数字清零，而是把“同一中文提示对应多个同词义项”的情况消除；合并时保留义项最宽的一条，删除其余，KU 随之合并。

## 其他专项结论

- **gloss_zh='妈妈'组**：7 条中 5 条 CORRECT（mom/ma/mama/mummy/mamma 均为 mother 的非正式说法，本身正确），2 条错（silent、mum 形容词义误配名词中文）。另注意：即使正确的 5 条，同一中文提示对应 5 个词，在单答案主动回忆中仍无法区分——这是 KU 设计层面的歧义问题，不是释义错位。
- **gloss_en 极短（≤10 字符）**：抽查 28 条中 26 条 CORRECT。短本身不是缺陷：多为同义词/上位词式定义（travel up、make moist、not often），中文准确即合格；仅 merge、ensconce 2 条错位。
- **屈折形式词头（全库精确普查，非抽样外推）**：以 teaching_sense_id 内嵌的 OEWN 词头为基准，全库 26,767 条 OEWN 行中有 98 行 lemma 字段与义项词头不一致，其中 **78 行为真缺陷**（动词过去式/过去分词/动名词、形容词比较级等作词头，如 travelled、scanned、withdrawn、equalled、stronger、easier、deeper；另有 stamina→stamen 词头贴错、résumé→resume、capita→caput），其余 20 行为良性（重音符号变体 9、连字符编码 2、复数作词头的合法词头 8、动名词名词 crying 1）。78/26,767 = 0.29%。注意：随机抽样中恰好抽中 5 条（5/237 = 2.1%）是小概率抽样波动（期望约 0.7 条），不得用 2.1% 外推；78 条是精确计数，清单见附录。
- **POS 与词性表述错位**：SUSPECT 中有一类是中文释义用了另一词性的表述（如 open v“公开的”、place v“地方；地点”、line n“依照规定行事”），修中文即可，不动义项。
- **RECOGNITION_ONLY 仅 2 条**（good 的方言副词义与口语强化义），样本中罕见；不建议据此推断全库比例。
- **CORRECT 的含义边界**：本审核只判定 gloss_en/gloss_zh 对齐与定义质量，不判定单答案唯一性。screen1 已证 2,474 个中文释义对应多个词头（如“妈妈”→7 词、“一致”→12 词），即使释义全对，主动回忆仍可能多答案——那是另一层问题，不在本 verdict 中扣分。

## 仍需人工决策 / 未解决

1. 111 组同 lemma+同 gloss_zh 的合并方案：按组逐条定保留哪一条（本审核只标出抽查 20 组的倾向，余下 91 组未审）。
2. 522 个 ≥5 义项词头的合并复核未做（本层只审了最多的 15 个词头）。
3. 78 条屈折词头缺陷的修正方式：改 lemma 字段为原形即可，但须确认答案词形与 KU 渲染是否联动（有 704 条非 OEWN 行无法用义项 ID 核对词头，可能还藏有同类问题）。
4. neglect“烟斗”、requirement“同样地”两条疑似行错位：须溯源是单条中文写错还是批量错位，若批量错位需扩大排查。
5. 中文释义过宽导致的跨词歧义（2,474 组）是否纳入主动回忆可用性判定，超出本次 gloss 对齐审核范围，需另定规则。

## 附录：78 条屈折/错误词头全清单（lemma 字段 → 义项词头）

wrought→work；dryer→dry；travelled→travel；clove→cleave；slew→slay；signalled→signal；beaten→beat；transferred→transfer；dropped→drop；quitted→quit；stripped→strip；shipped→ship；rang→ring；easier→easy；bedded→bed；chatted→chat；tying→tie；scanned→scan；rode→ride；spotted→spot；mapped→map；struck→strike；scanning→scan；cropped→crop；plotted→plot；labelled→label；popped→pop；sprang→spring；trekking→trek；petted→pet；mapping→map；summed→sum；deeper→deeply；swollen→swell；hugged→hug；embedding→embed；sinned→sin；squatted→squat；chopped→chop；smelt→smell；rigging→rig；equalled→equal；stabbing→stab；transferring→transfer；tripped→trip；nodded→nod；stronger→strong；jammed→jam；canned→can；hung→hang；webbed→web；clipped→clip；overlying→overlie；fanned→fan；shone→shine；fled→flee；swept→sweep；skinned→skin；sank→sink；dragged→drag；topped→top；withdrawn→withdraw；ridden→ride；gummed→gum；rubbed→rub；wetted→wet；fatted→fat；flung→fling；pinned→pin；plugged→plug；mobbed→mob；sunk→sink；wept→weep；squatter→squat；bookshelves→bookshelf；stamina→stamen（词头贴错，中文自标待核）；résumé→resume；capita→caput。
