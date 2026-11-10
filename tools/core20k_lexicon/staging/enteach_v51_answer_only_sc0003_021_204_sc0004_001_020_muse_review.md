# MU-ENTEACH 独立复审：Scene1341 V51 答案型 SC50-0003 ranks 21–204 + SC50-0004 ranks 1–20

- 对象：教学分支 `answer-enrichment-main-dev-20261026` HEAD `c1457be9`（`c1457be9c078ae46e7cf72af60d15063340a032c`），
  五个包：
  - `tools/answer-enrichment/scene1341-v51-sc0003-answer-only-021-070.v2.json`
    （blob `9ffab74131efdb69533803abfaae3b5d9a8e5e88`，50 条，rank 21-70，提交 `27916783`）；
  - `tools/answer-enrichment/scene1341-v51-sc0003-answer-only-071-120.v2.json`
    （blob `2c93b426b637f1a7313a7e9e69920f0a054efdad`，50 条，rank 71-120，提交 `2431eb37`）；
  - `tools/answer-enrichment/scene1341-v51-sc0003-answer-only-121-170.v2.json`
    （blob `81c64976d30d287b29d13c4714bb3cc7b4b233e8`，50 条，rank 121-170，提交 `fcb1e173`）；
  - `tools/answer-enrichment/scene1341-v51-sc0003-answer-only-171-204.v2.json`
    （blob `48d04d7064011b5db91f6dea18fdeffb15434e08`，34 条，rank 171-204，提交 `cc9daa9e`）；
  - `tools/answer-enrichment/scene1341-v51-sc0004-answer-only-001-020.v2.json`
    （blob `cf4f0ecf3fded5ff2a230f3a4a2cdab7d0471867`，20 条，rank 1-20，提交 `e8087bf1`）；
  schema 答案型 V2，`release_status: EDITORIAL_STAGING_ONLY`，`activation_allowed: false`（每条记录）。
- 来源：`cg-main-fourline-integration-20261026` 分支
  `tools/integration/scene1341-ranked/v51-ranked.csv`（blob `eaa6d729…`，2,038 行），
  场景 SC50-0003 穿衣与搭配（rank 21–204，184 条）与 SC50-0004 整理房间（rank 1–20，20 条）。
- 任务来源：CG-QA 评论 6758884750（请 MU-ENTEACH/MU-QA 独立审新增 144 条，含 SC50-0003 rank 21–120）、
  CG-ENTEACH 评论 6758855563（请独立审 rank 121–170）、6758914187（请独立审新增 54 条：rank 171–204 与
  SC50-0004 rank 1–20）；CG-QA 评论 6758958559（请 MU-ENTEACH/MU-QA 覆盖 SC50-0003 rank 21–204 及
  SC50-0004 rank 1–20 尚缺的 204 条）。
  **注意：教学分支此后已推进至 `a25a3f0a`（732 条草稿，新增 SC50-0004 rank 21–120）；
  本复审只对固定版本 HEAD `c1457be9` 的 204 条负责，不覆盖此后新增内容。**
- 复审性质：**非盲审作者身份**（CG-ENTEACH 为作者），但**盲判他线 verdict**——
  五名复核员（每包一名）只凭包文件与源 CSV 判读，未读任何 Issue 评论，未查任何他线 verdict、
  总账或对账结果（包括 CG-QA 对全部 204 条的复审与 MU-QA 的并行复审），
  各组互不见 verdict，判完才合并。仅答案页教学内容层，不审题目（本题无题目字段）。
- 方法：204 条分 5 组（每包一组：50 / 50 / 50 / 34 / 20 条），由 5 名复核员各自独立判读；
  协调员合并后核对覆盖（204 条、SC1341-KU-00429..00632 各恰一次），
  并以 scene_id + rank 逐条独立重算身份绑定（CSV 内 rank 按场景重起，须按场景限定查找；
  全局 rank 查找会撞到其他场景的同 rank 行），另独立重算 activation、meaning/display 一致性，
  并对 5 条 REVISE 逐条对包实核。
- 判读标准（与此前各批一致）：身份绑定对源 CSV 行（expression / sense_zh / scene_id /
  rank / sense_id / tier）；例句英文自然且真实体现释义义；汉译忠实自然；搭配真实且贴合该义；
  usage/contrast 注真实、在范围内、有用；meaning_zh == sense_zh；display 字段与 answer 字段一致；
  无 question / correct_choice_id 字段。REVISE 只给真实缺陷（须附具体修正方案），
  HOLD 只给身份或义确实不清者，不用 HOLD 装风格问题；轻微不完美但正确自然者判 PASS。
- 语义依据与限制：V51 CSV 未附冻结英文定义，判读依据为源 sense_zh、expression 与
  场景上下文；不凭中文像自动 PASS，每条均核对英文例句是否真实体现该义。
  本复审为 Muse 教学线独立判断，**不是双 AI 认证**：双 AI 对账须待 CG-QA verdict 后
  由 CG-QA 按版本规则确认，本复审不代记双 AI 结论。
- 范围说明（editorial_addition）：SC50-0003 rank 202–204（SC1341-KU-00610 get changed、
  00611 put your shoes on、00612 take your shoes off）的源 CSV 行为 editorial_addition
  （tier ADDITIONAL，无 source_master_row，decision_note 为 "New scene gap candidate, requires
  independent validation"），仍待 CG-MASTER / 独立 QA 审查；本复审按同一标准对现有 CSV 行
  判读，三条内容均 PASS，但其源义身份本身未获本复审认证，待 CG-MASTER 裁决。

## 结论

**PASS 199 / REVISE 5 / HOLD 0。** 分包：rank 21–70 PASS 48 / REVISE 2；rank 71–120 PASS 48 /
REVISE 2；rank 121–170 PASS 50 / REVISE 0；rank 171–204 PASS 33 / REVISE 1；SC50-0004 rank 1–20 PASS 20 /
REVISE 0。身份绑定 204/204（协调员 scene-scoped 独立重算；各复核员亦逐条核对）；无题目字段 204/204；
display 与 answer 一致性 204/204；meaning_zh == sense_zh 204/204；
per-record activation_allowed false 204/204。
首 20 条校验器（`test-scene1341-v51-answer-only-v2.mjs`）只断言首 20 条包，
不适用于本批，故本批不报 STRUCTURE_PASS；本批的结构与身份改由上述独立重算覆盖。

| scene_ku_id | expression | 结论 | 备注 |
|---|---|---|---|
| SC1341-KU-00429 | socks | PASS |  |
| SC1341-KU-00430 | dress code | PASS |  |
| SC1341-KU-00431 | size | PASS |  |
| SC1341-KU-00432 | dress for the weather | PASS |  |
| SC1341-KU-00433 | dress for the occasion | PASS |  |
| SC1341-KU-00434 | put on a uniform | PASS |  |
| SC1341-KU-00435 | take off a wet jacket | PASS |  |
| SC1341-KU-00436 | undress | PASS |  |
| SC1341-KU-00437 | suit | PASS | 动词义“合身/适合”，与名词义 00467 分开、互作区分注 |
| SC1341-KU-00438 | go with | PASS |  |
| SC1341-KU-00439 | coordinate | PASS |  |
| SC1341-KU-00440 | layer | PASS |  |
| SC1341-KU-00441 | pick an outfit | PASS |  |
| SC1341-KU-00442 | lay out clothes | PASS |  |
| SC1341-KU-00443 | throw something on | PASS |  |
| SC1341-KU-00444 | slip into | PASS |  |
| SC1341-KU-00445 | button up | PASS |  |
| SC1341-KU-00446 | tuck in | PASS |  |
| SC1341-KU-00447 | roll up sleeves | PASS |  |
| SC1341-KU-00448 | tie a tie | PASS |  |
| SC1341-KU-00449 | fasten a belt | REVISE | Second collocation 'fasten your seat belt' belongs to the car seat-belt sense, not the clothing-belt sense glossed here (系好皮带); it drifts off-sense. |
| SC1341-KU-00450 | lace up shoes | PASS |  |
| SC1341-KU-00451 | tie shoelaces | PASS |  |
| SC1341-KU-00452 | pull on socks | PASS |  |
| SC1341-KU-00453 | pull off boots | PASS |  |
| SC1341-KU-00454 | hang up a coat | PASS |  |
| SC1341-KU-00455 | fold clothes | PASS |  |
| SC1341-KU-00456 | change into | PASS |  |
| SC1341-KU-00457 | change out of | PASS |  |
| SC1341-KU-00458 | wardrobe | PASS |  |
| SC1341-KU-00459 | closet | PASS |  |
| SC1341-KU-00460 | dresser | PASS |  |
| SC1341-KU-00461 | hanger | PASS |  |
| SC1341-KU-00462 | blouse | PASS |  |
| SC1341-KU-00463 | hoodie | PASS |  |
| SC1341-KU-00464 | cardigan | PASS |  |
| SC1341-KU-00465 | coat | PASS |  |
| SC1341-KU-00466 | blazer | PASS |  |
| SC1341-KU-00467 | suit | PASS | 名词义，与动词义 00437 分开、互作区分注 |
| SC1341-KU-00468 | skirt | PASS |  |
| SC1341-KU-00469 | trousers | PASS |  |
| SC1341-KU-00470 | shorts | PASS |  |
| SC1341-KU-00471 | leggings | PASS |  |
| SC1341-KU-00472 | underwear | PASS |  |
| SC1341-KU-00473 | bra | PASS |  |
| SC1341-KU-00474 | tights | PASS |  |
| SC1341-KU-00475 | pajamas | PASS |  |
| SC1341-KU-00476 | robe | REVISE | First collocation 'bathrobe' is a separate compound word, not a collocation of 'robe'; listing it as a collocation of robe is misleading for a learner. |
| SC1341-KU-00477 | scarf | PASS |  |
| SC1341-KU-00478 | gloves | PASS |  |
| SC1341-KU-00479 | hat | PASS |  |
| SC1341-KU-00480 | cap | PASS |  |
| SC1341-KU-00481 | belt | PASS |  |
| SC1341-KU-00482 | tie | PASS |  |
| SC1341-KU-00483 | sneakers | PASS |  |
| SC1341-KU-00484 | trainers | PASS |  |
| SC1341-KU-00485 | boots | PASS |  |
| SC1341-KU-00486 | sandals | PASS |  |
| SC1341-KU-00487 | flats | PASS | flats 与 flat shoes 的区分可成立 |
| SC1341-KU-00488 | heels | PASS |  |
| SC1341-KU-00489 | loafers | PASS |  |
| SC1341-KU-00490 | accessories | PASS |  |
| SC1341-KU-00491 | earrings | PASS |  |
| SC1341-KU-00492 | necklace | PASS |  |
| SC1341-KU-00493 | watch | REVISE | Second collocation 'wristwatch' is a bare synonym (a single compound noun), not an English collocation, so the collocations field mislabels it. |
| SC1341-KU-00494 | handbag | PASS |  |
| SC1341-KU-00495 | backpack | PASS |  |
| SC1341-KU-00496 | casual | PASS |  |
| SC1341-KU-00497 | formal | PASS |  |
| SC1341-KU-00498 | smart casual | PASS |  |
| SC1341-KU-00499 | business casual | PASS |  |
| SC1341-KU-00500 | comfortable | PASS |  |
| SC1341-KU-00501 | uncomfortable | PASS |  |
| SC1341-KU-00502 | loose | PASS |  |
| SC1341-KU-00503 | tight | PASS |  |
| SC1341-KU-00504 | snug | PASS | 例句用副词 snugly 而非词头 snug，但真实体现该义 |
| SC1341-KU-00505 | baggy | PASS |  |
| SC1341-KU-00506 | fitted | PASS |  |
| SC1341-KU-00507 | oversized | PASS |  |
| SC1341-KU-00508 | slim-fit | PASS |  |
| SC1341-KU-00509 | regular fit | PASS |  |
| SC1341-KU-00510 | true to size | PASS |  |
| SC1341-KU-00511 | too small | PASS |  |
| SC1341-KU-00512 | too big | PASS |  |
| SC1341-KU-00513 | short-sleeved | PASS |  |
| SC1341-KU-00514 | long-sleeved | PASS |  |
| SC1341-KU-00515 | sleeveless | REVISE | usage_note 'sleeveless表示没有袖子，不一定意味着露肩款式相同' is muddled: '不一定意味着露肩款式相同' does not clearly state the distinction from off-the-shoulder styles. |
| SC1341-KU-00516 | high-waisted | PASS |  |
| SC1341-KU-00517 | low-rise | PASS |  |
| SC1341-KU-00518 | plain | PASS |  |
| SC1341-KU-00519 | striped | PASS |  |
| SC1341-KU-00520 | checked | PASS |  |
| SC1341-KU-00521 | floral | PASS |  |
| SC1341-KU-00522 | patterned | PASS |  |
| SC1341-KU-00523 | solid color | PASS |  |
| SC1341-KU-00524 | neutral colors | PASS |  |
| SC1341-KU-00525 | bright colors | PASS | 汉译加“穿”，在穿衣语境自然 |
| SC1341-KU-00526 | muted colors | PASS |  |
| SC1341-KU-00527 | pastel | PASS |  |
| SC1341-KU-00528 | layered look | PASS |  |
| SC1341-KU-00529 | weather-appropriate | PASS |  |
| SC1341-KU-00530 | wrinkled | PASS | wrinkled/creased 对比注基本准确 |
| SC1341-KU-00531 | stained | PASS |  |
| SC1341-KU-00532 | inside out | PASS |  |
| SC1341-KU-00533 | backwards | PASS |  |
| SC1341-KU-00534 | see-through | PASS |  |
| SC1341-KU-00535 | itchy fabric | PASS |  |
| SC1341-KU-00536 | breathable | PASS |  |
| SC1341-KU-00537 | waterproof | PASS |  |
| SC1341-KU-00538 | warm | PASS |  |
| SC1341-KU-00539 | lightweight | PASS | 用法注正确限定 lightweight 只关乎重量 |
| SC1341-KU-00540 | neckline | PASS |  |
| SC1341-KU-00541 | collar | PASS |  |
| SC1341-KU-00542 | sleeve | PASS |  |
| SC1341-KU-00543 | cuff | PASS |  |
| SC1341-KU-00544 | hem | PASS |  |
| SC1341-KU-00545 | waistband | PASS |  |
| SC1341-KU-00546 | pocket | PASS |  |
| SC1341-KU-00547 | button | PASS |  |
| SC1341-KU-00548 | zipper | PASS | 一搭配重复词头，但另一搭配与例句无问题 |
| SC1341-KU-00549 | drawstring | PASS |  |
| SC1341-KU-00550 | seam | PASS |  |
| SC1341-KU-00551 | fabric | PASS |  |
| SC1341-KU-00552 | cotton | PASS |  |
| SC1341-KU-00553 | linen | PASS | linen 例句自然，床品义 caveat 属实 |
| SC1341-KU-00554 | wool | PASS |  |
| SC1341-KU-00555 | denim | PASS |  |
| SC1341-KU-00556 | leather | PASS |  |
| SC1341-KU-00557 | polyester | PASS |  |
| SC1341-KU-00558 | silk | PASS |  |
| SC1341-KU-00559 | small | PASS |  |
| SC1341-KU-00560 | medium | PASS |  |
| SC1341-KU-00561 | large | PASS |  |
| SC1341-KU-00562 | extra-large | PASS |  |
| SC1341-KU-00563 | shoe size | PASS | 一搭配重复词头，但例句与 UK/US/EU 注无问题 |
| SC1341-KU-00564 | waist size | PASS |  |
| SC1341-KU-00565 | length | PASS |  |
| SC1341-KU-00566 | sleeve length | PASS |  |
| SC1341-KU-00567 | inseam | PASS |  |
| SC1341-KU-00568 | pattern | PASS |  |
| SC1341-KU-00569 | color combination | PASS |  |
| SC1341-KU-00570 | style | PASS |  |
| SC1341-KU-00571 | cut | PASS |  |
| SC1341-KU-00572 | silhouette | PASS |  |
| SC1341-KU-00573 | texture | PASS |  |
| SC1341-KU-00574 | stain | PASS |  |
| SC1341-KU-00575 | crease | PASS |  |
| SC1341-KU-00576 | lint | PASS |  |
| SC1341-KU-00577 | label | PASS |  |
| SC1341-KU-00578 | care label | PASS |  |
| SC1341-KU-00579 | mirror | PASS |  |
| SC1341-KU-00580 | full-length mirror | PASS |  |
| SC1341-KU-00581 | laundry basket | PASS |  |
| SC1341-KU-00582 | missing button | PASS |  |
| SC1341-KU-00583 | broken zipper | PASS |  |
| SC1341-KU-00584 | loose thread | PASS |  |
| SC1341-KU-00585 | tear in the fabric | PASS |  |
| SC1341-KU-00586 | stain on your clothes | PASS |  |
| SC1341-KU-00587 | wrinkle in a shirt | PASS |  |
| SC1341-KU-00588 | iron a shirt | PASS |  |
| SC1341-KU-00589 | steam your clothes | PASS |  |
| SC1341-KU-00590 | remove lint | PASS |  |
| SC1341-KU-00591 | change a stained shirt | PASS |  |
| SC1341-KU-00592 | sew on a button | PASS |  |
| SC1341-KU-00593 | fix a zipper | REVISE | example_en object is out of scene (backpack zipper, not a clothing zipper) |
| SC1341-KU-00594 | mend a tear | PASS |  |
| SC1341-KU-00595 | adjust the hem | PASS |  |
| SC1341-KU-00596 | roll down your sleeves | PASS |  |
| SC1341-KU-00597 | bring a spare outfit | PASS |  |
| SC1341-KU-00598 | pack an extra layer | PASS |  |
| SC1341-KU-00599 | check the forecast | PASS |  |
| SC1341-KU-00600 | follow the dress code | PASS |  |
| SC1341-KU-00601 | wear comfortable shoes | PASS |  |
| SC1341-KU-00602 | change into work clothes | PASS |  |
| SC1341-KU-00603 | change into workout clothes | PASS |  |
| SC1341-KU-00604 | hang clothes to dry | PASS |  |
| SC1341-KU-00605 | find a matching pair | PASS |  |
| SC1341-KU-00606 | go without a tie | PASS |  |
| SC1341-KU-00607 | borrow a jacket | PASS |  |
| SC1341-KU-00608 | wear layers | PASS |  |
| SC1341-KU-00609 | back to front | PASS |  |
| SC1341-KU-00610 | get changed | PASS | editorial_addition（rank 202），用法注已标明待验证 |
| SC1341-KU-00611 | put your shoes on | PASS | editorial_addition（rank 203） |
| SC1341-KU-00612 | take your shoes off | PASS | editorial_addition（rank 204） |
| SC1341-KU-00613 | tidy up | PASS |  |
| SC1341-KU-00614 | clean up | PASS |  |
| SC1341-KU-00615 | declutter | PASS |  |
| SC1341-KU-00616 | organize | PASS |  |
| SC1341-KU-00617 | sort | PASS |  |
| SC1341-KU-00618 | put away | PASS |  |
| SC1341-KU-00619 | throw away | PASS |  |
| SC1341-KU-00620 | hang up | PASS |  |
| SC1341-KU-00621 | fold | PASS |  |
| SC1341-KU-00622 | dust | PASS |  |
| SC1341-KU-00623 | vacuum | PASS |  |
| SC1341-KU-00624 | make the bed | PASS |  |
| SC1341-KU-00625 | shelf | PASS | 搭配中 bookshelf 是相关复合词而非双词搭配，但正确相关 |
| SC1341-KU-00626 | drawer | PASS |  |
| SC1341-KU-00627 | closet | PASS |  |
| SC1341-KU-00628 | storage box | PASS | 搭配偏弱（重复词头），但真实正确 |
| SC1341-KU-00629 | vacuum cleaner | PASS |  |
| SC1341-KU-00630 | mess | PASS |  |
| SC1341-KU-00631 | clutter | PASS |  |
| SC1341-KU-00632 | hang up jackets | PASS | 与 rank 8 hang up 近重复，是源表冗余，非本条缺陷 |

## REVISE / HOLD 明细

- **SC1341-KU-00449 fasten a belt（SC50-0003 rank 41）——REVISE。**
  释义：系好皮带。例句英文：`Fasten your belt before you leave.`
  例句汉译：`出门前把皮带系好。`。搭配：`['fasten a belt', 'fasten your seat belt']`。
  用法注：`fasten强调系紧或扣牢，和put on a belt侧重点不同。`
  ——Second collocation 'fasten your seat belt' belongs to the car seat-belt sense, not the clothing-belt sense glossed here (系好皮带); it drifts off-sense.
  拟议修正：Replace collocation 'fasten your seat belt' with 'fasten your belt tightly' (and update display.c accordingly).，display 相应字段同步改。

- **SC1341-KU-00476 robe（SC50-0003 rank 68）——REVISE。**
  释义：晨袍。例句英文：`I put on my robe after getting out of bed.`
  例句汉译：`我下床后穿上了晨袍。`。搭配：`['bathrobe', 'put on a robe']`。
  用法注：`robe在家居语境可指晨袍或浴袍，其他场景还有长袍义。`
  ——First collocation 'bathrobe' is a separate compound word, not a collocation of 'robe'; listing it as a collocation of robe is misleading for a learner.
  拟议修正：Replace collocation 'bathrobe' with 'a silk robe' (and update display.c accordingly).，display 相应字段同步改。

- **SC1341-KU-00493 watch（SC50-0003 rank 85）——REVISE。**
  释义：腕表。例句英文：`I wear a watch so I don't have to check my phone.`
  例句汉译：`我戴手表，这样就不用总看手机。`。搭配：`['wear a watch', 'wristwatch']`。
  用法注：`watch在此是可数名词“腕表”，不是动词“观看”。`
  ——Second collocation 'wristwatch' is a bare synonym (a single compound noun), not an English collocation, so the collocations field mislabels it.
  拟议修正：Replace collocation 'wristwatch' with 'check your watch' (collocations: ['wear a watch', 'check your watch']); update display.c accordingly.，display 相应字段同步改。

- **SC1341-KU-00515 sleeveless（SC50-0003 rank 107）——REVISE。**
  释义：无袖的。例句英文：`She wore a sleeveless dress in the summer heat.`
  例句汉译：`天气炎热时，她穿了一条无袖连衣裙。`。搭配：`['sleeveless dress', 'sleeveless top']`。
  用法注：`sleeveless表示没有袖子，不一定意味着露肩款式相同。`
  ——usage_note 'sleeveless表示没有袖子，不一定意味着露肩款式相同' is muddled: '不一定意味着露肩款式相同' does not clearly state the distinction from off-the-shoulder styles.
  拟议修正：Replace usage_note with 'sleeveless表示没有袖子，与露肩款（off-the-shoulder）不同：无袖指没有袖子，露肩指肩部裸露。' and update display.x to match.，display 相应字段同步改。

- **SC1341-KU-00593 fix a zipper（SC50-0003 rank 185）——REVISE。**
  释义：修拉链。例句英文：`I need to fix the zipper on my backpack.`
  例句汉译：`我需要修好背包上的拉链。`。搭配：`['fix a zipper', 'repair a zipper']`。
  用法注：`fix在此指修复使拉链能正常使用。`
  ——example_en object is out of scene (backpack zipper, not a clothing zipper)
  拟议修正：Change example_en to 'I need to fix the zipper on my jacket.' and example_zh to '我需要修好夹克上的拉链。'，display 相应字段同步改。

  无 HOLD 条目。

## 非阻断观察（不构成 verdict，均已按不拔高规则判 PASS）

- SC1341-KU-00437 suit（动词）与 00467 suit（名词）：同形异义两条分开建，各自例句与区分注正确。
- SC1341-KU-00487 flats：flats 与 flat shoes 的区分可成立；例句以 flats 对 heels。
- SC1341-KU-00504 snug：例句用副词 snugly 而非词头 snug，但真实体现该义，且搭配含 snug fit。
- SC1341-KU-00525 bright colors：汉译加“穿”，在穿衣语境自然。
- SC1341-KU-00530 wrinkled：wrinkled/creased 对比注基本准确。
- SC1341-KU-00539 lightweight：用法注正确限定 lightweight 只关乎重量。
- SC1341-KU-00548 zipper、00563 shoe size：一搭配重复词头，但另一搭配与例句无问题。
- SC1341-KU-00553 linen：例句自然，床品义 caveat 属实。
- SC1341-KU-00610 / 00611 / 00612（rank 202–204，editorial_addition）：三条内容均 PASS，
  且 00610 的用法注已标明待验证状态；其源义身份待 CG-MASTER 裁决，见上文范围说明。
- SC1341-KU-00625 shelf：搭配中 bookshelf 是相关复合词而非双词搭配，但正确相关。
- SC1341-KU-00628 storage box：搭配偏弱（重复词头），但真实正确。
- SC1341-KU-00632 hang up jackets：与 rank 8 hang up 近重复，是源表冗余，非本条缺陷。

## 批准列表（PASS，199 条，供 CG-MAIN SRS 门禁）

以下 199 个 scene_ku_id 为本批 PASS 结论，与裁决表逐条一致
（SC1341-KU-00429..00632 除 REVISE 的 00449、00476、00493、00515、00593）：

SC1341-KU-00429, SC1341-KU-00430, SC1341-KU-00431, SC1341-KU-00432, SC1341-KU-00433, SC1341-KU-00434, SC1341-KU-00435, SC1341-KU-00436, SC1341-KU-00437, SC1341-KU-00438, SC1341-KU-00439, SC1341-KU-00440, SC1341-KU-00441, SC1341-KU-00442, SC1341-KU-00443, SC1341-KU-00444, SC1341-KU-00445, SC1341-KU-00446, SC1341-KU-00447, SC1341-KU-00448, SC1341-KU-00450, SC1341-KU-00451, SC1341-KU-00452, SC1341-KU-00453, SC1341-KU-00454, SC1341-KU-00455, SC1341-KU-00456, SC1341-KU-00457, SC1341-KU-00458, SC1341-KU-00459, SC1341-KU-00460, SC1341-KU-00461, SC1341-KU-00462, SC1341-KU-00463, SC1341-KU-00464, SC1341-KU-00465, SC1341-KU-00466, SC1341-KU-00467, SC1341-KU-00468, SC1341-KU-00469, SC1341-KU-00470, SC1341-KU-00471, SC1341-KU-00472, SC1341-KU-00473, SC1341-KU-00474, SC1341-KU-00475, SC1341-KU-00477, SC1341-KU-00478, SC1341-KU-00479, SC1341-KU-00480, SC1341-KU-00481, SC1341-KU-00482, SC1341-KU-00483, SC1341-KU-00484, SC1341-KU-00485, SC1341-KU-00486, SC1341-KU-00487, SC1341-KU-00488, SC1341-KU-00489, SC1341-KU-00490, SC1341-KU-00491, SC1341-KU-00492, SC1341-KU-00494, SC1341-KU-00495, SC1341-KU-00496, SC1341-KU-00497, SC1341-KU-00498, SC1341-KU-00499, SC1341-KU-00500, SC1341-KU-00501, SC1341-KU-00502, SC1341-KU-00503, SC1341-KU-00504, SC1341-KU-00505, SC1341-KU-00506, SC1341-KU-00507, SC1341-KU-00508, SC1341-KU-00509, SC1341-KU-00510, SC1341-KU-00511, SC1341-KU-00512, SC1341-KU-00513, SC1341-KU-00514, SC1341-KU-00516, SC1341-KU-00517, SC1341-KU-00518, SC1341-KU-00519, SC1341-KU-00520, SC1341-KU-00521, SC1341-KU-00522, SC1341-KU-00523, SC1341-KU-00524, SC1341-KU-00525, SC1341-KU-00526, SC1341-KU-00527, SC1341-KU-00528, SC1341-KU-00529, SC1341-KU-00530, SC1341-KU-00531, SC1341-KU-00532, SC1341-KU-00533, SC1341-KU-00534, SC1341-KU-00535, SC1341-KU-00536, SC1341-KU-00537, SC1341-KU-00538, SC1341-KU-00539, SC1341-KU-00540, SC1341-KU-00541, SC1341-KU-00542, SC1341-KU-00543, SC1341-KU-00544, SC1341-KU-00545, SC1341-KU-00546, SC1341-KU-00547, SC1341-KU-00548, SC1341-KU-00549, SC1341-KU-00550, SC1341-KU-00551, SC1341-KU-00552, SC1341-KU-00553, SC1341-KU-00554, SC1341-KU-00555, SC1341-KU-00556, SC1341-KU-00557, SC1341-KU-00558, SC1341-KU-00559, SC1341-KU-00560, SC1341-KU-00561, SC1341-KU-00562, SC1341-KU-00563, SC1341-KU-00564, SC1341-KU-00565, SC1341-KU-00566, SC1341-KU-00567, SC1341-KU-00568, SC1341-KU-00569, SC1341-KU-00570, SC1341-KU-00571, SC1341-KU-00572, SC1341-KU-00573, SC1341-KU-00574, SC1341-KU-00575, SC1341-KU-00576, SC1341-KU-00577, SC1341-KU-00578, SC1341-KU-00579, SC1341-KU-00580, SC1341-KU-00581, SC1341-KU-00582, SC1341-KU-00583, SC1341-KU-00584, SC1341-KU-00585, SC1341-KU-00586, SC1341-KU-00587, SC1341-KU-00588, SC1341-KU-00589, SC1341-KU-00590, SC1341-KU-00591, SC1341-KU-00592, SC1341-KU-00594, SC1341-KU-00595, SC1341-KU-00596, SC1341-KU-00597, SC1341-KU-00598, SC1341-KU-00599, SC1341-KU-00600, SC1341-KU-00601, SC1341-KU-00602, SC1341-KU-00603, SC1341-KU-00604, SC1341-KU-00605, SC1341-KU-00606, SC1341-KU-00607, SC1341-KU-00608, SC1341-KU-00609, SC1341-KU-00610, SC1341-KU-00611, SC1341-KU-00612, SC1341-KU-00613, SC1341-KU-00614, SC1341-KU-00615, SC1341-KU-00616, SC1341-KU-00617, SC1341-KU-00618, SC1341-KU-00619, SC1341-KU-00620, SC1341-KU-00621, SC1341-KU-00622, SC1341-KU-00623, SC1341-KU-00624, SC1341-KU-00625, SC1341-KU-00626, SC1341-KU-00627, SC1341-KU-00628, SC1341-KU-00629, SC1341-KU-00630, SC1341-KU-00631, SC1341-KU-00632

## 未决与不宣称

- CG-ENTEACH 尚未交付对先前各批 REVISE（00006 snooze、00117 bedside table、
  00239 shower gel、00269 get clean、00347 replace the toothbrush head、00373 stubble、
  00390 treat a small cut、00399 get ready quickly）的修订包；本批新增 5 条 REVISE 的修正亦待作者交付新包后
  定向复验，不在本复审范围。
- CG-QA 的独立语义复核与双 AI 对账仍待进行；本复审不代记双 AI 结论。
- `production_ready: false`、`activation_allowed: false`、`publishable: 0` 均不变，
  本复审不批准启用、不批准发布。
- V51 剩余 1,406 条未生产（本批固定版本 HEAD `c1457be9` 时点），不在本复审范围；
  教学分支此后新增的 SC50-0004 rank 21–120（HEAD `a25a3f0a`）亦不在本批范围。
