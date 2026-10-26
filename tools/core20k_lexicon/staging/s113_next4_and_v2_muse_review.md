# S113 NEXT4 四条 + guest/cancellation v2 Muse 独立复审

- 复审人：MU-ENTEACH（英文词库教学线-配合），独立判断
- 诚实声明：**本复审非盲审。** 复审前已通过 Issue 读到 CG-ENTEACH 交付、ChatGPT 审核、CG-QA 与 CG-ENLEX 的评论；以下结论为本复审逐条独立分析，不复制他方结论；与他方一致处逐项说明理由，不以一致代替论证。
- 复审对象 A：NEXT4 精确版本（commit `2036066`，`s113-next4-hotel-booking-teaching-draft.v1.json`，EDITORIAL_DRAFT_UNCERTIFIED，production_ready false，activation_allowed false）
- 复审对象 B：旧三条 v2 交接（commit `744727a`，`s113-teaching-owner-handoff.v2.json`）中的 guest 与 cancellation 两条（版本匹配意见；reservation 不重复复核）
- 对照：ChatGPT NEXT4 审核（`05b2b21`）、ChatGPT v1 审查（`75d1325`）、CG-QA NEXT4 意见（confirmation REVISE_GLOSS_SCOPE）、CG-ENLEX 七 KU 审计（`1a1099a`，confirmation 边界、cancel 简化旗标）
- 不裁决：S113 成员资格（NOT_ESTABLISHED）、正式启用（activation false）、production_ready、来源转载许可（各记录自述未独立拉取/未取得许可）、Batch93 隔离 E2E（用户决定已取消，不碰）

## 1. NEXT4 Runtime KU 绑定核查（正式 Runtime，SHA e91e2ab3…，本次重算）

| 词头 | Runtime 行 | 与草稿 core_rank | 兼容性 |
|---|---|---|---|
| hotel w_0771_hotel_ku01 | rank 525，sense，酒店；旅馆 / place providing lodging，playable true | 525 ✓ | 中文释义与 Runtime 完全一致；英文教学释义为其语境展开，兼容 |
| availability w_3287_availability_ku_s01 | rank 4056，sense，可获得性；可用性 / 占位英文，playable true | 4056 ✓ | Runtime 为通用可获得义；教学收窄为客房义，属场景细化 |
| cancel w_2445_cancel_ku_s01 | rank 1171，sense，取消 / decide that something planned will not happen，playable true | 1171 ✓ | Runtime 为通用取消义，回答草稿 issue 注记：KU 确为通用义；教学收窄为预订取消，属场景细化 |
| confirmation w_3678_confirmation_ku_s01 | rank 3329，sense，确认；证实 / 占位英文，playable true | 3329 ✓ | Runtime 横跨 CERTAIN 与 PROOF（确认；证实）；教学取 CERTAIN/消息义，属场景细化 |

结论：四条 KU 全部在正式 Runtime 原样存在，rank/类别/可玩一致；草稿“需基底绑定核查”一项现已回答：绑定存在，义项关系均为通用义→场景细化，不得把教学收窄读作全局重定义。

## 2. NEXT4 逐条结论

### hotel（w_0771_hotel_ku01）：PASS
- 释义：酒店；旅馆 / a place where people pay to stay for a short time，准确标准。
- 搭配：book a hotel room · stay at a hotel · hotel reservation，标准；草稿“教 book a hotel room 而非默认包下整间酒店”的注记正确。
- 例句与翻译：We booked a hotel room for two nights. / 我们预订了一间酒店客房，住两晚。自然、无歧义，翻译准确。
- 辨析：hotel vs hostel（设施较简单、可能有多人宿舍）有“可能” hedged，准确，不作绝对质量断言。

### availability（w_3287_availability_ku_s01）：PASS（附非阻断风格注）
- 释义：（客房等的）可订情况；是否有空房 / the state of being available, especially whether rooms can be booked。义项正确且语境限定明确（草稿 issue 注记：通用 availability 可指日程/货物供应，本记录仅酒店客房义）。
- 风格注（非阻断，与 ChatGPT 建议实质一致）：中文“可订情况”略欠自然，ChatGPT 建议的“客房供应情况；是否有空房”更顺；但冻结草稿不改（CG-ENTEACH 已明言免版本漂移），风格注不改变 PASS。
- 搭配/例句/语法/辨析全 PASS：check room availability 等标准；例句问句与译文“还有没有空房”对应精确；不可数注记正确；availability（是否可获得）vs reservation（已作出的安排）区分正确。
- 来源说明：本复审拉取剑桥 availability 页时定义正文未渲染，仅语料例句印证通用“事物可获得”义；酒店收窄为场景应用，不受反证。

### cancel（w_2445_cancel_ku_s01）：PASS（场景收窄，全局义注记）
- 释义：取消（预订）/ to arrange for a booking or reservation not to go ahead。酒店语境准确；CG-ENLEX“英文释义简化”旗标的实质是：该英文释义只覆盖预订取消，而 Runtime KU 为通用取消义（行核查已证）。本复审判定：作为场景教学记录，收窄合法；不得把该释义读作 KU 的全局义。旗标已通过定域回答，不构成失败。
- 搭配/例句/语法/辨析全 PASS：cancel a reservation/booking、cancel without a fee 标准；例句与译文准确；canceled/cancelled 美英拼写注记正确；cancel（动词）vs cancellation（名词）、取消≠更改预订，正确。

### confirmation（w_3678_confirmation_ku_s01）：PASS（附非阻断 scope 对齐注）
- 释义：确认；（酒店预订的）确认信息 / a statement or message that confirms a reservation has been made。剑桥 CERTAIN 义（"a statement, often written, that an arrangement or meeting is certain"，例 Thank you for your booking. You will receive confirmation…）直接支持消息义；PROOF 义（证实某事为真）与 RELIGION 义不在本记录目标内，辨析排除宗教义正确。
- scope 注（非阻断）：中文释义首项“确认”略宽于英文的消息义（中文含行为+消息，英文仅消息），但括号（酒店预订的）确认信息 + 全消息侧的搭配与例句使目标义无歧义；下一版可对齐（删首项“确认”或英文补行为侧），本冻结版可接受。CG-QA 的 REVISE_GLOSS_SCOPE 旗标与本注观察相同、严厉度不同：本复审判为注记而非修订阻断；ChatGPT 侧为 PASS，故双AI双方仍为通过，不构成双AI分歧。
- 搭配/例句全 PASS：booking confirmation · confirmation email · confirmation number 标准；例句与译文准确。

### NEXT4 双AI算术
ChatGPT 4/4 可通过 + Muse 4/4 PASS（两项附非阻断注）= **双AI内容通过 4/4（注记不阻断）**。与 ChatGPT 实质分歧 0。

## 3. guest / cancellation v2 版本匹配意见

### 版本比对（v2 `744727a` vs v1 `6f9722a`）
- guest：释义、搭配、例句、译文逐字一致；辨析仅措辞微调（“是受到接待的”→“指接受接待的”），义项同一。**版本匹配：MATCH。**
- cancellation：释义、搭配、例句、译文逐字一致；辨析仅措辞微调（“指”→“表示”、“用于酒店时通常是”→“酒店语境通常为”、“不要与…混为一个教学义项”→“与…不同”），义项同一。**版本匹配：MATCH。**
- reservation：释义、搭配、例句、译文逐字一致，辨析同义微调；CG-ENTEACH 已记 muse_same_revision_verdict PASS，本复审不重复 verdict，仅确认版本一致。

### guest v2（w_1452_guest_ku_s01）：PASS
酒店住客细化（（酒店）住客；客人 / a person staying at a hotel），例句前台入住自然、翻译准确，guest vs host 辨析正确；Runtime 通用客人义（客人；嘉宾）不受影响。ChatGPT v2 PASS + Muse PASS = **DUAL_AI_PASS_CONTENT_ONLY（v2 版）**。修订文件旧 DUAL_AI_PASS 标签就此由本次显式复审接替。

### cancellation v2（w_6567_cancellation_ku_s01）：PASS（附非阻断时间边界注）
收窄为预订取消（取消预订；预订的取消 / the act of cancelling a booking or reservation），与行证据一致（Runtime 含行政注销，教学记录有意排除）；搭配标准；例句 Free cancellation is available until Friday. / 周五之前可以免费取消预订 自然、翻译准确；until Friday 是否含周五属政策细节，v2 保留“可澄清”注记已足够，不构成语义错误。ChatGPT v2 PASS + Muse PASS = **DUAL_AI_PASS_CONTENT_ONLY（v2 版）**。

## 4. 教学契约校验器实测（CG-ENTEACH d42fab0 交付，首次实机运行）

- 方法：git archive 取 answer-enrichment 分支整树（工具与 data/scene500 文件齐全），在该树内运行 `node tools/answer-enrichment/validate-s113-teaching-handoff.mjs`，脚本只读、无 Runtime/SRS 写。
- 结果：**exit 0**，输出 `{ok: true, records: 3, versionMatchedDualPass: 1, canonicalMembership: NOT_ESTABLISHED, publishable: 0, faultInjectionRejected: 8, faultInjectionTotal: 8}`。
- 含义：原候选/修订/v2 三文件 3 条 KU、V40 排名转录、字段完备、标点、official_sense_id null、双AI计数、taxonomy 冲突显式化、无正式 membership 全部通过；8 项故障注入全被拒绝。
- 提醒 CG-ENTEACH：校验器硬编码 `dualPass == 1`。本次 guest/cancellation PASS 后，若 v2 文件更新 verdict 为 3 项双AI通过，须同步更新校验器断言，否则校验器将误报失败。本复审不改 v2 文件（属 CG-ENTEACH），故本次运行结果仍以旧 v2（dualPass 1）为准。

## 5. 不裁决与下一步
- 不裁决：S113 成员资格、正式启用、production_ready、转载许可（各记录自述链接仅作参考、未独立拉取或未取得许可；本复审对 hotel/cancel 未拉取剑桥页，对 availability 定义未渲染、对 confirmation 定义已验证 CERTAIN/PROOF/RELIGION 三义）。
- reservation 不重复复核（已闭合）。
- 请 CG-ENTEACH：验收本复审并汇总为该线官方状态；更新 v2 文件 verdict 后同步更新校验器 dualPass 断言；membership 与启用仍待 CG-REC 正式映射与 CG-MAIN 集成决定。
