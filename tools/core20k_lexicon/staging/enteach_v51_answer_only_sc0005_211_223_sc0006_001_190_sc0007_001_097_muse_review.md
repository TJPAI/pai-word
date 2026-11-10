# V51 答案型 KU 独立复审（MU-ENTEACH）【校准版】：SC50-0005 ranks 211–223 + SC50-0006 ranks 1–190 + SC50-0007 ranks 1–97

评审方：MU-ENTEACH（英文词库教学线-配合）。评审日期：2026-11-10。
教学分支：`answer-enrichment-main-dev-20261026`，钉住 HEAD `4bf067b14e1ee020ba6bb156b78aa5c921152f70`。
源 CSV：集成分支 `cg-main-fourline-integration-20261026` 的 `tools/integration/scene1341-ranked/v51-ranked.csv`，blob `eaa6d729bb04a9bedbafd8e1081a11fc791caa39`，2,038 行（10 场景）。

> **校准版**：本文件为原版合并结果的口径校准版。按统一校准标准逐条重判 90 条原 REVISE：翻回 PASS 70 条、维持 REVISE 20 条；总计数 PASS 210→280、REVISE 90→20；210 条原 PASS 一条未动。原版两文件未作任何改动。校准标准与判例见第 6 节；每条改判理由见补丁清单 `enteach_v51_300_calibration_patch.json`。

## 1. 范围与锚点

| # | 作者包 | 场景 / ranks | 条数 | KU 范围 | Git blob |
|---|---|---|---|---|---|
| 1 | `scene1341-v51-sc0005-answer-only-211-223.v2.json` | SC50-0005 211–223 | 13 | SC1341-KU-01033–SC1341-KU-01045 | `ac6c17468c41af7fc834e763d554a07ddbaac867` |
| 2 | `scene1341-v51-sc0006-answer-only-001-037.v2.json` | SC50-0006 1–37 | 37 | SC1341-KU-01046–SC1341-KU-01082 | `05e7612586d283977a03bbaa536ae1a25790c0dc` |
| 3 | `scene1341-v51-sc0006-answer-only-038-087.v2.json` | SC50-0006 38–87 | 50 | SC1341-KU-01083–SC1341-KU-01132 | `2d133bf2ff5b762ba59255015974af0cc244c2c9` |
| 4 | `scene1341-v51-sc0006-answer-only-088-137.v2.json` | SC50-0006 88–137 | 50 | SC1341-KU-01133–SC1341-KU-01182 | `13843e9b20f00702e3c9634be3923943acbc9e0a` |
| 5 | `scene1341-v51-sc0006-answer-only-138-187.v2.json` | SC50-0006 138–187 | 50 | SC1341-KU-01183–SC1341-KU-01232 | `efe2b644fe17e1b7f7035e403c279f00d71f242a` |
| 6 | `scene1341-v51-sc0006-answer-only-188-190.v2.json` | SC50-0006 188–190 | 3 | SC1341-KU-01233–SC1341-KU-01235 | `48434aae60a4b18cd3ce977934b3c091abccadba` |
| 7 | `scene1341-v51-sc0007-answer-only-001-047.v2.json` | SC50-0007 1–47 | 47 | SC1341-KU-01236–SC1341-KU-01282 | `df1e062106f13a580993d4eb0918006a83474175` |
| 8 | `scene1341-v51-sc0007-answer-only-048-097.v2.json` | SC50-0007 48–97 | 50 | SC1341-KU-01283–SC1341-KU-01332 | `d3cc4d9f87a68871c525cfb2ed55c4295f2aea74` |

审 300 条：SC1341-KU-01033–01332，连续无重复无遗漏。远端教学分支后续新包（SC50-0007 ranks 98 起、SC50-0008）不在本轮范围。

## 2. 总计数

**PASS 280 / REVISE 20 / HOLD 0，共 300 条。**（原版第一轮：PASS 210 / REVISE 90 / HOLD 0。）

| 组 | KU 范围 | PASS | REVISE | HOLD |
|---|---|---|---|---|
| G1 | SC1341-KU-01033–SC1341-KU-01082 | 47 | 3 | 0 |
| G2 | SC1341-KU-01083–SC1341-KU-01132 | 44 | 6 | 0 |
| G3 | SC1341-KU-01133–SC1341-KU-01182 | 48 | 2 | 0 |
| G4 | SC1341-KU-01183–SC1341-KU-01232 | 48 | 2 | 0 |
| G5 | SC1341-KU-01233–SC1341-KU-01282 | 47 | 3 | 0 |
| G6 | SC1341-KU-01283–SC1341-KU-01332 | 46 | 4 | 0 |

| 范围 | 条数 | PASS | REVISE | HOLD |
|---|---|---|---|---|
| SC50-0005 ranks 211–223 | 13 | 11 | 2 | 0 |
| SC50-0006 ranks 1–190 | 190 | 176 | 14 | 0 |
| SC50-0007 ranks 1–97 | 97 | 93 | 4 | 0 |

## 3. 口径

- 六组评审员并行盲判：每组只凭作者包 + 源 CSV，不读 Issue #1/#2 评论、不读 CG-QA 分支与总账、不读 MU-QA 的任何 verdicts；非盲审对作者（作者 CG-ENTEACH），审者之间、审者对其他线 verdicts 保持盲。
- 逐条判读：身份绑定六字段（expression、sense_zh、scene_id、rank、sense_id、tier）对源 CSV 重算（scene_id + rank 复合键，CSV 首列去 BOM），任一不符即不能 PASS；example_en 自然贴合释义、example_zh 忠实自然、collocations 须为真实搭配（不能是同义词或复合词本身）、usage/contrast 注真实且在范围内、meaning_zh == sense_zh、display 与 answer 一致、无任何题目字段。
- 协调者独立复核：300 条 KU 连续性、每组计数相加、批准列表长度、REVISE 明细一致性均已核对；身份六字段由协调者对源 CSV 独立重算，**300/300 一致，0 不符**。
- 结论是 Muse 教学线独立判断，**不是双 AI 认证**；flags 全 false（activation_allowed / production_ready / publishable 均为 0）；未发布；内容 PASS 不等于源身份已认证。

## 4. REVISE 明细（校准后 20 条）

原版 90 条 REVISE 经校准：70 条翻回 PASS（理由见补丁清单），20 条维持 REVISE（原问题与拟议修正照录如下）。

### G1（3 条）

- **SC1341-KU-01035**（separate delicate clothes，SC50-0005 rank 213）：搭配栏两条均非该表达的真实搭配：第一条即表达本身，第二条 sort delicates separately 是同义动词短语（sort≈separate），未包含 separate/delicate clothes 任一成分，整栏未展示该表达的用法。
  拟议修正：collocations 改为 ["separate lights from darks", "separate delicates from heavy items"]，例句与用法注不变。
- **SC1341-KU-01041**（fix an appliance，SC50-0005 rank 219）：搭配栏两条均非该表达的真实搭配：第一条即表达本身，第二条 repair a household appliance 是同义替换（repair≈fix），未包含 fix/appliance 任一成分，整栏未展示该表达的用法。
  拟议修正：collocations 改为 ["fix a broken appliance", "get an appliance fixed"]，例句与用法注不变。
- **SC1341-KU-01065**（hang clothes to dry，SC50-0006 rank 20）：usage_note 整句只是来源说明（“该表达是来源中的场景补缺候选，尚待独立审核”），没有任何用法指导，缺失用法注；另该行源为 editorial_gap_candidate。
  拟议修正：usage_note 改为“hang clothes to dry指把洗好的衣服挂起来自然晾干，适用于不宜机烘的衣物。”，display.x 同步更新；来源状态不写入学习内容。

### G2（6 条）

- **SC1341-KU-01101**（socks，SC50-0006 rank 56）：example_en 用单数 'one sock'，词头复数 'socks' 未在例句中出现，例句未示范词头形式。
  拟议修正：example_en 改为 'I always lose socks when I do the laundry.'；example_zh 改为 '每次洗衣服，我总会丢袜子。'
- **SC1341-KU-01106**（bath towels，SC50-0006 rank 61）：example_en 措辞不自然：'once they're ready for laundry'（浴巾不会“准备好去洗”），英语母语者不这么说。
  拟议修正：example_en 改为 'I wash the bath towels once a week.'；example_zh 改为 '我每周洗一次浴巾。'
- **SC1341-KU-01118**（fabric，SC50-0006 rank 73）：collocation 'wash a fabric' 不自然：fabric 作材料通常不可数，'wash a fabric' 不符合习惯用法，且与 usage_note“泛指材料”自相矛盾。
  拟议修正：把 collocations 第二项改为 'wash the fabric'。
- **SC1341-KU-01120**（zipper，SC50-0006 rank 75）：example_en 示范的是动词短语 'zip up'（本身是另一条 KU-01131 的内容），词头名词 'zipper' 未在例句中出现。
  拟议修正：example_en 改为 'The zipper on my jacket is stuck.'；example_zh 改为 '我夹克的拉链卡住了。'
- **SC1341-KU-01128**（check the pockets，SC50-0006 rank 83）：collocations 第一项就是表达式本身 'check the pockets'，不是搭配。
  拟议修正：把 collocations 第一项改为 'check the pockets before washing'（保留 'check all pockets'）。
- **SC1341-KU-01131**（zip up jackets，SC50-0006 rank 86）：两条 collocations 'zip up jackets'/'zip up a jacket' 只是表达式本身的复数/单数形式，均不是搭配。
  拟议修正：collocations 改为 ['zip up your coat', 'zip up a jacket before washing']。

### G3（2 条）

- **SC1341-KU-01158**（pair up socks，SC50-0006 rank 113）：第二搭配 "match and pair socks" 不成立：match 与 pair 同义叠加，且包含词头核心词 pair，实为词头本身改写，不是独立真实搭配。
  拟议修正：collocations 改为 ["pair up socks", "match the socks"]；display.c 同步改为 "pair up socks · match the socks"。
- **SC1341-KU-01177**（wrinkled，SC50-0006 rank 132）：usage_note "wrinkled指多处起皱" 不准确：wrinkled 不要求多处起皱，一处褶皱亦可称 wrinkled，"多处" 属过度限定。
  拟议修正：usage_note 改为 "wrinkled指衣物表面出现皱褶。"；display.x 同步改为 "wrinkled指衣物表面出现皱褶。"。

### G4（2 条）

- **SC1341-KU-01210**（drainage problem，SC50-0006 rank 165）：搭配栏首项“drainage problem”就是词条本身，不是搭配，属无效重复；第二项“washer drainage problem”有效。例句“The washer isn't draining properly because of a drainage problem”用“排水故障”解释“排不干净”，同义循环，示例价值弱。
  拟议修正：把搭配栏首项“drainage problem”改为“fix a drainage problem”，display.c 同步改为“fix a drainage problem · washer drainage problem”；例句改为“The washer stopped mid-cycle because of a drainage problem.”，中文例句改为“洗衣机因排水故障中途停机了。”，display.e 同步改。
- **SC1341-KU-01231**（remove clothes promptly，SC50-0006 rank 186）：搭配栏首项“remove clothes promptly”就是词条本身，不是搭配，属无效重复；第二项“remove laundry promptly”有效。
  拟议修正：把搭配栏首项“remove clothes promptly”改为“remove clothes promptly after washing”，display.c 同步改为“remove clothes promptly after washing · remove laundry promptly”。

### G5（3 条）

- **SC1341-KU-01233**（rewash a smelly load，SC50-0006 rank 188）：collocations 第 1 条与 expression 逐字重复（rewash a smelly load），不是搭配；usage_note 后半句“异味衣物应先查找原因”是洗衣建议而非该表达的用法说明，超出用法注范围。
  拟议修正：将 collocations 第 1 条改为 “rewash smelly clothes”；usage_note 改为 “rewash 表示重洗，常用于衣物洗后仍有异味或污渍时。”；display.c 同步更新。
- **SC1341-KU-01234**（color bleed，SC50-0006 rank 189）：usage_note 末句“属待独立审核补缺候选”是制作端元信息，不是学习者用法说明，不应出现在答案内容中。
  拟议修正：删除 usage_note 末句，改为 “color bleed 为衣物染料转移或掉色的表达，常见于深色衣物混洗时。”；display.x 同步更新。
- **SC1341-KU-01235**（take the laundry out，SC50-0006 rank 190）：collocations 第 1 条与 expression 逐字重复（take the laundry out），不是搭配；usage_note 末句“此源项是待独立审核增补候选”是制作端元信息，不应出现在答案内容中。
  拟议修正：将 collocations 第 1 条改为 “take the laundry out promptly”；usage_note 删除末句，改为 “take out 表示从洗衣机中取出，强调洗衣程序结束后及时取出。”；display.c、display.x 同步更新。

### G6（4 条）

- **SC1341-KU-01285**（kitchen counter，SC50-0007 rank 50）：搭配“clean kitchen counter”在动词短语中缺冠词 the，与同条“wipe the kitchen counter”不一致，学习者易写出 *I clean kitchen counter。
  拟议修正：把搭配改为“clean the kitchen counter”，并同步更新 display.c。
- **SC1341-KU-01304**（nonstick pan，SC50-0007 rank 69）：两个搭配均无效：第一项“nonstick pan”就是词条本身；第二项“nonstick frying pan”是同义复合词（不粘煎锅），不是与 nonstick pan 的搭配。
  拟议修正：把搭配改为“cook in a nonstick pan”和“heat a nonstick pan”，并同步更新 display.c。
- **SC1341-KU-01323**（write a shopping list，SC50-0007 rank 88）：搭配第一项“write a shopping list”就是词条本身，不是搭配。
  拟议修正：把搭配第一项改为“write a shopping list for the week”，并同步更新 display.c。
- **SC1341-KU-01326**（gather the ingredients，SC50-0007 rank 91）：搭配第一项“gather the ingredients”就是词条本身，不是搭配。
  拟议修正：把搭配第一项改为“gather the ingredients for the recipe”，并同步更新 display.c。

## 5. 编辑行单列（7 条，源 CSV source 列非 original_master）

照常判读；内容 PASS 不等于源身份已认证；均无 source_master_row，待 CG-MASTER / 独立 QA 验证。

| KU | 场景 / rank | 表达 | source | 结论 | decision_note |
|---|---|---|---|---|---|
| SC1341-KU-01043 | SC50-0005 rank 221 | divide up the chores | editorial_gap_candidate | PASS | Original candidate retained for scene vocabulary inventory |
| SC1341-KU-01044 | SC50-0005 rank 222 | keep up with housework | editorial_gap_candidate | PASS | Original candidate retained for scene vocabulary inventory |
| SC1341-KU-01045 | SC50-0005 rank 223 | do the housework | editorial_addition | PASS | New scene gap candidate, requires independent validation |
| SC1341-KU-01065 | SC50-0006 rank 20 | hang clothes to dry | editorial_gap_candidate | REVISE | Original candidate retained for scene vocabulary inventory |
| SC1341-KU-01066 | SC50-0006 rank 21 | laundry detergent | editorial_addition | PASS | New scene gap candidate, requires independent validation |
| SC1341-KU-01234 | SC50-0006 rank 189 | color bleed | editorial_gap_candidate | REVISE | Original candidate retained for scene vocabulary inventory |
| SC1341-KU-01235 | SC50-0006 rank 190 | take the laundry out | editorial_addition | REVISE | New scene gap candidate, requires independent validation |

其中：editorial_gap_candidate 4 条（01043、01044、01065、01234），editorial_addition 3 条（01045、01066、01235）。
另注意：01065（editorial_gap_candidate）的 usage_note 整句为来源说明、无用法指导，已判 REVISE；01043、01044、01045、01066 四条的 usage_note 尾部带“待核验/待独立验收”来源标记，内容本身判 PASS，建议发布前从学习面 display.x 中剥离该标记、来源状态改由元数据承载；01234、01235 的 usage_note 同样含制作端元信息，已判 REVISE。

## 6. 口径校准（已执行）

### 校准标准

- `collocations[0]` 与 expression 逐字重复本身只是冗余格式，**不是 defect**，前提是搭配栏中至少另有一条真实搭配：能提供真实用法扩展（如动词+宾语扩展、介词扩展、增加信息的定语/名词组合），而不是头词同义词、头词复合词、表达本身的单复数变体、不增加信息的同义改写。
- **维持 REVISE** 当且仅当满足以下任一：（a）整个搭配栏没有一条真实搭配（全是自重复/同义词/复合词/单复数变体）；（b）存在其他真实缺陷：例句未出现头词、例句不自然或同义循环、例句与释义脱节、译文不忠实、usage_note 失实/过度限定/含有制作端元信息（如“待独立审核”“补缺候选”之类不该给学习者看的话）、meaning_zh 不等于 sense_zh、搭配不自然或域外、身份绑定不符。
- 每条维持的 REVISE 仍写清具体问题与拟议修正（见第 4 节）；每条翻回 PASS 的理由见补丁清单。

### 判例依据

本聊已亲自从前 1,032 条（KU-00001–01032，同一作者模板）算出：**454 条**存在 `collocations[0]==expression` 结构，其中本聊先前 verdict 为 **PASS 443 / REVISE 11**。该结构是作者贯穿各场景的固定格式，不是新 defect。本判例即为校准依据。

### 执行结果

| 组 | 原 REVISE | 翻回 PASS | 维持 REVISE |
|---|---|---|---|
| G1 | 3 | 0 | 3 |
| G2 | 17 | 11 | 6 |
| G3 | 2 | 0 | 2 |
| G4 | 37 | 35 | 2 |
| G5 | 12 | 9 | 3 |
| G6 | 19 | 15 | 4 |

合计：90 条原 REVISE 中，**翻回 PASS 70 条、维持 REVISE 20 条**；210 条原 PASS 一条未动。校准后总计数 **PASS 280 / REVISE 20 / HOLD 0**。

补充：144 条 `collocations[0]==expression` 结构记录中，原判 PASS 62 / REVISE 82；82 条带此结构的原 REVISE 中 69 条翻回、13 条维持；另 8 条原 REVISE 本无此结构（G2 的 01101、01106、01118、01120，G3 的 01177，G5 的 01234，G6 的 01285、01310），其中仅 01310 翻回（第二条“reheat in the microwave”为真实搭配），其余 7 条维持。

维持 REVISE 的 20 条按原因分：整栏无真实搭配 10 条（01035、01041、01128、01131、01158、01231、01233、01304、01323、01326）；例句问题 4 条（01101、01106、01120 头词未出现或不自然，01210 同义循环）；usage_note 制作端元信息或失实 4 条（01065、01177、01234、01235，01233 的 usage_note 超范围为次要原因）；搭配不自然 2 条（01118、01285）。翻回 PASS 的 70 条均满足“首项冗余 + 另一条真实搭配”，且无其他真实缺陷。

执行方式：逐条重读 90 条 REVISE 的完整包记录 + 对应源 CSV 行（scene_id + rank 复合键）；不读 Issue #1/#2 任何评论，不读 CG-QA 分支/总账，不读 MU-QA 的任何 verdicts。

## 7. PASS 批准列表（280 条，供 CG-MAIN 的 SRS 门禁）

SC1341-KU-01033, SC1341-KU-01034, SC1341-KU-01036, SC1341-KU-01037, SC1341-KU-01038, SC1341-KU-01039, SC1341-KU-01040, SC1341-KU-01042, SC1341-KU-01043, SC1341-KU-01044, SC1341-KU-01045, SC1341-KU-01046, SC1341-KU-01047, SC1341-KU-01048, SC1341-KU-01049, SC1341-KU-01050, SC1341-KU-01051, SC1341-KU-01052, SC1341-KU-01053, SC1341-KU-01054, SC1341-KU-01055, SC1341-KU-01056, SC1341-KU-01057, SC1341-KU-01058, SC1341-KU-01059, SC1341-KU-01060, SC1341-KU-01061, SC1341-KU-01062, SC1341-KU-01063, SC1341-KU-01064, SC1341-KU-01066, SC1341-KU-01067, SC1341-KU-01068, SC1341-KU-01069, SC1341-KU-01070, SC1341-KU-01071, SC1341-KU-01072, SC1341-KU-01073, SC1341-KU-01074, SC1341-KU-01075, SC1341-KU-01076, SC1341-KU-01077, SC1341-KU-01078, SC1341-KU-01079, SC1341-KU-01080, SC1341-KU-01081, SC1341-KU-01082, SC1341-KU-01083, SC1341-KU-01084, SC1341-KU-01085, SC1341-KU-01086, SC1341-KU-01087, SC1341-KU-01088, SC1341-KU-01089, SC1341-KU-01090, SC1341-KU-01091, SC1341-KU-01092, SC1341-KU-01093, SC1341-KU-01094, SC1341-KU-01095, SC1341-KU-01096, SC1341-KU-01097, SC1341-KU-01098, SC1341-KU-01099, SC1341-KU-01100, SC1341-KU-01102, SC1341-KU-01103, SC1341-KU-01104, SC1341-KU-01105, SC1341-KU-01107, SC1341-KU-01108, SC1341-KU-01109, SC1341-KU-01110, SC1341-KU-01111, SC1341-KU-01112, SC1341-KU-01113, SC1341-KU-01114, SC1341-KU-01115, SC1341-KU-01116, SC1341-KU-01117, SC1341-KU-01119, SC1341-KU-01121, SC1341-KU-01122, SC1341-KU-01123, SC1341-KU-01124, SC1341-KU-01125, SC1341-KU-01126, SC1341-KU-01127, SC1341-KU-01129, SC1341-KU-01130, SC1341-KU-01132, SC1341-KU-01133, SC1341-KU-01134, SC1341-KU-01135, SC1341-KU-01136, SC1341-KU-01137, SC1341-KU-01138, SC1341-KU-01139, SC1341-KU-01140, SC1341-KU-01141, SC1341-KU-01142, SC1341-KU-01143, SC1341-KU-01144, SC1341-KU-01145, SC1341-KU-01146, SC1341-KU-01147, SC1341-KU-01148, SC1341-KU-01149, SC1341-KU-01150, SC1341-KU-01151, SC1341-KU-01152, SC1341-KU-01153, SC1341-KU-01154, SC1341-KU-01155, SC1341-KU-01156, SC1341-KU-01157, SC1341-KU-01159, SC1341-KU-01160, SC1341-KU-01161, SC1341-KU-01162, SC1341-KU-01163, SC1341-KU-01164, SC1341-KU-01165, SC1341-KU-01166, SC1341-KU-01167, SC1341-KU-01168, SC1341-KU-01169, SC1341-KU-01170, SC1341-KU-01171, SC1341-KU-01172, SC1341-KU-01173, SC1341-KU-01174, SC1341-KU-01175, SC1341-KU-01176, SC1341-KU-01178, SC1341-KU-01179, SC1341-KU-01180, SC1341-KU-01181, SC1341-KU-01182, SC1341-KU-01183, SC1341-KU-01184, SC1341-KU-01185, SC1341-KU-01186, SC1341-KU-01187, SC1341-KU-01188, SC1341-KU-01189, SC1341-KU-01190, SC1341-KU-01191, SC1341-KU-01192, SC1341-KU-01193, SC1341-KU-01194, SC1341-KU-01195, SC1341-KU-01196, SC1341-KU-01197, SC1341-KU-01198, SC1341-KU-01199, SC1341-KU-01200, SC1341-KU-01201, SC1341-KU-01202, SC1341-KU-01203, SC1341-KU-01204, SC1341-KU-01205, SC1341-KU-01206, SC1341-KU-01207, SC1341-KU-01208, SC1341-KU-01209, SC1341-KU-01211, SC1341-KU-01212, SC1341-KU-01213, SC1341-KU-01214, SC1341-KU-01215, SC1341-KU-01216, SC1341-KU-01217, SC1341-KU-01218, SC1341-KU-01219, SC1341-KU-01220, SC1341-KU-01221, SC1341-KU-01222, SC1341-KU-01223, SC1341-KU-01224, SC1341-KU-01225, SC1341-KU-01226, SC1341-KU-01227, SC1341-KU-01228, SC1341-KU-01229, SC1341-KU-01230, SC1341-KU-01232, SC1341-KU-01236, SC1341-KU-01237, SC1341-KU-01238, SC1341-KU-01239, SC1341-KU-01240, SC1341-KU-01241, SC1341-KU-01242, SC1341-KU-01243, SC1341-KU-01244, SC1341-KU-01245, SC1341-KU-01246, SC1341-KU-01247, SC1341-KU-01248, SC1341-KU-01249, SC1341-KU-01250, SC1341-KU-01251, SC1341-KU-01252, SC1341-KU-01253, SC1341-KU-01254, SC1341-KU-01255, SC1341-KU-01256, SC1341-KU-01257, SC1341-KU-01258, SC1341-KU-01259, SC1341-KU-01260, SC1341-KU-01261, SC1341-KU-01262, SC1341-KU-01263, SC1341-KU-01264, SC1341-KU-01265, SC1341-KU-01266, SC1341-KU-01267, SC1341-KU-01268, SC1341-KU-01269, SC1341-KU-01270, SC1341-KU-01271, SC1341-KU-01272, SC1341-KU-01273, SC1341-KU-01274, SC1341-KU-01275, SC1341-KU-01276, SC1341-KU-01277, SC1341-KU-01278, SC1341-KU-01279, SC1341-KU-01280, SC1341-KU-01281, SC1341-KU-01282, SC1341-KU-01283, SC1341-KU-01284, SC1341-KU-01286, SC1341-KU-01287, SC1341-KU-01288, SC1341-KU-01289, SC1341-KU-01290, SC1341-KU-01291, SC1341-KU-01292, SC1341-KU-01293, SC1341-KU-01294, SC1341-KU-01295, SC1341-KU-01296, SC1341-KU-01297, SC1341-KU-01298, SC1341-KU-01299, SC1341-KU-01300, SC1341-KU-01301, SC1341-KU-01302, SC1341-KU-01303, SC1341-KU-01305, SC1341-KU-01306, SC1341-KU-01307, SC1341-KU-01308, SC1341-KU-01309, SC1341-KU-01310, SC1341-KU-01311, SC1341-KU-01312, SC1341-KU-01313, SC1341-KU-01314, SC1341-KU-01315, SC1341-KU-01316, SC1341-KU-01317, SC1341-KU-01318, SC1341-KU-01319, SC1341-KU-01320, SC1341-KU-01321, SC1341-KU-01322, SC1341-KU-01324, SC1341-KU-01325, SC1341-KU-01327, SC1341-KU-01328, SC1341-KU-01329, SC1341-KU-01330, SC1341-KU-01331, SC1341-KU-01332

## 8. 逐条裁决（300 条，校准后）

| KU | 表达 | 结论 | 组 | 问题摘要 |
|---|---|---|---|---|
| SC1341-KU-01033 | remove a stain | PASS | G1 | — |
| SC1341-KU-01034 | spot-test a fabric | PASS | G1 | — |
| SC1341-KU-01035 | separate delicate clothes | REVISE | G1 | 搭配栏两条均非该表达的真实搭配：第一条即表达本身，第二条 sort delicates separately 是同义动词短语（sort≈separate），未包含 separate/delicate clothes 任一成分，整栏未展… |
| SC1341-KU-01036 | hand-wash delicates | PASS | G1 | — |
| SC1341-KU-01037 | dry clothes flat | PASS | G1 | — |
| SC1341-KU-01038 | keep chemicals out of reach | PASS | G1 | — |
| SC1341-KU-01039 | store cleaning products safely | PASS | G1 | — |
| SC1341-KU-01040 | dispose of used cleaning supplies | PASS | G1 | — |
| SC1341-KU-01041 | fix an appliance | REVISE | G1 | 搭配栏两条均非该表达的真实搭配：第一条即表达本身，第二条 repair a household appliance 是同义替换（repair≈fix），未包含 fix/appliance 任一成分，整栏未展示该表达的用法。 |
| SC1341-KU-01042 | set a cleaning reminder | PASS | G1 | — |
| SC1341-KU-01043 | divide up the chores | PASS | G1 | — |
| SC1341-KU-01044 | keep up with housework | PASS | G1 | — |
| SC1341-KU-01045 | do the housework | PASS | G1 | — |
| SC1341-KU-01046 | laundry | PASS | G1 | — |
| SC1341-KU-01047 | wash | PASS | G1 | — |
| SC1341-KU-01048 | laundry load | PASS | G1 | — |
| SC1341-KU-01049 | laundry basket | PASS | G1 | — |
| SC1341-KU-01050 | laundry hamper | PASS | G1 | — |
| SC1341-KU-01051 | washing machine | PASS | G1 | — |
| SC1341-KU-01052 | dryer | PASS | G1 | — |
| SC1341-KU-01053 | laundry room | PASS | G1 | — |
| SC1341-KU-01054 | detergent | PASS | G1 | — |
| SC1341-KU-01055 | fabric softener | PASS | G1 | — |
| SC1341-KU-01056 | stain remover | PASS | G1 | — |
| SC1341-KU-01057 | detergent pod | PASS | G1 | — |
| SC1341-KU-01058 | care label | PASS | G1 | — |
| SC1341-KU-01059 | spin cycle | PASS | G1 | — |
| SC1341-KU-01060 | stain | PASS | G1 | — |
| SC1341-KU-01061 | sort the laundry | PASS | G1 | — |
| SC1341-KU-01062 | fold the laundry | PASS | G1 | — |
| SC1341-KU-01063 | delicate | PASS | G1 | — |
| SC1341-KU-01064 | detergent residue | PASS | G1 | — |
| SC1341-KU-01065 | hang clothes to dry | REVISE | G1 | usage_note 整句只是来源说明（“该表达是来源中的场景补缺候选，尚待独立审核”），没有任何用法指导，缺失用法注；另该行源为 editorial_gap_candidate。 |
| SC1341-KU-01066 | laundry detergent | PASS | G1 | — |
| SC1341-KU-01067 | washing | PASS | G1 | — |
| SC1341-KU-01068 | load | PASS | G1 | — |
| SC1341-KU-01069 | dirty laundry | PASS | G1 | — |
| SC1341-KU-01070 | clean laundry | PASS | G1 | — |
| SC1341-KU-01071 | laundromat | PASS | G1 | — |
| SC1341-KU-01072 | bleach | PASS | G1 | — |
| SC1341-KU-01073 | washing powder | PASS | G1 | — |
| SC1341-KU-01074 | liquid detergent | PASS | G1 | — |
| SC1341-KU-01075 | mesh laundry bag | PASS | G1 | — |
| SC1341-KU-01076 | lint | PASS | G1 | — |
| SC1341-KU-01077 | lint trap | PASS | G1 | — |
| SC1341-KU-01078 | washing instructions | PASS | G1 | — |
| SC1341-KU-01079 | wash cycle | PASS | G1 | — |
| SC1341-KU-01080 | rinse cycle | PASS | G1 | — |
| SC1341-KU-01081 | drying rack | PASS | G1 | — |
| SC1341-KU-01082 | clothesline | PASS | G1 | — |
| SC1341-KU-01083 | clothespin | PASS | G2 | — |
| SC1341-KU-01084 | clothes peg | PASS | G2 | — |
| SC1341-KU-01085 | hanger | PASS | G2 | — |
| SC1341-KU-01086 | drying time | PASS | G2 | — |
| SC1341-KU-01087 | air-dry | PASS | G2 | — |
| SC1341-KU-01088 | tumble dry | PASS | G2 | — |
| SC1341-KU-01089 | hand wash | PASS | G2 | — |
| SC1341-KU-01090 | dry-clean | PASS | G2 | — |
| SC1341-KU-01091 | whites | PASS | G2 | — |
| SC1341-KU-01092 | darks | PASS | G2 | — |
| SC1341-KU-01093 | colors | PASS | G2 | — |
| SC1341-KU-01094 | delicates | PASS | G2 | — |
| SC1341-KU-01095 | wool | PASS | G2 | — |
| SC1341-KU-01096 | cotton | PASS | G2 | — |
| SC1341-KU-01097 | linen | PASS | G2 | — |
| SC1341-KU-01098 | polyester | PASS | G2 | — |
| SC1341-KU-01099 | silk | PASS | G2 | — |
| SC1341-KU-01100 | jeans | PASS | G2 | — |
| SC1341-KU-01101 | socks | REVISE | G2 | example_en 用单数 'one sock'，词头复数 'socks' 未在例句中出现，例句未示范词头形式。 |
| SC1341-KU-01102 | underwear | PASS | G2 | — |
| SC1341-KU-01103 | bedsheets | PASS | G2 | — |
| SC1341-KU-01104 | pillowcases | PASS | G2 | — |
| SC1341-KU-01105 | towels | PASS | G2 | — |
| SC1341-KU-01106 | bath towels | REVISE | G2 | example_en 措辞不自然：'once they're ready for laundry'（浴巾不会“准备好去洗”），英语母语者不这么说。 |
| SC1341-KU-01107 | kitchen towels | PASS | G2 | — |
| SC1341-KU-01108 | uniform | PASS | G2 | — |
| SC1341-KU-01109 | gym clothes | PASS | G2 | — |
| SC1341-KU-01110 | work clothes | PASS | G2 | — |
| SC1341-KU-01111 | sweater | PASS | G2 | — |
| SC1341-KU-01112 | shirt | PASS | G2 | — |
| SC1341-KU-01113 | sweat stain | PASS | G2 | — |
| SC1341-KU-01114 | grease stain | PASS | G2 | — |
| SC1341-KU-01115 | coffee stain | PASS | G2 | — |
| SC1341-KU-01116 | mud stain | PASS | G2 | — |
| SC1341-KU-01117 | blood stain | PASS | G2 | — |
| SC1341-KU-01118 | fabric | REVISE | G2 | collocation 'wash a fabric' 不自然：fabric 作材料通常不可数，'wash a fabric' 不符合习惯用法，且与 usage_note“泛指材料”自相矛盾。 |
| SC1341-KU-01119 | seam | PASS | G2 | — |
| SC1341-KU-01120 | zipper | REVISE | G2 | example_en 示范的是动词短语 'zip up'（本身是另一条 KU-01131 的内容），词头名词 'zipper' 未在例句中出现。 |
| SC1341-KU-01121 | button | PASS | G2 | — |
| SC1341-KU-01122 | pocket | PASS | G2 | — |
| SC1341-KU-01123 | drum | PASS | G2 | — |
| SC1341-KU-01124 | washer door | PASS | G2 | — |
| SC1341-KU-01125 | water inlet | PASS | G2 | — |
| SC1341-KU-01126 | drain hose | PASS | G2 | — |
| SC1341-KU-01127 | separate whites and colors | PASS | G2 | — |
| SC1341-KU-01128 | check the pockets | REVISE | G2 | collocations 第一项就是表达式本身 'check the pockets'，不是搭配。 |
| SC1341-KU-01129 | empty your pockets | PASS | G2 | — |
| SC1341-KU-01130 | turn clothes inside out | PASS | G2 | — |
| SC1341-KU-01131 | zip up jackets | REVISE | G2 | 两条 collocations 'zip up jackets'/'zip up a jacket' 只是表达式本身的复数/单数形式，均不是搭配。 |
| SC1341-KU-01132 | fasten buttons | PASS | G2 | — |
| SC1341-KU-01133 | put clothes in the washer | PASS | G3 | — |
| SC1341-KU-01134 | load the washing machine | PASS | G3 | — |
| SC1341-KU-01135 | overload the washer | PASS | G3 | — |
| SC1341-KU-01136 | measure the detergent | PASS | G3 | — |
| SC1341-KU-01137 | add detergent | PASS | G3 | — |
| SC1341-KU-01138 | pour in fabric softener | PASS | G3 | — |
| SC1341-KU-01139 | choose a cycle | PASS | G3 | — |
| SC1341-KU-01140 | set the temperature | PASS | G3 | — |
| SC1341-KU-01141 | start the wash | PASS | G3 | — |
| SC1341-KU-01142 | pause the cycle | PASS | G3 | — |
| SC1341-KU-01143 | run an extra rinse | PASS | G3 | — |
| SC1341-KU-01144 | rinse out detergent | PASS | G3 | — |
| SC1341-KU-01145 | spin the clothes | PASS | G3 | — |
| SC1341-KU-01146 | take out the laundry | PASS | G3 | — |
| SC1341-KU-01147 | transfer clothes to the dryer | PASS | G3 | — |
| SC1341-KU-01148 | load the dryer | PASS | G3 | — |
| SC1341-KU-01149 | clean the lint trap | PASS | G3 | — |
| SC1341-KU-01150 | hang out the washing | PASS | G3 | — |
| SC1341-KU-01151 | hang clothes on a line | PASS | G3 | — |
| SC1341-KU-01152 | peg clothes to the line | PASS | G3 | — |
| SC1341-KU-01153 | hang up a shirt | PASS | G3 | — |
| SC1341-KU-01154 | lay flat to dry | PASS | G3 | — |
| SC1341-KU-01155 | dry in the shade | PASS | G3 | — |
| SC1341-KU-01156 | bring the washing in | PASS | G3 | — |
| SC1341-KU-01157 | take clothes off the line | PASS | G3 | — |
| SC1341-KU-01158 | pair up socks | REVISE | G3 | 第二搭配 "match and pair socks" 不成立：match 与 pair 同义叠加，且包含词头核心词 pair，实为词头本身改写，不是独立真实搭配。 |
| SC1341-KU-01159 | put clothes away | PASS | G3 | — |
| SC1341-KU-01160 | iron a shirt | PASS | G3 | — |
| SC1341-KU-01161 | steam a garment | PASS | G3 | — |
| SC1341-KU-01162 | shake out wrinkles | PASS | G3 | — |
| SC1341-KU-01163 | pre-treat a stain | PASS | G3 | — |
| SC1341-KU-01164 | soak the clothes | PASS | G3 | — |
| SC1341-KU-01165 | scrub the stain | PASS | G3 | — |
| SC1341-KU-01166 | wash by hand | PASS | G3 | — |
| SC1341-KU-01167 | wring out clothes | PASS | G3 | — |
| SC1341-KU-01168 | squeeze out water | PASS | G3 | — |
| SC1341-KU-01169 | clean | PASS | G3 | — |
| SC1341-KU-01170 | dirty | PASS | G3 | — |
| SC1341-KU-01171 | fresh | PASS | G3 | — |
| SC1341-KU-01172 | damp | PASS | G3 | — |
| SC1341-KU-01173 | wet | PASS | G3 | — |
| SC1341-KU-01174 | soaking wet | PASS | G3 | — |
| SC1341-KU-01175 | bone-dry | PASS | G3 | — |
| SC1341-KU-01176 | still damp | PASS | G3 | — |
| SC1341-KU-01177 | wrinkled | REVISE | G3 | usage_note "wrinkled指多处起皱" 不准确：wrinkled 不要求多处起皱，一处褶皱亦可称 wrinkled，"多处" 属过度限定。 |
| SC1341-KU-01178 | creased | PASS | G3 | — |
| SC1341-KU-01179 | shrunken | PASS | G3 | — |
| SC1341-KU-01180 | stretched out | PASS | G3 | — |
| SC1341-KU-01181 | faded | PASS | G3 | — |
| SC1341-KU-01182 | colorfast | PASS | G3 | — |
| SC1341-KU-01183 | color bleeding | PASS | G4 | — |
| SC1341-KU-01184 | stained | PASS | G4 | — |
| SC1341-KU-01185 | musty | PASS | G4 | — |
| SC1341-KU-01186 | fluffy | PASS | G4 | — |
| SC1341-KU-01187 | stiff | PASS | G4 | — |
| SC1341-KU-01188 | soft | PASS | G4 | — |
| SC1341-KU-01189 | machine-washable | PASS | G4 | — |
| SC1341-KU-01190 | hand-wash only | PASS | G4 | — |
| SC1341-KU-01191 | dry-clean only | PASS | G4 | — |
| SC1341-KU-01192 | low heat | PASS | G4 | — |
| SC1341-KU-01193 | high heat | PASS | G4 | — |
| SC1341-KU-01194 | cold wash | PASS | G4 | — |
| SC1341-KU-01195 | warm wash | PASS | G4 | — |
| SC1341-KU-01196 | hot wash | PASS | G4 | — |
| SC1341-KU-01197 | quick wash | PASS | G4 | — |
| SC1341-KU-01198 | gentle cycle | PASS | G4 | — |
| SC1341-KU-01199 | heavy-duty cycle | PASS | G4 | — |
| SC1341-KU-01200 | spin speed | PASS | G4 | — |
| SC1341-KU-01201 | eco setting | PASS | G4 | — |
| SC1341-KU-01202 | stubborn stain | PASS | G4 | — |
| SC1341-KU-01203 | set-in stain | PASS | G4 | — |
| SC1341-KU-01204 | shrink in the wash | PASS | G4 | — |
| SC1341-KU-01205 | bleach stain | PASS | G4 | — |
| SC1341-KU-01206 | musty smell | PASS | G4 | — |
| SC1341-KU-01207 | mildew | PASS | G4 | — |
| SC1341-KU-01208 | lint buildup | PASS | G4 | — |
| SC1341-KU-01209 | clogged filter | PASS | G4 | — |
| SC1341-KU-01210 | drainage problem | REVISE | G4 | 搭配栏首项“drainage problem”就是词条本身，不是搭配，属无效重复；第二项“washer drainage problem”有效。例句“The washer isn't draining properly because… |
| SC1341-KU-01211 | washer leak | PASS | G4 | — |
| SC1341-KU-01212 | unbalanced load | PASS | G4 | — |
| SC1341-KU-01213 | spin failure | PASS | G4 | — |
| SC1341-KU-01214 | broken zipper | PASS | G4 | — |
| SC1341-KU-01215 | loose button | PASS | G4 | — |
| SC1341-KU-01216 | fabric pilling | PASS | G4 | — |
| SC1341-KU-01217 | static cling | PASS | G4 | — |
| SC1341-KU-01218 | remove lint | PASS | G4 | — |
| SC1341-KU-01219 | get a stain out | PASS | G4 | — |
| SC1341-KU-01220 | spot-clean | PASS | G4 | — |
| SC1341-KU-01221 | re-wash clothes | PASS | G4 | — |
| SC1341-KU-01222 | run the washer empty | PASS | G4 | — |
| SC1341-KU-01223 | clean the drum | PASS | G4 | — |
| SC1341-KU-01224 | leave the washer door open | PASS | G4 | — |
| SC1341-KU-01225 | avoid overloading | PASS | G4 | — |
| SC1341-KU-01226 | check the drain | PASS | G4 | — |
| SC1341-KU-01227 | use a color catcher | PASS | G4 | — |
| SC1341-KU-01228 | test for colorfastness | PASS | G4 | — |
| SC1341-KU-01229 | follow the care instructions | PASS | G4 | — |
| SC1341-KU-01230 | keep away from direct sunlight | PASS | G4 | — |
| SC1341-KU-01231 | remove clothes promptly | REVISE | G4 | 搭配栏首项“remove clothes promptly”就是词条本身，不是搭配，属无效重复；第二项“remove laundry promptly”有效。 |
| SC1341-KU-01232 | separate damp clothes | PASS | G4 | — |
| SC1341-KU-01233 | rewash a smelly load | REVISE | G5 | collocations 第 1 条与 expression 逐字重复（rewash a smelly load），不是搭配；usage_note 后半句“异味衣物应先查找原因”是洗衣建议而非该表达的用法说明，超出用法注范围。 |
| SC1341-KU-01234 | color bleed | REVISE | G5 | usage_note 末句“属待独立审核补缺候选”是制作端元信息，不是学习者用法说明，不应出现在答案内容中。 |
| SC1341-KU-01235 | take the laundry out | REVISE | G5 | collocations 第 1 条与 expression 逐字重复（take the laundry out），不是搭配；usage_note 末句“此源项是待独立审核增补候选”是制作端元信息，不应出现在答案内容中。 |
| SC1341-KU-01236 | prepare a meal | PASS | G5 | — |
| SC1341-KU-01237 | recipe | PASS | G5 | — |
| SC1341-KU-01238 | ingredient | PASS | G5 | — |
| SC1341-KU-01239 | salt | PASS | G5 | — |
| SC1341-KU-01240 | oil | PASS | G5 | — |
| SC1341-KU-01241 | cutting board | PASS | G5 | — |
| SC1341-KU-01242 | pan | PASS | G5 | — |
| SC1341-KU-01243 | pot | PASS | G5 | — |
| SC1341-KU-01244 | slice the tomatoes | PASS | G5 | — |
| SC1341-KU-01245 | season the meat | PASS | G5 | — |
| SC1341-KU-01246 | preheat the oven | PASS | G5 | — |
| SC1341-KU-01247 | simmer | PASS | G5 | — |
| SC1341-KU-01248 | roast chicken | PASS | G5 | — |
| SC1341-KU-01249 | meal prep | PASS | G5 | — |
| SC1341-KU-01250 | cooking | PASS | G5 | — |
| SC1341-KU-01251 | food preparation | PASS | G5 | — |
| SC1341-KU-01252 | main ingredient | PASS | G5 | — |
| SC1341-KU-01253 | fresh produce | PASS | G5 | — |
| SC1341-KU-01254 | vegetables | PASS | G5 | — |
| SC1341-KU-01255 | fruit | PASS | G5 | — |
| SC1341-KU-01256 | meat | PASS | G5 | — |
| SC1341-KU-01257 | poultry | PASS | G5 | — |
| SC1341-KU-01258 | seafood | PASS | G5 | — |
| SC1341-KU-01259 | fish | PASS | G5 | — |
| SC1341-KU-01260 | eggs | PASS | G5 | — |
| SC1341-KU-01261 | dairy | PASS | G5 | — |
| SC1341-KU-01262 | rice | PASS | G5 | — |
| SC1341-KU-01263 | pasta | PASS | G5 | — |
| SC1341-KU-01264 | beans | PASS | G5 | — |
| SC1341-KU-01265 | lentils | PASS | G5 | — |
| SC1341-KU-01266 | herbs | PASS | G5 | — |
| SC1341-KU-01267 | spices | PASS | G5 | — |
| SC1341-KU-01268 | seasoning | PASS | G5 | — |
| SC1341-KU-01269 | pepper | PASS | G5 | — |
| SC1341-KU-01270 | olive oil | PASS | G5 | — |
| SC1341-KU-01271 | butter | PASS | G5 | — |
| SC1341-KU-01272 | flour | PASS | G5 | — |
| SC1341-KU-01273 | sugar | PASS | G5 | — |
| SC1341-KU-01274 | vinegar | PASS | G5 | — |
| SC1341-KU-01275 | soy sauce | PASS | G5 | — |
| SC1341-KU-01276 | garlic | PASS | G5 | — |
| SC1341-KU-01277 | onion | PASS | G5 | — |
| SC1341-KU-01278 | ginger | PASS | G5 | — |
| SC1341-KU-01279 | stock | PASS | G5 | — |
| SC1341-KU-01280 | broth | PASS | G5 | — |
| SC1341-KU-01281 | sauce | PASS | G5 | — |
| SC1341-KU-01282 | dressing | PASS | G5 | — |
| SC1341-KU-01283 | marinade | PASS | G6 | — |
| SC1341-KU-01284 | side dish | PASS | G6 | — |
| SC1341-KU-01285 | kitchen counter | REVISE | G6 | 搭配“clean kitchen counter”在动词短语中缺冠词 the，与同条“wipe the kitchen counter”不一致，学习者易写出 *I clean kitchen counter。 |
| SC1341-KU-01286 | chopping board | PASS | G6 | — |
| SC1341-KU-01287 | chef's knife | PASS | G6 | — |
| SC1341-KU-01288 | paring knife | PASS | G6 | — |
| SC1341-KU-01289 | vegetable peeler | PASS | G6 | — |
| SC1341-KU-01290 | grater | PASS | G6 | — |
| SC1341-KU-01291 | colander | PASS | G6 | — |
| SC1341-KU-01292 | strainer | PASS | G6 | — |
| SC1341-KU-01293 | mixing bowl | PASS | G6 | — |
| SC1341-KU-01294 | measuring cup | PASS | G6 | — |
| SC1341-KU-01295 | measuring spoon | PASS | G6 | — |
| SC1341-KU-01296 | kitchen scale | PASS | G6 | — |
| SC1341-KU-01297 | spatula | PASS | G6 | — |
| SC1341-KU-01298 | wooden spoon | PASS | G6 | — |
| SC1341-KU-01299 | whisk | PASS | G6 | — |
| SC1341-KU-01300 | tongs | PASS | G6 | — |
| SC1341-KU-01301 | ladle | PASS | G6 | — |
| SC1341-KU-01302 | saucepan | PASS | G6 | — |
| SC1341-KU-01303 | frying pan | PASS | G6 | — |
| SC1341-KU-01304 | nonstick pan | REVISE | G6 | 两个搭配均无效：第一项“nonstick pan”就是词条本身；第二项“nonstick frying pan”是同义复合词（不粘煎锅），不是与 nonstick pan 的搭配。 |
| SC1341-KU-01305 | baking tray | PASS | G6 | — |
| SC1341-KU-01306 | oven | PASS | G6 | — |
| SC1341-KU-01307 | stove | PASS | G6 | — |
| SC1341-KU-01308 | hob | PASS | G6 | — |
| SC1341-KU-01309 | burner | PASS | G6 | — |
| SC1341-KU-01310 | microwave | PASS | G6 | — |
| SC1341-KU-01311 | blender | PASS | G6 | — |
| SC1341-KU-01312 | food processor | PASS | G6 | — |
| SC1341-KU-01313 | rice cooker | PASS | G6 | — |
| SC1341-KU-01314 | pressure cooker | PASS | G6 | — |
| SC1341-KU-01315 | refrigerator | PASS | G6 | — |
| SC1341-KU-01316 | freezer | PASS | G6 | — |
| SC1341-KU-01317 | pantry | PASS | G6 | — |
| SC1341-KU-01318 | food container | PASS | G6 | — |
| SC1341-KU-01319 | plan dinner | PASS | G6 | — |
| SC1341-KU-01320 | decide what to cook | PASS | G6 | — |
| SC1341-KU-01321 | check the fridge | PASS | G6 | — |
| SC1341-KU-01322 | check the pantry | PASS | G6 | — |
| SC1341-KU-01323 | write a shopping list | REVISE | G6 | 搭配第一项“write a shopping list”就是词条本身，不是搭配。 |
| SC1341-KU-01324 | follow a recipe | PASS | G6 | — |
| SC1341-KU-01325 | read the instructions | PASS | G6 | — |
| SC1341-KU-01326 | gather the ingredients | REVISE | G6 | 搭配第一项“gather the ingredients”就是词条本身，不是搭配。 |
| SC1341-KU-01327 | measure out ingredients | PASS | G6 | — |
| SC1341-KU-01328 | weigh ingredients | PASS | G6 | — |
| SC1341-KU-01329 | wash the vegetables | PASS | G6 | — |
| SC1341-KU-01330 | rinse the rice | PASS | G6 | — |
| SC1341-KU-01331 | peel the potatoes | PASS | G6 | — |
| SC1341-KU-01332 | trim the ends | PASS | G6 | — |
