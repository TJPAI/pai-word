# MU-ENTEACH 独立复审：Scene1341 V51 答案型 SC50-0002 ranks 71–174 + SC50-0003 ranks 1–20

- 对象：教学分支 `answer-enrichment-main-dev-20261026` HEAD `46e935a7`（`46e935a7c4a54f64ad36ec0e3c77540eadf65ae3`），
  四个包：
  - `tools/answer-enrichment/scene1341-v51-sc0002-answer-only-071-100.v2.json`
    （blob `ac8c7e35511e3ff77274a1462e9ba8159bdec463`，30 条，rank 71–100，提交 `a22c03be`）；
  - `tools/answer-enrichment/scene1341-v51-sc0002-answer-only-101-150.v2.json`
    （blob `700f0ee318cc026ef2d7ca94c788e7222106be1e`，50 条，rank 101–150，提交 `d1368ec1`）；
  - `tools/answer-enrichment/scene1341-v51-sc0002-answer-only-151-174.v2.json`
    （blob `dc8d607423b87ac67b20f3ab92efec9870c73c5c`，24 条，rank 151–174，提交 `3c436d89`）；
  - `tools/answer-enrichment/scene1341-v51-sc0003-answer-only-001-020.v2.json`
    （blob `410871bece458eb1b6e3330ae6594623cb334327`，20 条，rank 1–20，提交 `370de97e`）；
  schema 答案型 V2，`release_status: EDITORIAL_STAGING_ONLY`，`activation_allowed: false`（每条记录）。
- 来源：`cg-main-fourline-integration-20261026` 分支
  `tools/integration/scene1341-ranked/v51-ranked.csv`（blob `eaa6d729…`，2,038 行），
  场景 SC50-0002 洗漱与个人清洁（rank 71–174，104 条）与 SC50-0003 穿衣与搭配（rank 1–20，20 条）。
- 任务来源：CG-ENTEACH 评论 6758473033（审 rank 71–100）、6758516298（审 rank 101–150）、
  6758697389（审 rank 151–174 与 SC50-0003 rank 1–20）；CG-QA 评论 6758689022 请
  MU-ENTEACH/MU-QA 对 rank 71–150 的 80 条先独立复审再对账。
  **注意：教学分支此后已推进至 `1ad7e6e8`（478 条草稿，新增 SC50-0003 rank 21–70）；
  本复审只对固定版本 HEAD `46e935a7` 的 124 条负责，不覆盖此后新增内容。**
- 复审性质：**非盲审作者身份**（CG-ENTEACH 为作者），但**盲判他线 verdict**——
  四名复核员（每包一名）只凭包文件与源 CSV 判读，未读任何 Issue 评论，未查任何他线 verdict、
  总账或对账结果（包括 CG-QA 对 rank 71–150 的 80 条复审与 MU-QA 的并行复审），
  各组互不见 verdict，判完才合并。仅答案页教学内容层，不审题目（本题无题目字段）。
- 方法：124 条分 4 组（每包一组：30 / 50 / 24 / 20 条），由 4 名复核员各自独立判读；
  协调员合并后核对覆盖（124 条、SC1341-KU-00305..00428 各恰一次），
  并以 scene_id + rank 逐条独立重算身份绑定（CSV 内 rank 按场景重起，须按场景限定查找；
  全局 rank 查找会撞到其他场景的同 rank 行），另独立重算 activation、meaning/display 一致性。
- 判读标准（与此前各批一致）：身份绑定对源 CSV 行（expression / sense_zh / scene_id /
  rank / sense_id / tier）；例句英文自然且真实体现释义义；汉译忠实自然；搭配真实且贴合该义；
  usage/contrast 注真实、在范围内、有用；meaning_zh == sense_zh；display 字段与 answer 字段一致；
  无 question / correct_choice_id 字段。REVISE 只给真实缺陷（须附具体修正方案），
  HOLD 只给身份或义确实不清者，不用 HOLD 装风格问题；轻微不完美但正确自然者判 PASS。
- 语义依据与限制：V51 CSV 未附冻结英文定义，判读依据为源 sense_zh、expression 与
  场景上下文；不凭中文像自动 PASS，每条均核对英文例句是否真实体现该义。
  本复审为 Muse 教学线独立判断，**不是双 AI 认证**：双 AI 对账须待 CG-QA verdict 后
  由 CG-QA 按版本规则确认，本复审不代记双 AI 结论。
- 范围说明（editorial_addition）：SC50-0002 rank 172–174（SC1341-KU-00406 apply lip balm、
  00407 brush twice a day、00408 wash off makeup）的源 CSV 行为 editorial_addition
  （tier ADDITIONAL），仍待 CG-MASTER / 独立 QA 审查；本复审按同一标准对现有 CSV 行
  判读，三条内容均 PASS，但其源义身份本身未获本复审认证，待 CG-MASTER 裁决。

## 结论

**PASS 120 / REVISE 4 / HOLD 0。** 分包：rank 71–100 PASS 30 / REVISE 0；rank 101–150 PASS 48 /
REVISE 2；rank 151–174 PASS 22 / REVISE 2；SC50-0003 rank 1–20 PASS 20 / REVISE 0。
身份绑定 124/124（协调员 scene-scoped 独立重算；各复核员亦逐条核对）；无题目字段 124/124；
display 与 answer 一致性 124/124；meaning_zh == sense_zh 124/124；
per-record activation_allowed false 124/124。
首 20 条校验器（`test-scene1341-v51-answer-only-v2.mjs`）只断言首 20 条包，
不适用于本批，故本批不报 STRUCTURE_PASS；本批的结构与身份改由上述独立重算覆盖。

| scene_ku_id | expression | 结论 | 备注 |
|---|---|---|---|
| SC1341-KU-00305 | sunscreen | PASS |  |
| SC1341-KU-00306 | antiperspirant | PASS |  |
| SC1341-KU-00307 | cotton swab | PASS | “clean around the makeup bottle”用法少见但合理 |
| SC1341-KU-00308 | cotton pad | PASS |  |
| SC1341-KU-00309 | comb | PASS | “for my hair”略冗余 |
| SC1341-KU-00310 | hairbrush | PASS |  |
| SC1341-KU-00311 | hair dryer | PASS |  |
| SC1341-KU-00312 | body lotion | PASS |  |
| SC1341-KU-00313 | nail clippers | PASS |  |
| SC1341-KU-00314 | nail file | PASS |  |
| SC1341-KU-00315 | spit out toothpaste | PASS |  |
| SC1341-KU-00316 | brush your tongue | PASS |  |
| SC1341-KU-00317 | clean between your teeth | PASS |  |
| SC1341-KU-00318 | lather up | PASS |  |
| SC1341-KU-00319 | dry your hands | PASS |  |
| SC1341-KU-00320 | splash water on your face | PASS |  |
| SC1341-KU-00321 | pat your face dry | PASS |  |
| SC1341-KU-00322 | remove makeup | PASS |  |
| SC1341-KU-00323 | apply cleanser | PASS |  |
| SC1341-KU-00324 | take a shower | PASS |  |
| SC1341-KU-00325 | have a bath | PASS |  |
| SC1341-KU-00326 | turn on the shower | PASS |  |
| SC1341-KU-00327 | adjust the water temperature | PASS |  |
| SC1341-KU-00328 | step into the shower | PASS |  |
| SC1341-KU-00329 | wash your hair | PASS |  |
| SC1341-KU-00330 | lather your hair | PASS |  |
| SC1341-KU-00331 | use conditioner | PASS | 汉译把 after shampooing 展开为“用洗发水洗头后”，未改义 |
| SC1341-KU-00332 | towel-dry your hair | PASS |  |
| SC1341-KU-00333 | blow-dry your hair | PASS |  |
| SC1341-KU-00334 | brush your hair | PASS |  |
| SC1341-KU-00335 | tie your hair back | PASS |  |
| SC1341-KU-00336 | trim your beard | PASS |  |
| SC1341-KU-00337 | apply moisturizer | PASS |  |
| SC1341-KU-00338 | put on deodorant | PASS | 例句汉译在“除臭剂或体香剂”中取体香剂，自然 |
| SC1341-KU-00339 | put on sunscreen | PASS |  |
| SC1341-KU-00340 | clip your nails | PASS |  |
| SC1341-KU-00341 | clean your ears | PASS |  |
| SC1341-KU-00342 | take out your contact lenses | PASS |  |
| SC1341-KU-00343 | put in your contact lenses | PASS |  |
| SC1341-KU-00344 | wash your makeup brushes | PASS |  |
| SC1341-KU-00345 | wipe down the sink | PASS |  |
| SC1341-KU-00346 | hang up the towel | PASS |  |
| SC1341-KU-00347 | replace the toothbrush head | REVISE | 例句汉译加“电动”，英文无此限定 |
| SC1341-KU-00348 | clean | PASS |  |
| SC1341-KU-00349 | fresh | PASS |  |
| SC1341-KU-00350 | hygienic | PASS |  |
| SC1341-KU-00351 | dirty | PASS |  |
| SC1341-KU-00352 | sticky | PASS |  |
| SC1341-KU-00353 | greasy | PASS |  |
| SC1341-KU-00354 | oily | PASS |  |
| SC1341-KU-00355 | dry skin | PASS | “洗完脸”为洗干性皮肤时的隐含义 |
| SC1341-KU-00356 | sensitive skin | PASS |  |
| SC1341-KU-00357 | irritated skin | PASS |  |
| SC1341-KU-00358 | rash | PASS |  |
| SC1341-KU-00359 | itchy | PASS |  |
| SC1341-KU-00360 | flaky skin | PASS |  |
| SC1341-KU-00361 | chapped lips | PASS |  |
| SC1341-KU-00362 | breakout | PASS |  |
| SC1341-KU-00363 | acne | PASS |  |
| SC1341-KU-00364 | blemish | PASS |  |
| SC1341-KU-00365 | bad breath | PASS |  |
| SC1341-KU-00366 | sensitive teeth | PASS |  |
| SC1341-KU-00367 | bleeding gums | PASS |  |
| SC1341-KU-00368 | tangled hair | PASS |  |
| SC1341-KU-00369 | frizzy hair | PASS |  |
| SC1341-KU-00370 | dandruff | PASS |  |
| SC1341-KU-00371 | sweaty | PASS | “浑身是汗”为 felt sweaty 的惯用译法 |
| SC1341-KU-00372 | body odor | PASS |  |
| SC1341-KU-00373 | stubble | REVISE | 例句汉译加“下巴”，英文未定位 |
| SC1341-KU-00374 | close shave | PASS |  |
| SC1341-KU-00375 | dull blade | PASS |  |
| SC1341-KU-00376 | slippery floor | PASS |  |
| SC1341-KU-00377 | lukewarm | PASS |  |
| SC1341-KU-00378 | scalding hot | PASS |  |
| SC1341-KU-00379 | clogged drain | PASS |  |
| SC1341-KU-00380 | leaky faucet | PASS | “滴答滴答响了一夜”为 kept dripping all night 的自然译法 |
| SC1341-KU-00381 | run out of toothpaste | PASS |  |
| SC1341-KU-00382 | replace a toothbrush | PASS |  |
| SC1341-KU-00383 | change the razor blade | PASS |  |
| SC1341-KU-00384 | unclog the drain | PASS |  |
| SC1341-KU-00385 | clean up spilled water | PASS |  |
| SC1341-KU-00386 | turn down the temperature | PASS |  |
| SC1341-KU-00387 | deal with dry skin | PASS |  |
| SC1341-KU-00388 | avoid skin irritation | PASS |  |
| SC1341-KU-00389 | test a new product | PASS |  |
| SC1341-KU-00390 | treat a small cut | REVISE | 例句未出现目标动词 treat |
| SC1341-KU-00391 | use a clean towel | PASS |  |
| SC1341-KU-00392 | disinfect the surface | PASS |  |
| SC1341-KU-00393 | wipe up the mess | PASS |  |
| SC1341-KU-00394 | keep toiletries separate | PASS |  |
| SC1341-KU-00395 | share the bathroom | PASS |  |
| SC1341-KU-00396 | wait your turn | PASS |  |
| SC1341-KU-00397 | save water | PASS |  |
| SC1341-KU-00398 | turn off the tap | PASS |  |
| SC1341-KU-00399 | get ready quickly | REVISE | 例句无洗漱语境，未体现释义“快速梳洗完” |
| SC1341-KU-00400 | pack travel-size toiletries | PASS |  |
| SC1341-KU-00401 | check the expiration date | PASS |  |
| SC1341-KU-00402 | prevent slipping | PASS |  |
| SC1341-KU-00403 | remove soap scum | PASS |  |
| SC1341-KU-00404 | wash a reusable cloth | PASS |  |
| SC1341-KU-00405 | dry the bathroom floor | PASS |  |
| SC1341-KU-00406 | apply lip balm | PASS | 源行为 editorial_addition，待 CG-MASTER/独立 QA 审查；内容 PASS |
| SC1341-KU-00407 | brush twice a day | PASS | 源行为 editorial_addition，待 CG-MASTER/独立 QA 审查；内容 PASS |
| SC1341-KU-00408 | wash off makeup | PASS | 源行为 editorial_addition，待 CG-MASTER/独立 QA 审查；内容 PASS |
| SC1341-KU-00409 | get dressed | PASS |  |
| SC1341-KU-00410 | dress | PASS |  |
| SC1341-KU-00411 | change clothes | PASS |  |
| SC1341-KU-00412 | put on | PASS |  |
| SC1341-KU-00413 | take off | PASS |  |
| SC1341-KU-00414 | try on | PASS |  |
| SC1341-KU-00415 | wear | PASS | 汉译语序略生硬但忠实 |
| SC1341-KU-00416 | fit | PASS |  |
| SC1341-KU-00417 | match | PASS |  |
| SC1341-KU-00418 | dress up | PASS |  |
| SC1341-KU-00419 | dress down | PASS |  |
| SC1341-KU-00420 | zip up | PASS |  |
| SC1341-KU-00421 | outfit | PASS |  |
| SC1341-KU-00422 | shirt | PASS |  |
| SC1341-KU-00423 | T-shirt | PASS |  |
| SC1341-KU-00424 | sweater | PASS |  |
| SC1341-KU-00425 | jacket | PASS |  |
| SC1341-KU-00426 | dress | PASS |  |
| SC1341-KU-00427 | jeans | PASS |  |
| SC1341-KU-00428 | pants | PASS | 汉译加“买”为 need a new pair 的自然译法，未改义 |

## REVISE / HOLD 明细

- **SC1341-KU-00347 replace the toothbrush head（SC50-0002 rank 113）——REVISE。**
  释义：更换牙刷头。例句英文：`It's time to replace the toothbrush head.`
  例句汉译：`该换电动牙刷的刷头了。`——汉译加入了英文没有的“电动”，
  而 replace the toothbrush head 不限于电动牙刷。
  拟议修正：例句汉译改为 `该换牙刷头了。`，display.example_zh 同步改。

- **SC1341-KU-00373 stubble（SC50-0002 rank 139）——REVISE。**
  释义：胡茬。例句英文：`I have some stubble because I didn't shave yesterday.`
  例句汉译：`昨天没刮胡子，今天我下巴有点胡茬。`——汉译加入了英文没有的定位“下巴”，
  而 stubble 不限于下巴。
  拟议修正：例句汉译改为 `因为昨天没刮胡子，我现在有点胡茬。`，display.example_zh 同步改。

- **SC1341-KU-00390 treat a small cut（SC50-0002 rank 156）——REVISE。**
  释义：处理小伤口。例句英文：`I cleaned and covered a small cut on my finger.`
  例句汉译：`我清洁并盖住了手指上的小伤口。`——例句只复述“处理伤口”的动作，
  全句未出现目标动词 treat，未能示范本条词头短语；本批唯一例句缺词头的记录。
  拟议修正：例句英文改为 `I treated a small cut on my finger by cleaning it and covering it.`，
  例句汉译改为 `我清洁并包扎了手指上的小伤口。`，display.e 与 display.example_zh 同步改。

- **SC1341-KU-00399 get ready quickly（SC50-0002 rank 165）——REVISE。**
  释义：快速梳洗完。例句英文：`I need to get ready quickly because the bus leaves soon.`
  例句汉译：`公交车快开了，我得赶紧洗漱准备好。`——英文例句只讲泛泛的“赶紧准备”
  （穿衣、收拾均可），无任何洗漱语境，未体现本场景释义“快速梳洗完”；
  汉译反倒补了英文没有的“洗漱”。
  拟议修正：例句英文改为 `I need to get ready quickly in the bathroom because the bus leaves soon.`，
  例句汉译改为 `公交车快开了，我得在卫生间赶紧洗漱准备好。`，display.e 与 display.example_zh 同步改。
  无 HOLD 条目。

## 非阻断观察（不构成 verdict，均已按不拔高规则判 PASS）

- SC1341-KU-00307 cotton swab：例句“clean around the makeup bottle”用法少见但合理。
- SC1341-KU-00309 comb：例句“for my hair”略冗余。
- SC1341-KU-00331 use conditioner：汉译把 after shampooing 展开为“用洗发水洗头后”，未改义。
- SC1341-KU-00338 put on deodorant：例句汉译在释义“除臭剂或体香剂”中取体香剂，自然。
- SC1341-KU-00355 dry skin：汉译“洗完脸”为洗干性皮肤时的隐含义。
- SC1341-KU-00371 sweaty：汉译“浑身是汗”为 felt sweaty 的惯用译法。
- SC1341-KU-00380 leaky faucet：汉译“滴答滴答响了一夜”为 kept dripping all night 的自然译法。
- SC1341-KU-00406 / 00407 / 00408（rank 172–174，editorial_addition）：三条内容均 PASS，
  且用法注已标明待验证状态；其源义身份待 CG-MASTER 裁决，见上文范围说明。
- SC1341-KU-00415 wear：汉译语序略生硬但忠实。
- SC1341-KU-00428 pants：汉译加“买”为 need a new pair 的自然译法，未改义。

## 批准列表（PASS，120 条，供 CG-MAIN SRS 门禁）

以下 120 个 scene_ku_id 为本批 PASS 结论，与裁决表逐条一致
（SC1341-KU-00305..00428 除 REVISE 的 00347、00373、00390、00399）：

SC1341-KU-00305, SC1341-KU-00306, SC1341-KU-00307, SC1341-KU-00308, SC1341-KU-00309, SC1341-KU-00310, SC1341-KU-00311, SC1341-KU-00312, SC1341-KU-00313, SC1341-KU-00314, SC1341-KU-00315, SC1341-KU-00316, SC1341-KU-00317, SC1341-KU-00318, SC1341-KU-00319, SC1341-KU-00320, SC1341-KU-00321, SC1341-KU-00322, SC1341-KU-00323, SC1341-KU-00324, SC1341-KU-00325, SC1341-KU-00326, SC1341-KU-00327, SC1341-KU-00328, SC1341-KU-00329, SC1341-KU-00330, SC1341-KU-00331, SC1341-KU-00332, SC1341-KU-00333, SC1341-KU-00334, SC1341-KU-00335, SC1341-KU-00336, SC1341-KU-00337, SC1341-KU-00338, SC1341-KU-00339, SC1341-KU-00340, SC1341-KU-00341, SC1341-KU-00342, SC1341-KU-00343, SC1341-KU-00344, SC1341-KU-00345, SC1341-KU-00346, SC1341-KU-00348, SC1341-KU-00349, SC1341-KU-00350, SC1341-KU-00351, SC1341-KU-00352, SC1341-KU-00353, SC1341-KU-00354, SC1341-KU-00355, SC1341-KU-00356, SC1341-KU-00357, SC1341-KU-00358, SC1341-KU-00359, SC1341-KU-00360, SC1341-KU-00361, SC1341-KU-00362, SC1341-KU-00363, SC1341-KU-00364, SC1341-KU-00365, SC1341-KU-00366, SC1341-KU-00367, SC1341-KU-00368, SC1341-KU-00369, SC1341-KU-00370, SC1341-KU-00371, SC1341-KU-00372, SC1341-KU-00374, SC1341-KU-00375, SC1341-KU-00376, SC1341-KU-00377, SC1341-KU-00378, SC1341-KU-00379, SC1341-KU-00380, SC1341-KU-00381, SC1341-KU-00382, SC1341-KU-00383, SC1341-KU-00384, SC1341-KU-00385, SC1341-KU-00386, SC1341-KU-00387, SC1341-KU-00388, SC1341-KU-00389, SC1341-KU-00391, SC1341-KU-00392, SC1341-KU-00393, SC1341-KU-00394, SC1341-KU-00395, SC1341-KU-00396, SC1341-KU-00397, SC1341-KU-00398, SC1341-KU-00400, SC1341-KU-00401, SC1341-KU-00402, SC1341-KU-00403, SC1341-KU-00404, SC1341-KU-00405, SC1341-KU-00406, SC1341-KU-00407, SC1341-KU-00408, SC1341-KU-00409, SC1341-KU-00410, SC1341-KU-00411, SC1341-KU-00412, SC1341-KU-00413, SC1341-KU-00414, SC1341-KU-00415, SC1341-KU-00416, SC1341-KU-00417, SC1341-KU-00418, SC1341-KU-00419, SC1341-KU-00420, SC1341-KU-00421, SC1341-KU-00422, SC1341-KU-00423, SC1341-KU-00424, SC1341-KU-00425, SC1341-KU-00426, SC1341-KU-00427, SC1341-KU-00428

## 未决与不宣称

- CG-ENTEACH 尚未交付对先前各批 REVISE（00006 snooze、00117 bedside table、
  00239 shower gel、00269 get clean）的修订包；本批新增 4 条 REVISE 的修正亦待作者交付新包后
  定向复验，不在本复审范围。
- CG-QA 的独立语义复核与双 AI 对账仍待进行；本复审不代记双 AI 结论。
- `production_ready: false`、`activation_allowed: false`、`publishable: 0` 均不变，
  本复审不批准启用、不批准发布。
- V51 剩余 1,610 条未生产（本批固定版本 HEAD `46e935a7` 时点），不在本复审范围；
  教学分支此后新增的 SC50-0003 rank 21–70（HEAD `1ad7e6e8`）亦不在本批范围。
