# S113 reservation 修订内容 Muse 独立复审（仅 reservation 一条）

- 复审人：MU-ENTEACH（英文词库教学线-配合），独立判断，不复制 ChatGPT 结论
- 复审对象：`tools/answer-enrichment/s113-targeted-revision-and-provenance.v1.json`（commit `6f9722a`）中 reservation 一条（`w_3084_reservation_ku_s01`，scene_rank 3）
- 对照：ChatGPT 语义审查（commit `75d1325`，reservation：REVISE_GLOSS，搭配/例句/辨析均 PASS）；S113 审计提案（commit `4c43c16`，reservation 为 HIGH_PRIORITY_SEMANTIC_SPLIT_CANDIDATE）
- 范围声明：**本复审仅 verdict reservation 一条的教学记录内容。** guest 与 cancellation 不在本复审范围（其标签来自修订文件本身，不由本复审背书）；S113 成员资格与正式启用不在本复审范围（见第 4 节）。

## 1. 复审记录原文（6f9722a）

- gloss_zh：预订；预先订好的房间或服务
- gloss_en：an arrangement made in advance to keep a hotel room or another service available for someone
- collocation：make a reservation · confirm a reservation · hotel reservation
- example_en：I'd like to confirm my reservation for tonight.
- example_zh：我想确认今晚的酒店预订。
- contrast_note：reservation 在酒店场景指预订；booking 常可指同一预订安排。have reservations about something 则表示对某事有疑虑或保留意见，属于不同义项，不可将“保留意见”混进酒店预订释义。
- sources：剑桥 learner-english/reservation（ARRANGEMENT vs DOUBT）、剑桥 english/reservation（make/confirm a reservation；reservations about）

## 2. 逐项结论

| 审查项 | 结论 | 理由 |
|---|---|---|
| 英文释义 | PASS | 预订安排义准确：提前安排、为某人保留酒店房间或服务。符合酒店预订义，不含疑虑义。 |
| 中文释义 | PASS（附小注） | “保留意见”已完全移出释义；后半“预先订好的房间或服务”覆盖 booking 义下“被预订之物”这一子义（剑桥同义下亦列安排与被预订物两项），合理。小注：英汉释义不完全平行（英文仅“安排”，中文含“安排 + 被预订物”），可接受；如求严格平行，英文可补 “or the room or service so reserved”。不构成失败，与 ChatGPT 建议的中文释义（预订；预订的房间或名额）同义、同结构。 |
| 例句与翻译 | PASS | confirm my reservation for tonight 为标准预订语境，无歧义；译文“我想确认今晚的酒店预订”准确、自然，语境对应精确。 |
| 搭配 | PASS | make / confirm / hotel reservation 均为标准搭配。 |
| 辨析注 | PASS | 正确把 have reservations about（疑虑义）隔离为不同义项并明言不可混入；booking 可指同一预订安排的说明在酒店语境准确。 |
| 核心缺陷修复（原缺陷：中文释义合并“预订 + 保留意见”） | PASS | 本教学记录中缺陷已修复：保留意见仅出现在辨析注中作为被排除的不同义项，释义本身不再合并两义。 |
| 来源与版权 | PASS（附说明） | 引用剑桥页面作义项区分依据；provenance 诚实声明释义与例句为新写或内部草稿、未逐字复制剑桥内容、版权 NOT_CLEARED、URL 仅证语言学来源不等于转载许可。本复审亲自取回两页：学习者页多语翻译印证多义并存（德语 Reservierung/Vorbehalt、泰语 预订/被预订物/疑虑）；完整页例句印证复数 reservations 表疑虑的真实用法。定义正文两页均未在文本抓取中渲染，故本复审不引用剑桥定义原文措辞；上述判断基于语言学分析与可验证的用法证据，不依赖未渲染的定义文本。 |
| 身份 | PASS（无变更） | ku_id 原样保留，official_sense_id 为 null，未创设新 ID。审计提案要求的“先确定旧 KU 用法再分配新身份”属于词库生产线后续工作，本教学修订不执行、也不应擅自执行 KU 拆分。 |
| 运行影响 | PASS（无变更） | 6f9722a 仅新增修订 JSON 一文件；Runtime、SRS、应用均未动；修订文件状态 STAGING_ONLY、production_ready false、无自动激活。 |

## 3. 总结论与对 ChatGPT 的分歧

- **Muse 总结论：PASS（仅 reservation 教学记录内容层）。** ChatGPT 的 REVISE_GLOSS 要求（把通用占位释义改为预订专义）已被本修订执行：释义已专义化，ChatGPT 已 PASS 的搭配、例句、辨析均保留。
- **语义分歧：0。** 修订释义措辞与 ChatGPT 建议释义措辞不同，但义项同一，不构成散歧。ChatGPT 的其余 PASS 项本复审独立复核后同样 PASS。

## 4. 本复审不裁决的事项（明确边界）

- **S113 成员资格：NOT_ESTABLISHED（维持修订文件原判）。** 历史 top100 KU 行 alone 不构成 canonical 成员资格（需 scene_id + 真实 sense_id + 审查/证据字段）；本复审不授予成员资格。
- **S113 正式启用：不批准。** taxonomy 冲突未解决（20x25、catalog-v0.2 草稿、V40 历史均为 预订酒店；taxonomy-v2 为 公园游览，mappingStatus pending）。交接要求的“冲突解决前不正式启用 S113 三条”继续有效；启用决定属场景负责人与主开发，本复审的 PASS 仅指教学记录内容，不等于启用许可。
- **guest 一条：** 修订文件标注 DUAL_AI_PASS，但所给三件工件中无 Muse 侧 guest 结论，本复审不确认该标签；guest 仍待 Muse 侧独立结论（若他处已有，不在本复审证据内）。
- **cancellation 一条：** 不在本复审范围，不 verdict（其时间边界注 ChatGPT 已提 PASS_WITH_TIME_BOUNDARY_NOTE，修订文件已收 optional_edit；供教学线参考）。
- **后续身份跟进：** 若词库生产线日后拆分 reservation KU，本教学记录须重新绑定到正确 KU；该跟进不改变本次内容 PASS。
