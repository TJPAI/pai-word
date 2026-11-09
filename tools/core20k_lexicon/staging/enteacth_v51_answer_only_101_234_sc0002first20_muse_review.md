# MU-ENTEACH 独立复审：Scene1341 V51 答案型 SC50-0001 ranks 101–234 + SC50-0002 ranks 1–20

- 对象：教学分支 `answer-enrichment-main-dev-20261026` HEAD `6339e45`（`6339e459c42cf8f531ba203e706faef93ffa44f7`），
  Pack A `tools/answer-enrichment/scene1341-v51-sc0001-answer-only-101-130.v2.json`
  （blob `6bf55d6e8d4c…`，30 条，SC50-0001 rank 101-130，提交 `b02556e`），
  Pack B `tools/answer-enrichment/scene1341-v51-sc0001-answer-only-131-180.v2.json`
  （blob `78a58e8cffb2…`，50 条，SC50-0001 rank 131-180，提交 `37f78ea`），
  Pack C `tools/answer-enrichment/scene1341-v51-sc0001-answer-only-181-234.v2.json`
  （blob `b78235ebf6bc…`，54 条，SC50-0001 rank 181-234，提交 `1b4bcfa`），
  Pack D `tools/answer-enrichment/scene1341-v51-sc0002-answer-only-001-020.v2.json`
  （blob `d153f196e30a…`，20 条，SC50-0002 rank 1-20，提交 `9dc27bd`），
  schema 均为答案型 V2（新顶层信封：schema_version / release_status / source / identity / scope / records，
  无顶层 release 对象，activation_allowed 在每条记录上，全部为 false；release_status 均为 EDITORIAL_STAGING_ONLY）。
- 来源：`cg-main-fourline-integration-20261026` 分支
  `tools/integration/scene1341-ranked/v51-ranked.csv`（blob `eaa6d729…`，2,038 行），
  场景 SC50-0001 起床与晨间准备（ranks 101–234）、SC50-0002 洗漱与个人清洁（ranks 1–20）。
- 任务来源：Issue #1 评论 6744354493（23:46 全新 KU 生产）与 6745276777（00:25 答案型重启，
  取代旧四选题任务）；CG-ENTEACH 交付 6746538898（101–130）、6746645350（131–180）、
  6746737547（181–234）请 CG-QA/MU-ENTEACH 审核；CG-MAIN 6746527764 请 CG-QA/MU-ENTEACH
  提供批准列表后再开放 SRS 评分。SC50-0002 首 20 条尚无 CG-ENTEACH 的 Issue 交付，
  本复审按用户“继续”指令对教学分支 HEAD `6339e45` 的固定版本直接复审，不冒充已交付批次。
  SC50-0002 ranks 21–70 已在分支上存在，不在本批范围。
- 复审性质：**作者已知非盲**（CG-ENTEACH 为作者），但**对他线 verdict 盲审**——四名复核员
  只凭四个包文件与源 CSV 判读，未读任何 Issue 评论、未查他线对本批的 verdict、未搜网。
  仅答案页教学内容层，不审题目（本题无题目字段）。
- 方法：154 条分 4 组、每组一个包，由 4 名复核员各自独立判读（各组互不见 verdict，
  判完才合并）；协调员合并后核对覆盖（154 条、SC1341-KU-00101..00254 各恰一次），
  并以 scene_id + rank 逐条独立重算身份绑定（CSV 内 rank 按场景重起，须按场景限定查找；
  全局 rank 查找会撞到其他场景的同 rank 行）。
- 判读标准（与 21–100 条一致）：身份绑定对源 CSV 行（expression / sense_zh / scene_id /
  rank / sense_id / tier）；例句英文自然且真实体现释义义；汉译忠实自然；搭配真实且贴合该义；
  usage/contrast 注真实、在范围内、有用；meaning_zh == sense_zh；display 字段与 answer 字段一致；
  无 question / correct_choice_id 字段；每条 activation_allowed 为 false。REVISE 只给真实缺陷
  （须附具体修正方案），HOLD 只给身份或义确实不清者，不用 HOLD 装风格问题；轻微不完美但正确自然者判 PASS。
- 语义依据与限制：V51 CSV 未附冻结英文定义，判读依据为源 sense_zh、expression 与
  场景上下文；不凭中文像自动 PASS，每条均核对英文例句是否真实体现该义。
  本复审为 Muse 教学线独立判断，**不是双 AI 认证**：双 AI 对账须待 CG-QA/MU-QA 的
  verdict 后由 CG-QA 按版本规则确认；本复审的判读未参考他线 verdict。

## 结论

**PASS 152 / REVISE 2 / HOLD 0。** 身份绑定 154/154（协调员 scene-scoped 独立重算；
各复核员亦逐条核对）；无题目字段 154/154；display 与 answer 一致性 154/154；
meaning_zh == sense_zh 154/154；新信封 4/4 通过（schema_version 与 release_status 均符合，
per-record activation_allowed 全部为 false）。

| 包 | 范围 | PASS | REVISE | HOLD |
|---|---|---|---|---|
| Pack A | SC50-0001 ranks 101-130（30 条） | 29 | 1 | 0 |
| Pack B | SC50-0001 ranks 131-180（50 条） | 50 | 0 | 0 |
| Pack C | SC50-0001 ranks 181-234（54 条） | 54 | 0 | 0 |
| Pack D | SC50-0002 ranks 1-20（20 条） | 19 | 1 | 0 |
| 合计 | 154 条 | 152 | 2 | 0 |

| scene_ku_id | expression | 结论 | 备注 |
|---|---|---|---|
| SC1341-KU-00101 | throw off the covers | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00102 | pull up the covers | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00103 | get back into bed | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00104 | straighten the sheets | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00105 | fluff the pillow | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00106 | fold the blanket | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00107 | put away the blanket | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00108 | bed | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00109 | mattress | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00110 | pillow | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00111 | pillowcase | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00112 | bedsheet | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00113 | blanket | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00114 | duvet | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00115 | comforter | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00116 | covers | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00117 | bedside table | REVISE | Second collocation 'a bedside lamp' does not contain or collocate with the headword 'bedside table'. |
| SC1341-KU-00118 | nightstand | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00119 | slippers | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00120 | bathrobe | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00121 | curtains | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00122 | blinds | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00123 | open the curtains | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00124 | close the blinds | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00125 | let in some light | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00126 | open the window | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00127 | get some fresh air | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00128 | turn on the light | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00129 | turn off the light | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00130 | check the time | PASS | Example, translation, collocations and note all genuinely support the glossed sense. |
| SC1341-KU-00131 | reach for your phone | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00132 | sit still for a minute | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00133 | groggy | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00134 | drowsy | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00135 | tired | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00136 | exhausted | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00137 | alert | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00138 | energetic | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00139 | sluggish | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00140 | drained | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00141 | refreshed | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00142 | stiff | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00143 | sore | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00144 | achy | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00145 | dizzy | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00146 | lightheaded | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00147 | headache | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00148 | thirsty | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00149 | hungry | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00150 | cold | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00151 | warm | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00152 | grumpy | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00153 | cranky | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00154 | cheerful | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00155 | calm | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00156 | stressed | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00157 | anxious | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00158 | relaxed | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00159 | motivated | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00160 | feel better | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00161 | feel like going back to bed | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00162 | need a minute | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00163 | clear your head | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00164 | wake yourself up | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00165 | perk up | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00166 | morning breath | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00167 | puffy eyes | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00168 | stuffy nose | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00169 | dry mouth | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00170 | sleep inertia | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00171 | stiff neck | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00172 | low energy | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00173 | feel rested | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00174 | freshen up | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00175 | rinse your mouth | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00176 | take a shower | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00177 | take a bath | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00178 | dry off | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00179 | comb your hair | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00180 | brush your hair | PASS | Identity matches source CSV on all six fields; example is natural and illustrates the glossed sense in the morning-routine scene; translation faithful; collocations real; note true and in scope; display consistent; activation_allowed false. |
| SC1341-KU-00181 | get dressed | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00182 | put on clothes | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00183 | take off pajamas | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00184 | change clothes | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00185 | pick out an outfit | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00186 | lay out your clothes | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00187 | get yourself ready | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00188 | get the kids ready | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00189 | tidy up | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00190 | put things away | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00191 | drink a glass of water | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00192 | make coffee | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00193 | brew coffee | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00194 | make tea | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00195 | put the kettle on | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00196 | grab breakfast | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00197 | skip breakfast | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00198 | make breakfast | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00199 | toast | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00200 | cereal | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00201 | oatmeal | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00202 | pack lunch | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00203 | pack your bag | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00204 | grab your keys | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00205 | grab your phone | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00206 | check your phone | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00207 | check your messages | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00208 | check the weather | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00209 | check your schedule | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00210 | charge your phone | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00211 | unplug your phone | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00212 | put on your shoes | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00213 | put on a coat | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00214 | head out | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00215 | head to work | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00216 | head to school | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00217 | brush your hair back | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00218 | wash your hands | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00219 | apply moisturizer | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00220 | put on sunscreen | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00221 | take your medication | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00222 | take your vitamins | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00223 | fill your water bottle | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00224 | check your commute | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00225 | feed the cat | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00226 | walk the dog | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00227 | pack the kids' lunches | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00228 | make sure the door is locked | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00229 | turn off the lights | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00230 | grab an umbrella | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00231 | hit the snooze button | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00232 | morning grogginess | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00233 | get out the door | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00234 | turn on the alarm | PASS | Identity matches source CSV on all six fields; example, translation, collocations and usage note all genuinely support the glossed sense in the morning-routine scene. |
| SC1341-KU-00235 | wash | PASS | Identity matches source rank 1; example, translation, collocations and note all support the body-washing sense. |
| SC1341-KU-00236 | rinse | PASS | Identity matches source rank 2; example and translation clearly illustrate rinsing off soap, and the wash/rinse contrast note is accurate. |
| SC1341-KU-00237 | sink | PASS | Identity matches source rank 3; toothbrush-beside-the-sink example naturally illustrates the washbasin sense in the bathroom scene. |
| SC1341-KU-00238 | soap | PASS | Identity matches source rank 4; example, translation, collocations and the uncountable-noun note are all correct. |
| SC1341-KU-00239 | shower gel | REVISE | Identity matches source rank 5, but example_zh renders shower gel as 沐浴露 while the gloss/meaning_zh is 沐浴啫喱, an inconsistent term for the same word within one record. |
| SC1341-KU-00240 | towel | PASS | Identity matches source rank 6; example, translation, collocations and the bath/hand towel note are all correct. |
| SC1341-KU-00241 | shower curtain | PASS | Identity matches source rank 7; example and translation naturally illustrate closing the shower curtain before showering. |
| SC1341-KU-00242 | toothbrush | PASS | Identity matches source rank 8; example about fraying bristles genuinely illustrates toothbrush, with accurate translation and collocations. |
| SC1341-KU-00243 | toothpaste | PASS | Identity matches source rank 9; tube-of-toothpaste example, translation and uncountable-noun note are all correct. |
| SC1341-KU-00244 | floss | PASS | Identity matches source rank 10; dental-floss example and the noun/verb note correctly support the 牙线 sense. |
| SC1341-KU-00245 | floss pick | PASS | Identity matches source rank 11; example, translation and the floss-pick vs dental-floss distinction are all correct. |
| SC1341-KU-00246 | deodorant | PASS | Identity matches source rank 12; post-shower example supports the sense, and the deodorant/antiperspirant note is accurate. |
| SC1341-KU-00247 | shampoo | PASS | Identity matches source rank 13; ran-out-of-shampoo example, translation and noun/verb note are all correct. |
| SC1341-KU-00248 | conditioner | PASS | Identity matches source rank 14; example about applying conditioner to hair ends and the leave-in note are accurate. |
| SC1341-KU-00249 | brush your teeth | PASS | Identity matches source rank 15; example, translation and the brush-vs-wash note are all correct. |
| SC1341-KU-00250 | rinse your mouth | PASS | Identity matches source rank 16; post-brushing mouth-rinsing example and the mouth/face contrast note are accurate. |
| SC1341-KU-00251 | floss your teeth | PASS | Identity matches source rank 17; bedtime flossing example, translation and verb-use note are all correct. |
| SC1341-KU-00252 | wash your hands | PASS | Identity matches source rank 18; wash-with-soap-before-eating example, translation and collocations are all correct. |
| SC1341-KU-00253 | rinse off the soap | PASS | Identity matches source rank 19; example and the separable-phrasal-verb note (rinse it off) are both correct. |
| SC1341-KU-00254 | wash your face | PASS | Identity matches source rank 20; lukewarm-water morning face-washing example, translation and note are all correct. |

## REVISE / HOLD 明细

- **SC1341-KU-00117 bedside table**（REVISE）：collocation_mismatch
  拟议修正：Replace collocation 'a bedside lamp' with 'put something on the bedside table' (and update display.c accordingly), so both collocations contain the headword 'bedside table'.
- **SC1341-KU-00239 shower gel**（REVISE）：Terminology inconsistency: example_zh uses 沐浴露, gloss uses 沐浴啫喱.
  拟议修正：Change example_zh to 我把沐浴啫喱放在淋浴间的架子上。 (and the same in display.example_zh) so the example uses the glossed term 沐浴啫喱.

## 非阻断观察（不构成 verdict，均已按不拔高规则判 PASS）

- SC1341-KU-00152 grumpy：源释义提及起床气，用法注已正确说明 grumpy 本身并非专指晨起坏脾气，
  注的框定处理了范围，义未被误读。
- SC1341-KU-00193 brew coffee（煮咖啡）：用法注明确 brew 指冲泡/萃取过程，不必然是煮沸，
  避免了字面误读。
- SC1341-KU-00234 turn on the alarm：用法注正确区分“开启已设好的闹钟”与“set an alarm（设定闹钟）”。
- 其余 PASS 条目的轻微风格注见各组 verdict 的备注栏，均不构成缺陷。

## 批准列表（APPROVAL LIST，供 CG-MAIN 的 SRS 门禁）

以下 152 条为本复审 PASS 的 scene_ku_id，与 verdicts 逐条对应，供 CG-MAIN 在 CG-QA/MU-ENTEACH
提供批准列表后开放 SRS 评分时使用。本列表不批准启用、不批准发布，activation_allowed 仍为 false。

SC1341-KU-00101, SC1341-KU-00102, SC1341-KU-00103, SC1341-KU-00104, SC1341-KU-00105, SC1341-KU-00106, SC1341-KU-00107, SC1341-KU-00108, SC1341-KU-00109, SC1341-KU-00110, SC1341-KU-00111, SC1341-KU-00112, SC1341-KU-00113, SC1341-KU-00114, SC1341-KU-00115, SC1341-KU-00116, SC1341-KU-00118, SC1341-KU-00119, SC1341-KU-00120, SC1341-KU-00121, SC1341-KU-00122, SC1341-KU-00123, SC1341-KU-00124, SC1341-KU-00125, SC1341-KU-00126, SC1341-KU-00127, SC1341-KU-00128, SC1341-KU-00129, SC1341-KU-00130, SC1341-KU-00131, SC1341-KU-00132, SC1341-KU-00133, SC1341-KU-00134, SC1341-KU-00135, SC1341-KU-00136, SC1341-KU-00137, SC1341-KU-00138, SC1341-KU-00139, SC1341-KU-00140, SC1341-KU-00141, SC1341-KU-00142, SC1341-KU-00143, SC1341-KU-00144, SC1341-KU-00145, SC1341-KU-00146, SC1341-KU-00147, SC1341-KU-00148, SC1341-KU-00149, SC1341-KU-00150, SC1341-KU-00151, SC1341-KU-00152, SC1341-KU-00153, SC1341-KU-00154, SC1341-KU-00155, SC1341-KU-00156, SC1341-KU-00157, SC1341-KU-00158, SC1341-KU-00159, SC1341-KU-00160, SC1341-KU-00161, SC1341-KU-00162, SC1341-KU-00163, SC1341-KU-00164, SC1341-KU-00165, SC1341-KU-00166, SC1341-KU-00167, SC1341-KU-00168, SC1341-KU-00169, SC1341-KU-00170, SC1341-KU-00171, SC1341-KU-00172, SC1341-KU-00173, SC1341-KU-00174, SC1341-KU-00175, SC1341-KU-00176, SC1341-KU-00177, SC1341-KU-00178, SC1341-KU-00179, SC1341-KU-00180, SC1341-KU-00181, SC1341-KU-00182, SC1341-KU-00183, SC1341-KU-00184, SC1341-KU-00185, SC1341-KU-00186, SC1341-KU-00187, SC1341-KU-00188, SC1341-KU-00189, SC1341-KU-00190, SC1341-KU-00191, SC1341-KU-00192, SC1341-KU-00193, SC1341-KU-00194, SC1341-KU-00195, SC1341-KU-00196, SC1341-KU-00197, SC1341-KU-00198, SC1341-KU-00199, SC1341-KU-00200, SC1341-KU-00201, SC1341-KU-00202, SC1341-KU-00203, SC1341-KU-00204, SC1341-KU-00205, SC1341-KU-00206, SC1341-KU-00207, SC1341-KU-00208, SC1341-KU-00209, SC1341-KU-00210, SC1341-KU-00211, SC1341-KU-00212, SC1341-KU-00213, SC1341-KU-00214, SC1341-KU-00215, SC1341-KU-00216, SC1341-KU-00217, SC1341-KU-00218, SC1341-KU-00219, SC1341-KU-00220, SC1341-KU-00221, SC1341-KU-00222, SC1341-KU-00223, SC1341-KU-00224, SC1341-KU-00225, SC1341-KU-00226, SC1341-KU-00227, SC1341-KU-00228, SC1341-KU-00229, SC1341-KU-00230, SC1341-KU-00231, SC1341-KU-00232, SC1341-KU-00233, SC1341-KU-00234, SC1341-KU-00235, SC1341-KU-00236, SC1341-KU-00237, SC1341-KU-00238, SC1341-KU-00240, SC1341-KU-00241, SC1341-KU-00242, SC1341-KU-00243, SC1341-KU-00244, SC1341-KU-00245, SC1341-KU-00246, SC1341-KU-00247, SC1341-KU-00248, SC1341-KU-00249, SC1341-KU-00250, SC1341-KU-00251, SC1341-KU-00252, SC1341-KU-00253, SC1341-KU-00254

## 未决与不宣称

- 首 20 条的唯一 REVISE（SC1341-KU-00006 snooze）不在本批范围；其包自 00:32 后未动，修正尚未落地。
- CG-QA/MU-QA 的独立语义复核与双 AI 对账仍待进行；本复审不代替其 verdict。
- `production_ready: false`、`activation_allowed: false`、`publishable: 0` 均不变，
  本复审不批准启用、不批准发布。
- V51 剩余 1,804 条未生产，不在本复审范围；SC50-0002 ranks 21–70 已在分支上存在，不在本批范围。
