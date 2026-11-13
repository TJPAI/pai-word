# V51 答案型 KU 作者修订 219 条独立复审（MU-ENTEACH）：P0 76 + P1 143

评审方：MU-ENTEACH（英文词库教学线-配合）。评审日期：2026-11-13。
教学分支：`answer-enrichment-main-dev-20261026`，钉住 HEAD `5cd5e211ef7f64c50a828a8cf992da09e0c368fe`。
源 CSV：集成分支 `cg-main-fourline-integration-20261026` 的 `tools/integration/scene1341-ranked/v51-ranked.csv`，blob `eaa6d729bb04a9bedbafd8e1081a11fc791caa39`，2,038 行（10 场景）。
修订总索引：`tools/answer-enrichment/qa_reports/CG_ENTEACH_V51_ALL219_AUTHOR_CORRECTIONS_HANDOFF_20261112.v1.json`，blob `429fccd0ae33e78681770040222110bb13a661f1`，219 条唯一 KU。

> **结论是 Muse 教学线单遍独立判断，不是双 AI 认证；未发布；内容 PASS 不等于源身份已认证。** master_hold 的 101 项仍须 CG-MASTER 裁决，activation / production_ready / publishable 全为 0，release 继续阻塞。

## 1. 范围与锚点

审 219 条：P0 76 条、P1 143 条；SC1341-KU-00006–SC1341-KU-02028（不连续，为修订队列）。18 个基础补丁文件 blob 与索引逐一核对一致；51 个冻结作者源包 blob 与索引逐一核对一致；219/219 original_answer 与冻结包逐字一致；219/219 sense_zh 与源 CSV 一致；0 不符。

### 1.1 基础补丁文件（18 个）

| # | 补丁文件 | 条数 | Git blob |
|---|---|---|---|
| 1 | `CG_ENTEACH_V51_P0_AUTHOR_PATCH_10_20261112.v1.json` | 10 | `992a32c0d2d38135d4e9e8884dfedcf5c9d67fbb` |
| 2 | `CG_ENTEACH_V51_P0_AUTHOR_PATCH_11_20261112.v1.json` | 11 | `9d6d69fad108ce89a1db3f35984624b052188cd2` |
| 3 | `CG_ENTEACH_V51_P0_AUTHOR_PATCH_12_20261112.v1.json` | 12 | `e8c7c2ec4b1df6a87fc1237cec2db5f4b76dda64` |
| 4 | `CG_ENTEACH_V51_P0_AUTHOR_PATCH_13_20261112.v1.json` | 13 | `39359f5ab3094d44f6961ecbbe7b27b8d4e739da` |
| 5 | `CG_ENTEACH_V51_P0_AUTHOR_PATCH_14_20261112.v1.json` | 14 | `e89fb06470e37960b47947a81238beeae187a708` |
| 6 | `CG_ENTEACH_V51_P0_AUTHOR_PATCH_8_20261112.v1.json` | 8 | `04eff5299329a028c950132093197cf59dc6b925` |
| 7 | `CG_ENTEACH_V51_P0_AUTHOR_PATCH_8_MASTER_HOLD_20261112.v1.json` | 8 | `7a8f55444e223e3d9e2381ead4fd2dfcf7d3499d` |
| 8 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_001_016_20261112.v1.json` | 16 | `3c1c36d5fa20ae4d4e6f00e8cf85d70645282bac` |
| 9 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_017_029_20261112.v1.json` | 13 | `028e1e329e955ee3b9647e22153842e581268d35` |
| 10 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_030_038_20261112.v1.json` | 9 | `79ca0e6d4db61e24312a8dab6dcc89f4b876bfe0` |
| 11 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_039_051_20261112.v1.json` | 13 | `d043e8f4e320697f9817bf598007ac81b108250f` |
| 12 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_052_065_20261112.v1.json` | 14 | `4d36b7dd4b795888d9a63385d8fed24dfb45d569` |
| 13 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_066_075_20261112.v1.json` | 10 | `619afddb24e97a97eed5fef421808e28801a207a` |
| 14 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_076_085_20261112.v1.json` | 10 | `1ed01655ce1e27dcd5579b351f22a740d63cd61c` |
| 15 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_086_096_20261112.v1.json` | 11 | `253556d0978983d93ee4ed8620b3ae5f82eea905` |
| 16 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_097_105_20261112.v1.json` | 9 | `c2be7efd2b7e653309dc48a2c1ef8131ec005df2` |
| 17 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_106_123_20261112.v1.json` | 18 | `cf0f58aa032cb6810e07b69f100def850e4011b1` |
| 18 | `CG_ENTEACH_V51_P1_AUTHOR_PATCH_124_143_20261112.v1.json` | 20 | `a82f7e92da7ca4faca5c516760c1363cb3777aa2` |

### 1.2 后续新版（8 个，34 条 KU 以新版为准）

以下文件在总索引之后提交，含更新的 revised_answer（QA_DIRECTED6 用 `proposed_answer` 键），按提交时间先后适用，最新者为准。

| # | 文件 | 提交时间 | 覆盖 KU | Git blob |
|---|---|---|---|---|
| 1 | `CG_ENTEACH_V51_P0_QA_DIRECTED_REPATCH_2_20261112.v2.json` | 2026-11-12 17:58 +0800 | 2 | `512ac77783635348b42b69375af5314acb7eb397` |
| 2 | `CG_ENTEACH_V51_P0_QA_DIRECTED_REPATCH_5_20261112.v3.json` | 2026-11-12 18:04 +0800 | 5 | `2c2b626412239576683c45ea982060206270d055` |
| 3 | `CG_ENTEACH_V51_P1_AUTHOR_EXAMPLE_ALIGNMENT_2_20261112.v1.json` | 2026-11-12 18:30 +0800 | 2 | `831281ea48430fd75967ca74cc890ebc3951d541` |
| 4 | `CG_ENTEACH_V51_P1_AUTHOR_EXAMPLE_ALIGNMENT_4_20261112.v2.json` | 2026-11-12 18:32 +0800 | 4 | `39826ffefbd5cf5b7e4eeb4f0e6ea36f4e226856` |
| 5 | `CG_ENTEACH_V51_P1_QAFIRST_CONDITIONAL12_AUTHOR_REPATCH_20261112.v1.json` | 2026-11-12 21:22 +0800 | 12 | `b34575d3ec76136bfe8a3b66070fc9599b77fc49` |
| 6 | `CG_ENTEACH_V51_P1_MASTER70_TARGETED_5_AUTHOR_REPATCH_20261112.v1.json` | 2026-11-12 21:23 +0800 | 5 | `b3abc46c84d388e2c48763f6abb37974f23613ff` |
| 7 | `CG_ENTEACH_V51_P0_MASTERHOLD31_CONDITIONAL2_GLOSS_REPATCH_20261112.v1.json` | 2026-11-12 21:57 +0800 | 2 | `e3d054ca5925562f2cc02553241dd566b5d5a738` |
| 8 | `CG_ENTEACH_V51_P1_MASTER70_QA_DIRECTED6_ANSWER_REPATCH_20261113.v1.json` | 2026-11-13 08:55 +0800 | 6 | `a9556414f9c44bd568d65352ff781a5982175858` |

**分叉记录**：`QA_DIRECTED6`（2026-11-13 08:55，最新）对其 4 条重叠 KU（00635、00876、01534、02006）是从基础补丁分支的平行新版——其 `previous_author_answer` 与基础版一致、与 `TARGETED_5` 版不一致，即未吸纳 TARGETED_5 的改动；按“最新提交为准”规则仍以 QA_DIRECTED6 版为评审对象，分叉事实记入 JSON `supersessions.fork_note`，请 CG-ENTEACH 确认两版以何为准。

**未取代的后续文件**：`P0_IDENTITY_HOLD8_DIRECTED_ANSWER_PROPOSALS_20261113.v1.json`（blob `6dabe0e1…`）对 8 条 KU（00636、01010、01034、01234、01664、01809、01992、02028）只给了 4 字段部分候选（expression/meaning_zh/example_en/example_zh，无 collocations/usage_note/contrast_note），不是完整 revised_answer，故不取代完整版为准，评审对象仍为基础/后续完整版。`P1_17_AUTHOR_QA_MASTER_FOLLOWUP_MANIFEST` 只有引用指针，无新内容。

## 2. 总计数

**PASS 181 / REVISE 35 / HOLD 3，共 219 条。**其中 master_hold（须 CG-MASTER 裁决，语言通过但源义/身份未定）101 项：PASS 中 78 项、REVISE 中 21 项、HOLD 中 2 项。无 master_hold 的 PASS 为 103 项。

| 范围 | 条数 | PASS | REVISE | HOLD |
|---|---|---|---|---|
| P0 | 76 | 58 | 17 | 1 |
| P1 | 143 | 123 | 18 | 2 |
| 最新版（34 条） | 34 | 23 | 11 | 0 |
| 基础版（185 条） | 185 | 158 | 24 | 3 |

| 组 | KU 范围 | PASS | REVISE | HOLD |
|---|---|---|---|---|
| G1 | SC1341-KU-00318–SC1341-KU-02028 | 17 | 9 | 0 |
| G2 | SC1341-KU-00006–SC1341-KU-01380 | 20 | 3 | 0 |
| G3 | SC1341-KU-00704–SC1341-KU-01640 | 21 | 5 | 1 |
| G4 | SC1341-KU-00040–SC1341-KU-00434 | 28 | 1 | 0 |
| G5 | SC1341-KU-00458–SC1341-KU-01022 | 35 | 0 | 1 |
| G6 | SC1341-KU-01033–SC1341-KU-01375 | 26 | 5 | 0 |
| G7 | SC1341-KU-01384–SC1341-KU-01721 | 21 | 5 | 1 |
| G8 | SC1341-KU-01722–SC1341-KU-02017 | 13 | 7 | 0 |

观察：最新版 34 条的 REVISE 率 11/34（32%）高于基础版 24/185（13%）——后续 repatch 修掉了一些旧问题，但也带入了新缺陷，主要是 R4（内部备注仍留在 usage_note/display.x，共 15 条 REVISE 中占大头，见第 4 节）。

## 3. 口径

- 八组评审员并行盲判：每组只凭所给条目（scene_id、rank、源 sense_zh、expression、original_answer、revised_answer、revised_display、changed_fields、master_review_required）判，不读 Issue #1/#2 评论、不读 CG-QA 分支与总账、不读 MU-QA/MU-ENTEACH 的既往 verdicts；非盲审对作者（作者 CG-ENTEACH），审者之间、审者对其他线 verdicts 保持盲。
- 逐条判读：revised meaning_zh 须与源 sense_zh 一致、example_en 须示范所教表达且自然贴合、example_zh 忠实自然、collocations 须为真实搭配、usage/contrast 注真实且在范围内、display 与 revised answer 一致、无任何题目字段。
- 冻结校准表（R1–R7）全文见第 7 节；协调者合并核验见第 7 节末。
- 结论是 Muse 教学线独立判断，**不是双 AI 认证**；flags 全 false（activation_allowed / production_ready / publishable 均为 0）；未发布；内容 PASS 不等于源身份已认证。

## 4. REVISE 明细（35 条）

按规则分组：R4 学习者可见内部备注 15 条；R2 例句未示范目标表达 10 条（其中 4 条兼 R4）；R5 静默改源义 7 条；R3 译文加词 / 误译 3 条；R1 搭配栏无真搭配 1 条；例句译文与修订释义自相矛盾 3 条。

### R4：学习者可见内部备注（15 条）

- **SC1341-KU-00199**（toast，SC50-0001 rank 199，G2，master_hold=true）：Usage note and display.x contain learner-visible internal wording '本KU按早餐食物名词义教学', which is non-learning internal content under R4.
  拟议修正：Remove '本KU按早餐食物名词义教学，' from usage_note and display.x, keeping the noun-countability and verb-distinction guidance.
- **SC1341-KU-00428**（pants，SC50-0003 rank 20，G4，master_hold=false）：The usage_note/display.x contains the learner-visible internal meta-remark '英国义项辨析属于用法说明，不是搭配', which is review-process commentary, not learning content (R4).
  拟议修正：Delete the clause '英国义项辨析属于用法说明，不是搭配。' from usage_note and display.x, keeping the AmE/BrE distinction sentence.
- **SC1341-KU-01010**（shrunk clothes，SC50-0005 rank 188，G1，master_hold=true）：The example uses verb 'shrank' and never shows 'shrunk clothes' (R2), and display x leaks the internal remark '是否应改词头须经Master审定' to learners (R4).
  拟议修正：Use an example containing 'shrunk clothes' (e.g. 'These shrunk clothes no longer fit me.') and remove the Master-review remark from the usage note and display x.
- **SC1341-KU-01213**（spin failure，SC50-0006 rank 168，G6，master_hold=false）：Revised example 'failed to spin' omits the target 'spin failure' entirely (R2), and the usage note and display contain the internal remark '原表达是否保留为独立教学目标须Master裁定' (R4).
  拟议修正：Restore an example using 'spin failure' and delete the internal Master remark from usage_note and display.
- **SC1341-KU-01234**（color bleed，SC50-0006 rank 189，G1，master_hold=true）：Example and collocations use 'color bleeding' and never show the taught expression 'color bleed' (R2), and display x leaks the internal de-duplication remark '须由Master审核是否去重' (R4).
  拟议修正：Restore 'color bleed' in the example and collocations and remove the Master-review remark from the usage note and display x.
- **SC1341-KU-01248**（roast chicken，SC50-0007 rank 13，G6，master_hold=true）：Usage note and display contain the internal remark '教学目标按原Sense作暂定，需Master核定POS身份', which is learner-visible non-learning content (R4).
  拟议修正：Remove the Master-pending remark from usage_note and display, keeping only the learner-facing POS explanation.
- **SC1341-KU-01452**（prep the ingredients，SC50-0007 rank 217，G3，master_hold=true）：Usage note and display.x still contain a learner-visible internal review remark, '是否保留独立教学KU需核对同场景重复项' (R4); the item also duplicates SC1341-KU-01450 'prep ingredients' (R7).
  拟议修正：Remove the internal remark from the usage note and display.x; Master to rule on the 01450/01452 duplicate.
- **SC1341-KU-01498**（cup，SC50-0008 rank 46，G7，master_hold=false）：The learner-visible usage note/display contains internal jargon '此KU例句聚焦实物杯子', which is non-learning content under R4.
  拟议修正：Replace '此KU例句聚焦实物杯子' with learner-facing wording such as '本句聚焦实物杯子'.
- **SC1341-KU-01595**（starving，SC50-0008 rank 143，G3，master_hold=false）：Usage note contains non-learning internal-review meta-commentary, '不应断言其他形式一律错误', visible to learners (R4).
  拟议修正：Delete the meta clause '不应断言其他形式一律错误' from the usage note; keep the explanation that starving is hyperbolic for very hungry and that 'I'm starving' is natural.
- **SC1341-KU-01637**（warm up a late dinner，SC50-0008 rank 185，G7，master_hold=true）：The revised example no longer demonstrates 'warm up a late dinner' (R2), and the learner-visible note contains an internal CG-MASTER ruling remark (R4).
  拟议修正：Restore an example using 'warm up a late dinner' and remove the '需CG-MASTER作出裁定' sentence from the learner-visible note; keep the identity question out of band.
- **SC1341-KU-01711**（wooden board，SC50-0009 rank 71，G7，master_hold=true）：The learner-visible note contains an internal remark '原目标是否特指砧板须由Master凭场景Sense核定', which is non-learning content under R4.
  拟议修正：Remove the '须由Master凭场景Sense核定' sentence from the learner-visible note and keep the identity question out of band.
- **SC1341-KU-01736**（squirt on dish soap，SC50-0009 rank 96，G8，master_hold=true）：Usage note and display.x contain the learner-visible internal remark '需核对Master英文目标', which is non-learning content (R4).
  拟议修正：Delete '需核对Master英文目标' clause from usage_note and display.x; keep the explanation of 'squirt dish soap onto something'.
- **SC1341-KU-01992**（peace and quiet，SC50-0010 rank 153，G1，master_hold=true）：Display x leaks the internal remark '与本场景另一条同表达KU重复，须经Master判断是否合并' to learners, which fails R4; the alleged duplicate cannot be confirmed from this payload alone, so it is not a HOLD.
  拟议修正：Remove the duplicate/Master remark from the usage note and display x; leave any de-duplication decision to Master (flagged by master_hold).
- **SC1341-KU-02017**（turn off notifications，SC50-0010 rank 178，G8，master_hold=true）：Usage note and display.x contain the learner-visible internal remark '是否分别保留两条教学KU需Master核对', which is non-learning content (R4).
  拟议修正：Delete the '需Master核对' clause from usage_note and display.x; the switch-off variant may stay as plain learning content or be dropped.
- **SC1341-KU-02028**（take a screen break，SC50-0010 rank 189，G1，master_hold=true）：Display x leaks the internal remark '与本场景另一条同表达KU重复，需Master决定唯一教学目标' to learners, which fails R4; the alleged duplicate cannot be confirmed from this payload alone, so it is not a HOLD.
  拟议修正：Remove the duplicate/Master remark from the usage note and display x; leave any de-duplication decision to Master (flagged by master_hold).

### R2：例句未示范目标表达（10 条）

- **SC1341-KU-00318**（lather up，SC50-0002 rank 84，G1，master_hold=false）：Revised example uses 'it lathers' and never shows the taught phrasal verb 'lather up', so it fails R2.
  拟议修正：Restore 'lather up' in the example, e.g. 'Rub some soap between your hands to lather up.'
- **SC1341-KU-00591**（change a stained shirt，SC50-0003 rank 183，G1，master_hold=false）：Revised example uses 'change out of my stained shirt', a different construction that never demonstrates the taught expression 'change a stained shirt', so it fails R2.
  拟议修正：Restore an example containing the taught expression, e.g. 'I had to change my stained shirt before the meeting.', and replace the clause-like collocation 'change your shirt because it's stained' with a real collocation.
- **SC1341-KU-00636**（put away clutter，SC50-0004 rank 24，G2，master_hold=true）：Revised example 'I put away the scattered items on my desk' contains no occurrence of the target lemma clutter, so it fails to demonstrate the taught expression under R2.
  拟议修正：Restore an example containing the expression, e.g. 'I put away the clutter on my desk before starting work.'
- **SC1341-KU-01010**（shrunk clothes，SC50-0005 rank 188，G1，master_hold=true）：The example uses verb 'shrank' and never shows 'shrunk clothes' (R2), and display x leaks the internal remark '是否应改词头须经Master审定' to learners (R4).
  拟议修正：Use an example containing 'shrunk clothes' (e.g. 'These shrunk clothes no longer fit me.') and remove the Master-review remark from the usage note and display x.
- **SC1341-KU-01048**（laundry load，SC50-0006 rank 3，G6，master_hold=false）：Revised example uses 'load of laundry' instead of the taught expression 'laundry load', so the example no longer demonstrates the target (R2).
  拟议修正：Restore an example using 'laundry load', e.g. 'This laundry load is too large for the washing machine.'
- **SC1341-KU-01213**（spin failure，SC50-0006 rank 168，G6，master_hold=false）：Revised example 'failed to spin' omits the target 'spin failure' entirely (R2), and the usage note and display contain the internal remark '原表达是否保留为独立教学目标须Master裁定' (R4).
  拟议修正：Restore an example using 'spin failure' and delete the internal Master remark from usage_note and display.
- **SC1341-KU-01234**（color bleed，SC50-0006 rank 189，G1，master_hold=true）：Example and collocations use 'color bleeding' and never show the taught expression 'color bleed' (R2), and display x leaks the internal de-duplication remark '须由Master审核是否去重' (R4).
  拟议修正：Restore 'color bleed' in the example and collocations and remove the Master-review remark from the usage note and display x.
- **SC1341-KU-01637**（warm up a late dinner，SC50-0008 rank 185，G7，master_hold=true）：The revised example no longer demonstrates 'warm up a late dinner' (R2), and the learner-visible note contains an internal CG-MASTER ruling remark (R4).
  拟议修正：Restore an example using 'warm up a late dinner' and remove the '需CG-MASTER作出裁定' sentence from the learner-visible note; keep the identity question out of band.
- **SC1341-KU-01664**（dishwasher residue，SC50-0009 rank 24，G1，master_hold=true）：Revised example uses bare 'residue' and neither the example nor the collocations ever show the taught expression 'dishwasher residue', so it fails R2.
  拟议修正：Restore an example containing 'dishwasher residue', e.g. 'There was white dishwasher residue on some glasses after the cycle.'
- **SC1341-KU-01749**（empty the filter，SC50-0009 rank 109，G8，master_hold=true）：Revised example never demonstrates 'empty the filter': 'emptied' takes 'debris trap' as object and 'filter' appears only as object of 'cleaned' (R2).
  拟议修正：Rewrite example to demonstrate the taught phrase, e.g. 'Empty the filter before you run the next cycle.' with matching example_zh.

### R5：静默改源义（7 条）

- **SC1341-KU-00753**（separate clean clothes，SC50-0004 rank 141，G1，master_hold=true）：Revised meaning_zh drops the defining '与脏衣服' from the source sense '将干净衣服与脏衣服分开', silently changing the source sense under R5.
  拟议修正：Restore meaning_zh and display m to the source sense '将干净衣服与脏衣服分开'.
- **SC1341-KU-00804**（breakable，SC50-0004 rank 192，G3，master_hold=false）：Revised meaning_zh '易碎的；容易破损的' and the usage note drop the source sense's 摔坏 (broken by falling) restriction, silently changing the source sense 容易摔坏的 (R5).
  拟议修正：Restore meaning_zh to 容易摔坏的 and remove the '不限于摔落造成的损坏' broadening claim from the usage note.
- **SC1341-KU-01159**（put clothes away，SC50-0006 rank 114，G6，master_hold=false）：Revised meaning drops '干净' from the source sense '把干净衣服收起来' and the note explicitly denies the clean implication, changing the source sense without Master gating (R5).
  拟议修正：Restore '干净' in meaning_zh ('把干净衣服收好') or route the sense change to Master for a ruling.
- **SC1341-KU-01235**（take the laundry out，SC50-0006 rank 190，G1，master_hold=true）：Revised meaning demotes the source sense's defining '从洗衣机' to a learner-visible '(本场景)' meta tag and leads with the broader '把衣物拿出来', changing the source sense under R5.
  拟议修正：Restore meaning_zh and display m to the source sense '把衣物从洗衣机取出衣物' and keep the scope clarification only in the usage note.
- **SC1341-KU-01397**（golden brown，SC50-0007 rank 162，G3，master_hold=true）：Revised meaning_zh '金褐色的；金棕色的' and the usage note ('不等于单纯的黄色') change the source sense 金黄色的, silently redefining the source sense (R5).
  拟议修正：Restore meaning_zh to 金黄色的 and remove the redefinition from the usage note; keep the example and collocations.
- **SC1341-KU-01482**（serving，SC50-0008 rank 30，G3，master_hold=true）：Revised meaning_zh drops the source sense's 上菜 and substitutes 食用份量, and the usage note redefines the sense ('上菜动作一般用serve，须另辨析'), silently changing the source sense 一份（食物）；上菜 (R5).
  拟议修正：Restore meaning_zh to 一份（食物）；上菜 and rewrite the usage note to cover the source sense instead of redefining it.
- **SC1341-KU-01872**（recover，SC50-0010 rank 33，G8，master_hold=false）：Revised meaning adds '恢复；康复' beyond the source sense '恢复体力', silently broadening the sense without Master gating (R5).
  拟议修正：Restore meaning_zh to '恢复体力' and trim the usage note to the scene scope of recovering energy after exertion.

### R3：译文加词 / 误译（3 条）

- **SC1341-KU-01367**（adjust the seasoning，SC50-0007 rank 132，G6，master_hold=false）：Revised example_zh adds '咸淡' which the English example 'Adjust the seasoning after tasting' never states (R3).
  拟议修正：Revert example_zh to '尝过以后再调整调味。'
- **SC1341-KU-01526**（trivet，SC50-0008 rank 74，G7，master_hold=false）：Revised example_zh mistranslates 'casserole dish' as '烤盘' and renders trivet as '隔热托' instead of the taught '隔热垫'.
  拟议修正：Restore a faithful example_zh such as '热砂锅下面垫个隔热垫。'.
- **SC1341-KU-01645**（scrub brush，SC50-0009 rank 5，G7，master_hold=false）：Revised example_zh renders 'a scrub brush' as '硬毛刷', adding '硬毛' that the source sentence never states (R3).
  拟议修正：Change example_zh to '我用刷洗刷清理锅上粘牢的食物残渣。'.

### R1：搭配栏无真搭配（1 条）

- **SC1341-KU-01210**（drainage problem，SC50-0006 rank 165，G2，master_hold=false）：Collocation column has no genuine collocation under R1: it is the expression alone plus 'washer drainage problem', a mere noun compound of the expression.
  拟议修正：Replace 'washer drainage problem' with a genuine collocation, e.g. 'fix a drainage problem' or 'have a drainage problem'.

### 其他：例句译文与修订释义自相矛盾（3 条）

- **SC1341-KU-01771**（burnt-on，SC50-0009 rank 131，G8，master_hold=true）：Example_zh still renders burnt-on food as '烧结的食物残渣', reintroducing the technical '烧结' nuance the revised meaning and note explicitly reject.
  拟议修正：Change example_zh to match the revised meaning, e.g. '先浸泡烧焦粘牢的食物再刷洗。'
- **SC1341-KU-01815**（damaged nonstick pan，SC50-0009 rank 175，G8，master_hold=true）：Example_zh still says '涂层损坏的不粘锅', asserting coating damage that the revised meaning and note explicitly say is not necessarily the case.
  拟议修正：Change example_zh to '这口损坏的不粘锅该换了。' to match the revised meaning.
- **SC1341-KU-02004**（bright light，SC50-0010 rank 165，G8，master_hold=true）：Example_zh still says '刺眼的灯光', adding the glaring nuance the revised meaning and note explicitly say is not entailed by bright light.
  拟议修正：Change example_zh to '明亮的灯光让我睡不着。' to match the revised meaning.

注：01010、01213、01234、01637 同时触犯 R2 与 R4，在两节各列一次；REVISE 去重共 35 条。

## 5. HOLD 明细（3 条）

- **SC1341-KU-00994**（put dishes away，SC50-0005 rank 172，G5，master_hold=true）：R7 确认与 SC1341-KU-01659 重复——同一表达、同一释义、同一晾干后收回例句，分属 SC50-0005 / SC50-0009，无 Master 裁决。
- **SC1341-KU-01659**（put dishes away，SC50-0009 rank 19，G7，master_hold=true）：R7 确认与 SC1341-KU-00994 重复（同上）；两侧评审员独立确认一致。
- **SC1341-KU-01450**（prep ingredients，SC50-0007 rank 215，G3，master_hold=false）：R7 确认与 SC1341-KU-01452 'prep the ingredients' 重复——同一场景、同一学习目标，仅差冠词 the，释义与搭配重叠，无 Master 裁决保留哪条。注意：01450 本身 master_review_required=false，此 HOLD 是本次评审新立的 Master 裁决需求。

另：01452 判 REVISE（R4，usage_note 仍含'是否保留独立教学KU需核对同场景重复项'），与 01450 构成同一重复对的两面；去重裁决与 R4 备注清除两事并行。01992、02028、01234 三条修订稿自称与同场景另一 KU 重复，但评审员手头无配对条目可核实，且各条已有具体语言缺陷，故判 REVISE 而非 HOLD，去重留待 Master（master_hold=true）。

## 6. 编辑行（27 条）

源 CSV `source` 列为 editorial_addition（17 条）或 editorial_gap_candidate（10 条）的修订项，按 CSV 现状照常判，内容 PASS 不等于源身份已认证。

| KU | 表达 | 来源 | verdict |
|---|---|---|---|
| SC1341-KU-00234 | turn on the alarm | editorial_addition | PASS |
| SC1341-KU-00406 | apply lip balm | editorial_addition | PASS |
| SC1341-KU-00407 | brush twice a day | editorial_addition | PASS |
| SC1341-KU-00408 | wash off makeup | editorial_addition | PASS |
| SC1341-KU-00610 | get changed | editorial_addition | PASS |
| SC1341-KU-00636 | put away clutter | editorial_addition | REVISE |
| SC1341-KU-00818 | put things back where they belong | editorial_gap_candidate | PASS |
| SC1341-KU-00819 | clear the clutter | editorial_gap_candidate | PASS |
| SC1341-KU-00820 | find a place for everything | editorial_addition | PASS |
| SC1341-KU-00821 | sort through | editorial_addition | PASS |
| SC1341-KU-00853 | clean as you go | editorial_addition | PASS |
| SC1341-KU-01044 | keep up with housework | editorial_gap_candidate | PASS |
| SC1341-KU-01045 | do the housework | editorial_addition | PASS |
| SC1341-KU-01065 | hang clothes to dry | editorial_gap_candidate | PASS |
| SC1341-KU-01234 | color bleed | editorial_gap_candidate | REVISE |
| SC1341-KU-01235 | take the laundry out | editorial_addition | REVISE |
| SC1341-KU-01449 | mise en place | editorial_gap_candidate | PASS |
| SC1341-KU-01450 | prep ingredients | editorial_gap_candidate | HOLD |
| SC1341-KU-01451 | cook over medium heat | editorial_addition | PASS |
| SC1341-KU-01452 | prep the ingredients | editorial_addition | REVISE |
| SC1341-KU-01472 | help yourself to seconds | editorial_addition | PASS |
| SC1341-KU-01639 | pass the dish around | editorial_gap_candidate | PASS |
| SC1341-KU-01640 | silverware | editorial_addition | PASS |
| SC1341-KU-01837 | scrape food scraps into the bin | editorial_gap_candidate | PASS |
| SC1341-KU-01838 | let the dishes air-dry | editorial_gap_candidate | PASS |
| SC1341-KU-01839 | let the dishes soak | editorial_addition | PASS |
| SC1341-KU-01856 | watch TV | editorial_addition | PASS |

其中 REVISE 4 条（00636、01234、01235、01452）、HOLD 1 条（01450），其余 22 条 PASS。值得注意：CG-QA V20 裁决为 REVISE 的内部备注项中，在批内的 6 条（00818–00821、01045、01065）本次修订已清除备注，全部判 PASS；另 2 条（01043、01066）不在 ALL219 索引与 CG-QA 219 修复队列中，本批未审（合并核验时发现原稿误写为 8 条全部在批内通过，已更正）。

## 7. 校准表与合并核验

冻结校准表（八组共用，评审中未改动）：

- R1 collocations: collocations[0]==expression alone is NOT a defect if the column contains another genuine collocation. REVISE only if the whole column has no genuine collocation (only synonyms/compounds/singular-plural variants/paraphrases) or another real defect.
- R2 example form: the example must demonstrate the taught expression — its base form or a natural inflected form of the same lemma and same part of speech. Inflection alone is not a defect. If the target lemma is entirely absent, or what appears is a different word / different part of speech (e.g. verb "zip up" for noun "zipper"), REVISE.
- R3 translation: a Chinese translation that adds a word the source never states is REVISE.
- R4 learner-visible internal remarks: if usage_note or display.x contains internal review remarks, source markers, or any non-learning content visible to learners, REVISE (settled by CG-QA V20 adjudication on 00818-00821, 01043, 01045, 01065, 01066).
- R5 meaning: revised meaning_zh must match the source sense_zh; a revision must not silently change the source sense.
- R6 Master-gated: for master_review_required=true items, judge ONLY the language content. If the language is sound, verdict PASS with master_hold=true (this is not an approval; release stays blocked). If the language is still defective, REVISE. If the source identity itself is under Master dispute and the language cannot be judged, HOLD with the reason.
- R7 duplicates: if two KUs look like the same learning target (e.g. prep ingredients 01450/01452, bad breath 00297/00365), compare both contents; if confirmed duplicate and no Master ruling exists, HOLD and list it separately.

**R1 判例依据**：沿用 300 条批校准判例——前 1,032 条同结构（collocations[0]==expression 的固定作者模板）454 条中 443 PASS / 11 REVISE，首项自重复本身不是 defect。

**R2 依据**：例句须示范所教表达；自然屈折形（stood、shrank、lathered 等同一词元同一词性的形态变化）即示范，不算缺陷；只有目标词元完全缺席、或出现的是另一词/另一词性时才 REVISE。本批协调者复核：PASS 项中仅 00097 stand up 触发粗筛（stood up 为不规则过去式，实为示范），0 漏判。

**R5 判线（合并核验确认一致）**：修订放宽/收窄源义但在 usage_note 中明示、且 master_hold=true 的，判 PASS（如 00399、00152、00795、00837、00579、00332、00385、00404）；静默删改源义定义要素的，判 REVISE（如 00753 删'与脏衣服'、01159 删'干净'且备注否认、00804 删'摔坏'限定、01397 金黄色→金褐色、01482 删'上菜'、01872 加'恢复；康复'、01235 把'从洗衣机'降格为 (本场景) 标签）。00364 blemish 删'痘痘'但 usage_note 保留'有时可指痘痘'，判 PASS——与 01159 的否认式备注正好构成对照。

**合并核验（协调者）**：219/219 覆盖、ID 唯一、master_hold 与 master_review_required 逐条一致（101 项）；全部 38 条非 PASS 逐条对修订原文实核，所引缺陷全部属实；PASS 项 R4 关键词扫查 5 命中全为误报（冰箱内部/食物内部/垃圾桶内部的合法'内部'一词）；R1 单一条目自重复 0 项；分层抽查 PASS 22 条（12 条边界 + 10 条分层随机）全部成立；全集无 U+FFFD、无控制字符。**合并阶段改判 0 条**，八组 verdicts 原样采纳。

## 8. 交付与状态

- 本文件与配套 JSON 为 MU-ENTEACH 单遍独立复审证据，未提交任何分支，未发 Issue 评论。
- 批准（PASS）181 条，其中 78 条 master_hold=true、103 条无 hold；REVISE 35 条、HOLD 3 条，见 JSON `verdicts` 与 `approved_ku_ids` / `master_hold_ku_ids`。
- 全部 219 条 activation_allowed / production_ready / publishable 均为 0；正式可播放 KU 仍为 0；须 CG-QA 独立对账与 CG-MASTER 裁决后方可谈下一步。
