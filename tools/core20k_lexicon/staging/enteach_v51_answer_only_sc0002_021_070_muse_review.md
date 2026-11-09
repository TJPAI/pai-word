# MU-ENTEACH 独立复审：Scene1341 V51 答案型 SC50-0002 ranks 21–70

- 对象：教学分支 `answer-enrichment-main-dev-20261026` HEAD `6339e45`（`6339e459c42cf8f531ba203e706faef93ffa44f7`），
  Pack `tools/answer-enrichment/scene1341-v51-sc0002-answer-only-021-070.v2.json`
  （blob `f60431b82d2797c399cf391bf7af0752476f16cc`，50 条，rank 21–70，提交 `6339e45`）；
  schema 答案型 V2，`release_status: EDITORIAL_STAGING_ONLY`，`activation_allowed: false`（每条记录）。
- 来源：`cg-main-fourline-integration-20261026` 分支
  `tools/integration/scene1341-ranked/v51-ranked.csv`（blob `eaa6d729…`，2,038 行），
  场景 SC50-0002 洗漱与个人清洁，rank 21–70。
- 任务来源：Issue #1 评论 6744354493（23:46 全新 KU 生产）与 6745276777（00:25 答案型重启，
  取代旧四选题任务）；CG-QA 对账评论 6747925757（02:20）请求补查 SC50-0002 Rank 21–70 的 50 条。
  **注意：CG-ENTEACH 尚未在 Issue 上正式交付 ranks 21–70，也未请审；本复审是用户
  02:32 点选后，按教学分支 HEAD `6339e45` 的固定版本直接复审，不冒充已交付批次。**
- 复审性质：**非盲审作者身份**（CG-ENTEACH 为作者），但**盲判他线 verdict**——
  两名复核员只凭包文件与源 CSV 判读，未读任何 Issue 评论，未查任何他线 verdict、
  总账或对账结果，各组互不见 verdict，判完才合并。仅答案页教学内容层，不审题目
  （本题无题目字段）。
- 方法：50 条分 2 组（rank 21–45、46–70，各 25 条），由 2 名复核员各自独立判读；
  协调员合并后核对覆盖（50 条、SC1341-KU-00255..00304 各恰一次），
  并以 scene_id + rank 逐条独立重算身份绑定（CSV 内 rank 按场景重起，须按场景限定查找；
  全局 rank 查找会撞到其他场景的同 rank 行）。
- 判读标准（与此前各批一致）：身份绑定对源 CSV 行（expression / sense_zh / scene_id /
  rank / sense_id / tier）；例句英文自然且真实体现释义义；汉译忠实自然；搭配真实且贴合该义；
  usage/contrast 注真实、在范围内、有用；meaning_zh == sense_zh；display 字段与 answer 字段一致；
  无 question / correct_choice_id 字段。REVISE 只给真实缺陷（须附具体修正方案），
  HOLD 只给身份或义确实不清者，不用 HOLD 装风格问题；轻微不完美但正确自然者判 PASS。
- 语义依据与限制：V51 CSV 未附冻结英文定义，判读依据为源 sense_zh、expression 与
  场景上下文；不凭中文像自动 PASS，每条均核对英文例句是否真实体现该义。
  本复审为 Muse 教学线独立判断，**不是双 AI 认证**：双 AI 对账须待 CG-QA verdict 后
  由 CG-QA 按版本规则确认，本复审不代记双 AI 结论。

## 结论

**PASS 49 / REVISE 1 / HOLD 0。** 身份绑定 50/50（协调员 scene-scoped 独立重算；
各复核员亦逐条核对）；无题目字段 50/50；display 与 answer 一致性 50/50；
meaning_zh == sense_zh 50/50；per-record activation_allowed false 50/50。
首 20 条校验器（`test-scene1341-v51-answer-only-v2.mjs`）只断言首 20 条包，
不适用于本批，故本批不报 STRUCTURE_PASS；本批的结构与身份改由上述独立重算覆盖。

| scene_ku_id | expression | 结论 | 备注 |
|---|---|---|---|
| SC1341-KU-00255 | rinse thoroughly | PASS |  |
| SC1341-KU-00256 | rinse your hair | PASS |  |
| SC1341-KU-00257 | comb your hair | PASS |  |
| SC1341-KU-00258 | shave your face | PASS |  |
| SC1341-KU-00259 | shave your legs | PASS |  |
| SC1341-KU-00260 | rinse out your eyes | PASS |  |
| SC1341-KU-00261 | rinse off residue | PASS |  |
| SC1341-KU-00262 | personal hygiene | PASS |  |
| SC1341-KU-00263 | clean | PASS |  |
| SC1341-KU-00264 | scrub | PASS |  |
| SC1341-KU-00265 | wipe | PASS |  |
| SC1341-KU-00266 | dry | PASS |  |
| SC1341-KU-00267 | freshen up | PASS |  |
| SC1341-KU-00268 | wash up | PASS | 例句仅举美式义；用法注已覆盖英式“洗碗”义 |
| SC1341-KU-00269 | get clean | REVISE | 例句汉译加“身上的泥土”，英文例句无此内容 |
| SC1341-KU-00270 | bathroom | PASS |  |
| SC1341-KU-00271 | faucet | PASS |  |
| SC1341-KU-00272 | tap | PASS |  |
| SC1341-KU-00273 | running water | PASS | 例句汉译“自来水”与释义本身一致 |
| SC1341-KU-00274 | warm water | PASS |  |
| SC1341-KU-00275 | cold water | PASS |  |
| SC1341-KU-00276 | hot water | PASS | 例句略同义反复，但作提醒语自然、贴合释义 |
| SC1341-KU-00277 | body wash | PASS |  |
| SC1341-KU-00278 | washcloth | PASS |  |
| SC1341-KU-00279 | hand towel | PASS |  |
| SC1341-KU-00280 | bath towel | PASS |  |
| SC1341-KU-00281 | mirror | PASS |  |
| SC1341-KU-00282 | toiletries | PASS |  |
| SC1341-KU-00283 | toiletry bag | PASS | “travel toiletry bag”为标准产品说法 |
| SC1341-KU-00284 | bath mat | PASS | 释义含“不一定防滑”限定，例句与注一致 |
| SC1341-KU-00285 | showerhead | PASS |  |
| SC1341-KU-00286 | drain | PASS | 例句举名词“排水口”义；用法注覆盖动名词两用 |
| SC1341-KU-00287 | water pressure | PASS |  |
| SC1341-KU-00288 | electric toothbrush | PASS | “recharge an electric toothbrush”对充电设备合乎惯用 |
| SC1341-KU-00289 | bristles | PASS |  |
| SC1341-KU-00290 | dental floss | PASS |  |
| SC1341-KU-00291 | mouthwash | PASS |  |
| SC1341-KU-00292 | dental hygiene | PASS | 用法注正确区分 dental hygiene 与 personal hygiene |
| SC1341-KU-00293 | tongue | PASS | 用法注 silent “gue” 发音说明为真 |
| SC1341-KU-00294 | gums | PASS | 用法注正确区分 dental “gums” 与 chewing gum |
| SC1341-KU-00295 | plaque | PASS | 用法注正确排除 plaque 的纪念牌义 |
| SC1341-KU-00296 | cavity | PASS |  |
| SC1341-KU-00297 | bad breath | PASS | 用法注 morning breath 区分正确 |
| SC1341-KU-00298 | razor | PASS |  |
| SC1341-KU-00299 | shaving cream | PASS |  |
| SC1341-KU-00300 | shaver | PASS | 用法注正确对照 shaver 与 razor |
| SC1341-KU-00301 | face wash | PASS | 用法注 face wash 作产品一般不可数为真 |
| SC1341-KU-00302 | cleanser | PASS | 汉译补“清洁皮肤”为隐含义，未改义 |
| SC1341-KU-00303 | moisturizer | PASS |  |
| SC1341-KU-00304 | lotion | PASS | “light”译为“质地轻薄”贴切 |

## REVISE / HOLD 明细

- **SC1341-KU-00269 get clean（rank 35）——REVISE。**
  释义：洗干净。例句英文：`I want to get clean after working in the garden.`
  例句汉译：`在花园干活后，我想洗干净身上的泥土。`——汉译加入了英文例句没有的
  “身上的泥土”，插入了具体对象；核心释义虽保住，译文不忠实。
  拟议修正：例句汉译改为 `在花园干活后，我想洗干净。`，display.example_zh 同步改。
  无 HOLD 条目。

## 非阻断观察（不构成 verdict，均已按不拔高规则判 PASS）

- SC1341-KU-00268 wash up：例句仅举美式义，用法注已正确覆盖英式“洗碗”义。
- SC1341-KU-00273 running water：例句汉译“自来水”与释义本身（“流动的自来水”）一致。
- SC1341-KU-00276 hot water：例句 `the hot water is very hot` 略同义反复，但作提醒语自然、贴合释义。
- SC1341-KU-00283 toiletry bag / SC1341-KU-00288 electric toothbrush / SC1341-KU-00300 shaver：
  “travel toiletry bag”“recharge an electric toothbrush”等说法对充电设备与旅行用品合乎惯用。
- SC1341-KU-00302 cleanser：汉译补“清洁皮肤”为隐含义，未改义。

## 批准列表（PASS，49 条，供 CG-MAIN SRS 门禁）

以下 49 个 scene_ku_id 为本批 PASS 结论，与裁决表逐条一致（SC1341-KU-00255..00304 除 REVISE 的 00269）：

SC1341-KU-00255, SC1341-KU-00256, SC1341-KU-00257, SC1341-KU-00258, SC1341-KU-00259, SC1341-KU-00260, SC1341-KU-00261, SC1341-KU-00262, SC1341-KU-00263, SC1341-KU-00264, SC1341-KU-00265, SC1341-KU-00266, SC1341-KU-00267, SC1341-KU-00268, SC1341-KU-00270, SC1341-KU-00271, SC1341-KU-00272, SC1341-KU-00273, SC1341-KU-00274, SC1341-KU-00275, SC1341-KU-00276, SC1341-KU-00277, SC1341-KU-00278, SC1341-KU-00279, SC1341-KU-00280, SC1341-KU-00281, SC1341-KU-00282, SC1341-KU-00283, SC1341-KU-00284, SC1341-KU-00285, SC1341-KU-00286, SC1341-KU-00287, SC1341-KU-00288, SC1341-KU-00289, SC1341-KU-00290, SC1341-KU-00291, SC1341-KU-00292, SC1341-KU-00293, SC1341-KU-00294, SC1341-KU-00295, SC1341-KU-00296, SC1341-KU-00297, SC1341-KU-00298, SC1341-KU-00299, SC1341-KU-00300, SC1341-KU-00301, SC1341-KU-00302, SC1341-KU-00303, SC1341-KU-00304

## 未决与不宣称

- CG-ENTEACH 尚未在 Issue 上交付 ranks 21–70；本复审只对教学分支 HEAD `6339e45` 的
  固定版本负责，不代替 CG-ENTEACH 的交付。
- CG-QA 的独立语义复核与双 AI 对账仍待进行；本复审不代记双 AI 结论。
- `production_ready: false`、`activation_allowed: false`、`publishable: 0` 均不变，
  本复审不批准启用、不批准发布。
- V51 剩余 1,734 条未生产，不在本复审范围。先前各批的 REVISE（00006 snooze、00117 bedside table、
  00239 shower gel）修正尚未落地，不在本批范围。
