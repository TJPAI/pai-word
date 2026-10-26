# S113 三词正式 Runtime 原始行核验（只读抽取）

- 核验人：MU-ENTEACH（英文词库教学线-配合），只读核验，不改 Runtime、不改任何身份
- 方法：QA 分支脚本 `extract_s113_raw_rows.py`（commit `9494425`，未改动）+ 同结构直接词头查找；Runtime 为正式分支 `core20k-lexicon-production-v1` HEAD `c7aae5a`，gz SHA 本次重算 `e91e2ab3…`（712,478 B），schema `pai-core20k-runtime-v1`，20,000 词头
- 目的：补审计提案（`4c43c16`）与修复计划（`3b337cc`）自述的缺口——二者均声明未做原始行抽取（`row_level_runtime_verified: false` / `raw_gloss_rows_verified: false`）
- 本核验为行事实核验，不是教学内容复审（reservation 教学复审见 `cd07229`/`0b5d441`），不授予成员资格、不批准启用

## 1. 原始行（逐字）

| 词头 | Runtime 行 |
|---|---|
| guest | `[915, "guest", "n.", "/ɡˈɛst/", [["w_1452_guest_ku_s01", "sense", "客人；嘉宾", "a person invited to visit, stay, or take part in an event", true]]]` |
| reservation | `[4035, "reservation", "n.", "/rˌɛzɚvˈeɪʃən/", [["w_3084_reservation_ku_s01", "sense", "预订；保留意见", "core modern learner use of “reservation”", true]]]` |
| cancellation | `[5149, "cancellation", "n.", "/kˌænsəlˈeɪʃən/", [["w_6567_cancellation_ku_s01", "sense", "取消；注销", "core modern learner use of “cancellation”", true]]]` |

## 2. 结论

### 身份：3/3 确认（新鲜抽取）
修订文件（`6f9722a`）与修复计划（`3b337cc`）所称三条 ku_id 在正式 Runtime 中原样存在，rank/词头/类别（sense）/可玩（true）全部一致：guest 915/w_1452_guest_ku_s01、reservation 4035/w_3084_reservation_ku_s01、cancellation 5149/w_6567_cancellation_ku_s01。修复计划“身份来自既往登记册、非新鲜抽取”的保留就此被本次新鲜抽取取代；guest 身份为本次新增确认（修复计划未含 guest）。

### reservation 缺陷：行证实（强）
中文释义“预订；保留意见”把预订与疑虑两义字面合并于同一 KU；英文释义为通用占位符（"core modern learner use of …"），不是定义。审计提案的 HIGH_PRIORITY_SEMANTIC_SPLIT_CANDIDATE 由此从“用户观察 + 未验行”升级为行证据支持。修复计划的主/次义拆分方向（主义 预订；预约 / 次义 保留意见；顾虑）与行证据一致；旧 KU 保留给主主义、次义走增补登记的身份政策正确，分配权属词库生产线。

### cancellation：观察到掺入（弱于 reservation，需修正修复计划一句）
中文释义“取消；注销”含有行政性“注销”（登记/账户注销），与一般“取消”并列。修复计划“未独立观察到具体缺陷”一句现已过时：注销确在行中。是否构成需拆分的独立义项（还是近义 elaboration）属词库生产线判断；修订文件把教学义收窄为预订取消并在辨析中排除行政注销，方向一致。本核验只报行事实，不对 cancellation 教学内容 verdict（仍在复审范围外）。

### guest：行无缺陷
Runtime 义为通用客人义（受邀访问/停留/参与者），中英释义干净、无合并。修订文件的酒店住客释义属于场景细化，不是缺陷修复；ChatGPT“勿全局收窄基础义”的注记正确。

### 附带观察
- 英文占位释义非个例：reservation 与 cancellation 两行英文均为 "core modern learner use of …" 占位符；guest 行为正常定义。审计提案“占位释义可能系统性”风险在两行得到印证，全库扫描范围仍待定（非本任务）。
- 预订义分布：book ku02（预订/reserve）、reserve ku_s04（预订/arrange in advance…）亦有预订义，属正常词汇冗余，非错误。

## 3. 对前序文件的影响（只报 delta，不改他人文件）

- `4c43c16` 审计提案：reservation 缺陷由“未验行”升级为“行证实”；cancellation 由“AUDIT_REQUIRED”推进为“行中已见注销掺入”。
- `3b337cc` 修复计划：身份证据升级为新鲜抽取确认；cancellation“无具体缺陷”一句需修正；其余身份政策与状态（production_ready false）不变。
- `cd07229` reservation 教学复审：不受影响且得加强——教学修订的义项分离针对的是行证实的真实缺陷，不是假想缺陷。
- 本核验不改变：S113 成员资格（NOT_ESTABLISHED）、S113 启用（taxonomy 冲突未决）、三旗（release/production 仍 false）。
