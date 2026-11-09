# MU-ENTEACH Position on the 22 Disputed Items — Scene1341 V51 Answer-only

## Object

- Triage file: `CG_QA_SCENE1341_ANSWER_ONLY_22_CROSSLINE_DISPUTES_TRIAGE_20261110.v1.json`, commit `8fa04dc`, blob `af32b874…`
- V3 ledger blob: `bdb6a2fb…`
- Teaching branch: `answer-enrichment-main-dev-20261026`, HEAD `6339e45` (pinned; packs fetched fresh by `git show` from this HEAD)
- CG-QA reconciliation comment: `6747925757` (Issue #1, 2026-11-10 02:20)
- CG-QA triage comment: `6748044374` (Issue #1, 2026-11-10 02:27)
- Source V51 CSV: `tools/integration/scene1341-ranked/v51-ranked.csv` (2,038 rows, blob `eaa6d729…`); rows looked up by scene_id + rank
- MU-ENTEACH prior reviews: ranks 1–20 (PASS 19 / REVISE 1), 21–100 (PASS 80), 101–234 + SC50-0002 1–20 (PASS 152 / REVISE 2)
- Reconciliation context: dual PASS 231, dual REVISE 1 (SC1341-KU-00006 snooze), disputes 22 — this document covers ONLY the 22 disputed items.

## Method

Directed re-review of the disputed items only, under the six-line protocol (disagreement means re-review of ONLY the disputed items). Four reviewers, one per chunk (items 1–6, 7–12, 13–17, 18–22), each re-read the actual author-pack record and the matching source CSV row, then judged CG-QA's issue_summary on its merits against the record. This re-review is deliberately NOT blind: reviewers knew CG-QA's issues and decided whether each holds. Neither side was rubber-stamped: AGREE means the issue is real and MU changes its verdict to REVISE (with a specific fix, or an owner-decision note where the fix needs a CG-MASTER source-gloss decision); DISAGREE means the issue does not hold against the record and MU maintains its original verdict, with concrete reasons quoting the record. The coordinator independently re-verified coverage (22 items, each exactly once) and spot-checked six records against the packs (00163, 00199, 00040, 00089, 00152, 00223) — all reviewer claims held.

## Scope and limits

- This is MU-ENTEACH's position on the 22 disputed items only. It is NOT a dual-AI certification and NOT a release decision.
- Fixes belong to the triage owners (CG-ENTEACH / CG-MASTER); MU-ENTEACH does not edit author packs or source glosses.
- activation_allowed false, production_ready false, publishable 0.

## Position counts

- Disputed items reviewed: 22
- AGREE (issue is real; MU moves to REVISE): 7
- DISAGREE (issue does not hold; MU maintains original verdict): 15
- MU new verdicts after re-review: PASS 14 / REVISE 8 / HOLD 0
- AGREE: SC1341-KU-00040, SC1341-KU-00086, SC1341-KU-00089, SC1341-KU-00097, SC1341-KU-00117, SC1341-KU-00152, SC1341-KU-00223
- DISAGREE: SC1341-KU-00050, SC1341-KU-00058, SC1341-KU-00080, SC1341-KU-00103, SC1341-KU-00121, SC1341-KU-00132, SC1341-KU-00161, SC1341-KU-00163, SC1341-KU-00193, SC1341-KU-00195, SC1341-KU-00199, SC1341-KU-00221, SC1341-KU-00234, SC1341-KU-00239, SC1341-KU-00241

## Per-item table

| scene_ku_id | expression | CG verdict | MU original | MU position | MU new verdict | triage category | next owner |
|---|---|---|---|---|---|---|---|
| SC1341-KU-00040 | be short on sleep | CONDITIONAL | PASS | AGREE | REVISE | COLLOCATION_NATURALNESS | CG-ENTEACH |
| SC1341-KU-00050 | morning person | REVISE | PASS | DISAGREE | PASS | LEXICAL_DISTINCTION | CG-ENTEACH |
| SC1341-KU-00058 | miss the alarm | CONDITIONAL | PASS | DISAGREE | PASS | MEANING_SCOPE | CG-ENTEACH |
| SC1341-KU-00080 | early start | CONDITIONAL | PASS | DISAGREE | PASS | MEANING_SCOPE | CG-ENTEACH |
| SC1341-KU-00086 | appointment | CONDITIONAL | PASS | AGREE | REVISE | MEANING_SCOPE | CG-ENTEACH |
| SC1341-KU-00089 | first thing in the morning | REVISE | PASS | AGREE | REVISE | GRAMMATICAL_FUNCTION | CG-ENTEACH |
| SC1341-KU-00097 | stand up | CONDITIONAL | PASS | AGREE | REVISE | COLLOCATION_NATURALNESS | CG-ENTEACH |
| SC1341-KU-00103 | get back into bed | CONDITIONAL | PASS | DISAGREE | PASS | MEANING_SCOPE | CG-ENTEACH |
| SC1341-KU-00117 | bedside table | CONDITIONAL | REVISE | AGREE | REVISE | COLLOCATION_NOT_TARGET | CG-ENTEACH |
| SC1341-KU-00121 | curtains | CONDITIONAL | PASS | DISAGREE | PASS | MEANING_SCOPE | CG-ENTEACH |
| SC1341-KU-00132 | sit still for a minute | CONDITIONAL | PASS | DISAGREE | PASS | MASTER_GLOSS_SCOPE | CG-MASTER |
| SC1341-KU-00152 | grumpy | CONDITIONAL | PASS | AGREE | REVISE | MASTER_GLOSS_SCOPE | CG-MASTER |
| SC1341-KU-00161 | feel like going back to bed | CONDITIONAL | PASS | DISAGREE | PASS | MASTER_GLOSS_SCOPE | CG-MASTER |
| SC1341-KU-00163 | clear your head | CONDITIONAL | PASS | DISAGREE | PASS | MASTER_GLOSS_SCOPE | CG-MASTER |
| SC1341-KU-00193 | brew coffee | CONDITIONAL | PASS | DISAGREE | PASS | TRANSLATION_AND_USAGE | CG-ENTEACH |
| SC1341-KU-00195 | put the kettle on | REVISE | PASS | DISAGREE | PASS | MEANING_SCOPE | CG-ENTEACH |
| SC1341-KU-00199 | toast | CONDITIONAL | PASS | DISAGREE | PASS | PART_OF_SPEECH | CG-ENTEACH |
| SC1341-KU-00221 | take your medication | CONDITIONAL | PASS | DISAGREE | PASS | MASTER_GLOSS_SCOPE | CG-MASTER |
| SC1341-KU-00223 | fill your water bottle | CONDITIONAL | PASS | AGREE | REVISE | MASTER_GLOSS_IDENTITY | CG-MASTER |
| SC1341-KU-00234 | turn on the alarm | CONDITIONAL | PASS | DISAGREE | PASS | TRANSLATION_AND_USAGE | CG-ENTEACH |
| SC1341-KU-00239 | shower gel | PASS | REVISE | DISAGREE | REVISE | TERMINOLOGY_VARIATION | CG-MASTER |
| SC1341-KU-00241 | shower curtain | CONDITIONAL | PASS | DISAGREE | PASS | TRANSLATION_AND_USAGE | CG-ENTEACH |

## Detail per item

### SC1341-KU-00040 — be short on sleep

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **AGREE** | MU new verdict: **REVISE**
- Triage category: COLLOCATION_NATURALNESS | Next owner: CG-ENTEACH
- CG-QA issue: 'feel short on sleep'并非最自然的固定搭配，通常说'be short on sleep'或'feel sleep-deprived/tired'；核心英语例句与释义正确。
- MU reasoning: CG-QA's point holds against the record. The core is correct — example_en "I'm short on sleep after working late all week." uses the canonical 'be short on sleep' form and meaning_zh "睡眠不足" is right — but the record lists "feel short on sleep" as a collocation (answer.collocations: ["be short on sleep", "feel short on sleep"], display.c: "be short on sleep · feel short on sleep"). 'Feel short on sleep' is not a natural fixed collocation; the idiomatic phrasing for the feeling is 'feel sleep-deprived/tired'. The defect is confined to the second listed collocation, so the fix is narrow.
- Proposed fix: In answer.collocations and display.c, replace "feel short on sleep" with "feel sleep-deprived" (keep "be short on sleep" as the primary collocation). Example sentence, meaning_zh and usage_note unchanged.

### SC1341-KU-00050 — morning person

- CG-QA verdict: REVISE | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: LEXICAL_DISTINCTION | Next owner: CG-ENTEACH
- CG-QA issue: morning person与'being at my best in the morning'不完全等值，前者强调在早上状态良好，后者强调早上精神状态最佳。
- MU reasoning: CG-QA's claimed non-equivalence does not hold against the record, because the record never equates 'morning person' with 'being at my best in the morning'. The example is "I'm a morning person and do my best work before noon." — 'do my best work before noon' is a natural illustration of being a morning person, not a definitional equivalence — and the usage_note already draws exactly the distinction CG-QA wants: "morning person指早晨精神和效率较好的人，不只是某天起得早。" Meaning_zh "习惯早起的人" is the standard gloss, collocations "be a morning person · not a morning person" are correct, and the example_zh "我是个习惯早起的人，中午前工作效率最高。" is faithful. No defect in the record.

### SC1341-KU-00058 — miss the alarm

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MEANING_SCOPE | Next owner: CG-ENTEACH
- CG-QA issue: 'I missed the alarm because my phone was on silent'在英文语境中成立，但'miss the alarm'的习惯搭配弱弱于'not hear my alarm'或'sleep through my alarm'。
- MU reasoning: CG-QA concedes the English sentence holds ("'I missed the alarm because my phone was on silent'在英文语境中成立"), and the preference for 'not hear my alarm' / 'sleep through my alarm' is stylistic, not a defect: 'miss the alarm' (record collocations: "miss the alarm", "miss your morning alarm") is itself a standard, common idiomatic collocation. The scope CG-QA worries about is already handled in the record: usage_note "miss the alarm在此指未听见或未注意到提醒；不表示错过预约。" and example_zh "手机设成静音，我没听到闹钟提醒。" both convey the didn't-hear-it sense. Nothing in the record is wrong.

### SC1341-KU-00080 — early start

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MEANING_SCOPE | Next owner: CG-ENTEACH
- CG-QA issue: The source gloss 'early start' is vague: it usually refers to starting something early than 'getting up early', so the source should state 'early start' as 'starting the day early' rather than 'waking up early'.
- MU reasoning: CG-QA's issue misreads the record: it asks that the gloss state 'early start' as 'starting the day early' rather than 'waking up early', but the record already does exactly that. Source CSV (SC50-0001 rank 80) sense_zh is "提前开始一天", pack meaning_zh is "提前开始一天", usage_note is "early start常指一天或活动较早开始。", and the example "We have an early start tomorrow, so let's go to bed." / "明天要很早开始一天的活动，我们早点睡吧。" frames it as starting the day's activities early, not getting up early. The requested fix is already in place; there is no 'waking up early' gloss anywhere in the record.

### SC1341-KU-00086 — appointment

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **AGREE** | MU new verdict: **REVISE**
- Triage category: MEANING_SCOPE | Next owner: CG-ENTEACH
- CG-QA issue: English doctor's appointment is correct; Chinese '我九点有个医生预约' is unnatural and may imply scheduling the physician rather than seeing a physician.
- MU reasoning: CG-QA's point holds against the record. The English is correct — example_en "I have a doctor's appointment at nine." with collocations "make an appointment · doctor's appointment" — but the Chinese example "我九点有个医生预约。" is translationese: '医生预约' as a bare noun phrase is compressed and unnatural, and reads as if the appointment itself were the object possessed rather than a scheduled visit to see a doctor. A natural rendering would use the verb construction ('约了医生') or a fuller noun phrase ('看医生的预约'). The defect is confined to example_zh; meaning_zh "预约安排" and the English side are fine.
- Proposed fix: Change answer.example_zh (and display.example_zh) from "我九点有个医生预约。" to "我九点约了医生看病。" Example_en, meaning_zh, collocations and usage_note unchanged.

### SC1341-KU-00089 — first thing in the morning

- CG-QA verdict: REVISE | MU original verdict: PASS | MU position: **AGREE** | MU new verdict: **REVISE**
- Triage category: GRAMMATICAL_FUNCTION | Next owner: CG-ENTEACH
- CG-QA issue: 'first thing in the morning' is normally an adverbial time expression meaning very early in the morning / as the first action; Chinese '一早首先做的事' misclassifies the phrase as a nominal item.
- MU reasoning: CG-QA's point holds against the record. 'First thing in the morning' is an adverbial time expression, and the record's own example uses it correctly as one — "First thing in the morning, I check my messages." — with usage_note "指早晨很早或首先做某事，不必是字面上的第一件物品。" But the gloss nominalizes it: meaning_zh (and display.m, and source CSV sense_zh) is "一早首先做的事" ('the first thing done in the morning'), which presents the phrase as a nominal item a learner could mistake for a noun phrase. The adverbial function is demonstrated by the example but contradicted by the gloss, so the gloss needs correcting; the example and usage_note do not.
- Proposed fix: Change answer.meaning_zh and display.m from "一早首先做的事" to "一大早；早上首先（做某事）", making the adverbial time-expression function explicit. Example_en, example_zh and usage_note unchanged. (Source CSV sense_zh carries the same wording; CG-ENTEACH to confirm whether the source gloss is aligned or left as-is.)

### SC1341-KU-00097 — stand up

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **AGREE** | MU new verdict: **REVISE**
- Triage category: COLLOCATION_NATURALNESS | Next owner: CG-ENTEACH
- CG-QA issue: The main example is natural, but 'stand up from bed' is not the most natural way to describe rising from a bed; the pairing can confuse stand up with get out of bed.
- MU reasoning: CG-QA's issue holds against the record. The collocation list is "stand up slowly" and "stand up from bed", and the usage note itself frames the verb as "stand up表示从坐姿等姿势站起" (rising from a sitting or similar posture). Rising from bed is from a lying position, not a sitting one, so "stand up from bed" contradicts the note's own framing and teaches the learner to use stand up where idiomatic English uses "get out of bed". The main example "I stood up and walked to the bathroom." is natural, so the defect is confined to the second collocation.
- Proposed fix: Replace collocation "stand up from bed" with "stand up from the chair" (matching the usage note's sitting-posture framing) and update display.c to "stand up slowly · stand up from the chair". Leave the example and usage note unchanged.

### SC1341-KU-00103 — get back into bed

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MEANING_SCOPE | Next owner: CG-ENTEACH
- CG-QA issue: get back into bed means return to bed, not necessarily lie down; the source gloss 重新躺回床上 presumes lying position. The example 'for another ten minutes' does not force lying.
- MU reasoning: CG-QA's issue misreads the record. First, "get into bed" itself entails being in bed in a reclining/lying position, so the gloss "重新躺回床上" does not smuggle in a lying reading that the English lacks. Second, the record's own usage note is neutral and does not overclaim: "get back into bed表示再次上床，区别于get out of bed。" Third, the example supplies the lying/resting reading through its own context, not through the gloss alone: "I got back into bed for another ten minutes." / "我又回到床上躺了十分钟。" In a morning wake-up scene, getting back into bed for ten more minutes is a snooze/lying-down scenario. The source CSV row (SC50-0001, rank 103) confirms the source gloss is "重新躺回床上", identical to the answer's meaning_zh, so there is no answer-vs-source drift either. No change warranted.

### SC1341-KU-00117 — bedside table

- CG-QA verdict: CONDITIONAL | MU original verdict: REVISE | MU position: **AGREE** | MU new verdict: **REVISE**
- Triage category: COLLOCATION_NOT_TARGET | Next owner: CG-ENTEACH
- CG-QA issue: bedside lamp is a legitimate expression but is not a collocation with the target expression bedside table; current other collocation on the bedside table is accurate.
- MU reasoning: Both sides agree on substance; only the severity label differs, and MU's original REVISE stands. The record confirms the defect directly: the collocations are "on the bedside table" and "a bedside lamp". The second item is a noun phrase naming a different object (a lamp) that merely happens to sit near a bed; it does not contain the target expression "bedside table" at all, so it cannot teach a collocation of the target. The example "I left my glasses on the bedside table." and the usage note ("bedside table是床旁小桌或柜，美式也常说nightstand。") are fine, so the defect is confined to the second collocation.
- Proposed fix: Replace collocation "a bedside lamp" with "put something on the bedside table" (and update display.c accordingly), so both collocations contain the headword "bedside table". This is MU's original proposed fix, unchanged.

### SC1341-KU-00121 — curtains

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MEANING_SCOPE | Next owner: CG-ENTEACH
- CG-QA issue: Draw the curtains is commonly used to mean close curtains, while open the curtains is unambiguous for opening; teaching note 'may mean open or close' is imprecise without a following explicit direction.
- MU reasoning: The record's wording already handles the ambiguity CG-QA flags. The usage note states it explicitly: "draw the curtains可能表示拉上或拉开，须结合上下文；open更明确。" That is the explicit direction CG-QA says is missing: it tells the learner draw is ambiguous, that context decides, and that open is the unambiguous alternative. The example then models the unambiguous opening: "I opened the curtains to let in the morning sun." / "我拉开窗帘，让早晨的阳光照进来。" Listing both "draw the curtains" and "open the curtains" as collocations is therefore not a confusion risk: the note contrasts them on exactly the point CG-QA raises. No change warranted.

### SC1341-KU-00132 — sit still for a minute

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MASTER_GLOSS_SCOPE | Next owner: CG-MASTER
- CG-QA issue: The source gloss 'sit still for a minute' is a reasonable paraphrase as a whole, but 'sit still' alone is more literal and slightly less natural than 'sit in silence' or 'just sit there quietly'.
- MU reasoning: CG-QA's issue does not hold against the record, and its proposed alternatives would change the meaning. The expression "sit still for a minute" is idiomatic, and the example is natural: "I sat still for a minute before standing up." / "站起来之前，我静静坐了一会儿。" The usage note already pins the sense correctly: "still在这里表示不动，而非“仍然”。" CG-QA's suggested "sit in silence" means sitting without speaking, which is a different meaning from sitting without moving, so it is not a more natural rendering of "sit still" but a different phrase; "just sit there quietly" likewise shifts the emphasis. The source CSV row (SC50-0001, rank 132) confirms the source gloss is "坐着缓一会儿", matching the answer's meaning_zh "坐着缓一会儿" exactly, so there is no answer-vs-source drift. No change warranted.

### SC1341-KU-00152 — grumpy

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **AGREE** | MU new verdict: **REVISE**
- Triage category: MASTER_GLOSS_SCOPE | Next owner: CG-MASTER
- CG-QA issue: 'grumpy'通常表示脾气不佳/易烦躁；源义‘起床气大、脾气不好的’虽有通用义，但例句‘before breakfast’被译为‘起床气’，早餐前的烦躁不必然由刚起床导致。
- MU reasoning: CG-QA's issue is real and the record is internally inconsistent on exactly this point. The usage note itself states the correct scope: "grumpy是脾气不佳、容易抱怨，不专指起床气。" But the meaning_zh still says "起床气大、脾气不好的" and the example translation asserts the narrow reading: "I'm always a little grumpy before breakfast." / "早饭前我总有点起床气。" Being grumpy before breakfast need not be caused by having just woken up (it could be hunger, poor sleep, or general mood), yet the Chinese renders it as 起床气, contradicting the note's own correction. The source CSV row (SC50-0001, rank 152) confirms the source gloss itself is "起床气大、脾气不好的", so the narrow reading originates in the source gloss and the fix requires a source-gloss decision by CG-MASTER.
- Owner decision note: AGREE pending CG-MASTER's decision: the source gloss (V51 CSV, SC50-0001 rank 152) is "起床气大、脾气不好的", so MU-ENTEACH cannot unilaterally narrow or widen it. Suggested direction for the owner's decision: drop the 起床气 element from the gloss (e.g. meaning_zh "脾气不好的、容易烦躁的") and re-translate the example as "早饭前我总有点烦躁" so the example no longer asserts the grumpiness is caused by waking up; the usage note ("不专指起床气") already states the correct scope and needs no change.

### SC1341-KU-00161 — feel like going back to bed

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MASTER_GLOSS_SCOPE | Next owner: CG-MASTER
- CG-QA issue: The English 'I feel like going to bed' is natural, but the Chinese '我觉得该去睡觉' is not a literal rendering; '我觉得想去睡觉' is closer to the English.
- MU reasoning: CG-QA's issue does not match this record. The summary quotes the Chinese '我觉得该去睡觉' and proposes '我觉得想去睡觉', but neither string appears anywhere in the pack record or the source CSV row. The actual record glosses the expression as meaning_zh '想回去继续睡' (source CSV sense_zh identical), with example_en "It's so cold that I feel like going back to bed." and example_zh '天太冷了，我想回床上再躺会儿。' — both faithful renderings of 'feel like going back to bed' (wanting to return to bed / lie down again). Collocations 'feel like going back to bed' and 'feel like sleeping in' are real, and the usage note 'feel like后接名词或动名词，不接动词原形。' is true. The quoted defect is absent from the record, so there is nothing in this record to fix; the summary appears to describe a different record (one glossed 'feel like going to bed' without 'back'). MU maintains PASS.

### SC1341-KU-00163 — clear your head

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MASTER_GLOSS_SCOPE | Next owner: CG-MASTER
- CG-QA issue: 'feel groggy' is a natural expression; Chinese '我头晕脑胀' is not its closest meaning and is not limited to grogginess. What appears as confusion here is not only the semantics but also the usage of 'grumpy': 'grumpy' means to be in bad mood, not to feel mentally foggy, so the pairing 'waking up groggy and grumpy' is odd and the pairing should be changed within the teaching fix to avoid confusion.
- MU reasoning: CG-QA's issue does not match this record at all. The summary discusses 'feel groggy', the Chinese '我头晕脑胀', and the pairing 'waking up groggy and grumpy', but none of those strings — 'groggy', 'grumpy', '我头晕脑胀' — appears anywhere in this pack record or its source CSV row. The actual record is expression 'clear your head', sense_zh '让脑子清醒', example_en 'I went outside for five minutes to clear my head.' with example_zh '我出去待了五分钟，让脑子清醒一下。', collocations 'clear your head' and 'go for a walk to clear your head', and usage note 'clear your head指排除杂念、理清思路，不是字面清洗头部。' Every field is internally consistent and faithful to the glossed sense; there is no groggy/grumpy pairing in this record to change. The summary evidently describes a different record. MU maintains PASS.

### SC1341-KU-00193 — brew coffee

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: TRANSLATION_AND_USAGE | Next owner: CG-ENTEACH
- CG-QA issue: The source gloss 'brew coffee' refers to making coffee, but the verb 'brew' specifically means to make beer or coffee by blending or infusing. '泡茶' is not a literal rendering of 'brew coffee'.
- MU reasoning: CG-QA's stated defect is absent from this record, and the semantic concern it raises is already handled by the record itself. The summary claims ''泡茶' is not a literal rendering of 'brew coffee'', but the string '泡茶' appears nowhere in the pack record or the source CSV row: the record glosses brew coffee as '煮咖啡' (meaning_zh '煮咖啡', source CSV sense_zh identical), with example_en 'I brew coffee with freshly ground beans every morning.' and example_zh '我每天早晨用现磨咖啡豆冲泡咖啡。' — '冲泡咖啡' is an accurate rendering of brew. The usage note already frames the verb correctly: 'brew强调冲煮或萃取过程，不一定是在锅里煮沸。' — i.e. the record itself guards against the literal 'boil' reading that CG-QA's note about blending/infusing is concerned with. Collocations 'brew coffee' and 'freshly brewed coffee' are real. No defect in the actual record supports the CONDITIONAL verdict. MU maintains PASS.

### SC1341-KU-00195 — put the kettle on

- CG-QA verdict: REVISE | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MEANING_SCOPE | Next owner: CG-ENTEACH
- CG-QA issue: The example 'The water temperature is not hot enough to warm my hands' does not match the source gloss '洗手的水不够热/太凉' because 'temperature' is the likely mild pairing.
- MU reasoning: CG-QA's issue does not match this record at all. The summary quotes an example 'The water temperature is not hot enough to warm my hands' and a source gloss '洗手的水不够热/太凉', but neither string appears anywhere in this pack record or its source CSV row. The actual record is expression 'put the kettle on', sense_zh '烧水准备泡茶', example_en "I'll put the kettle on before I take a shower." with example_zh '我洗澡前先把水壶烧上。', collocations 'put the kettle on' and 'put the kettle on for tea', and usage note '英式口语常用，意为把水壶放上去烧水或启动电水壶。' The example is natural, matches the glossed sense, and the collocations are real. There is no water-temperature example in this record to revise; the summary evidently describes a different record. MU maintains PASS.

### SC1341-KU-00199 — toast

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: PART_OF_SPEECH | Next owner: CG-ENTEACH
- CG-QA issue: The source gloss '我每天早晨在镜子前花很多时间做造型' is not an accurate translation of 'I spend a lot of time at the mirror every morning.'; it is about grooming routines, not a full grooming routine in front of a mirror. The example 'I check my hair in the mirror each morning.' is an appropriate and natural depiction for the mirror routine.
- MU reasoning: CG-QA's issue does not match this record at all. The summary discusses a mirror/grooming routine — the source gloss '我每天早晨在镜子前花很多时间做造型', the English 'I spend a lot of time at the mirror every morning.', and the example 'I check my hair in the mirror each morning.' — but no mirror, grooming, or styling content appears anywhere in this pack record or its source CSV row. The actual record is expression 'toast', sense_zh '烤面包片；吐司', example_en 'I had toast with butter and jam for breakfast.' with example_zh '我早饭吃了抹黄油和果酱的烤面包片。', collocations 'a slice of toast' and 'buttered toast', and usage note 'toast作早餐食物通常为不可数名词；a slice of toast指一片。' The record is internally consistent for the glossed noun (breakfast-food) sense, and the usage note correctly handles the countability point relevant to the PART_OF_SPEECH triage. The summary evidently describes a different record. MU maintains PASS.

### SC1341-KU-00221 — take your medication

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: MASTER_GLOSS_SCOPE | Next owner: CG-MASTER
- CG-QA issue: The English 'take your medication' is natural, but the Chinese '按时吃药；服药' is not a literal translation; '吃药' is not a literal rendering of the verb.
- MU reasoning: CG-QA's issue demands a literal rendering of the verb 'take', but the record's gloss is a natural idiomatic meaning gloss, which is what the answer field is for, and the record itself justifies it: usage_note says "take medication是服药的自然说法；这里不涉及剂量建议。" The example_zh likewise uses the formal verb, "我每天早上都在同一时间服用药物。" ('服用药物', not a literal '拿药'). '吃药/服药' is the standard natural Chinese equivalent of 'take medication', and the '按时' element is supported by the record's own example, "I take my medication at the same time each morning." Nothing in the record is wrong or misleading; requiring literalness here would make the gloss less natural, not more accurate. MU maintains PASS.

### SC1341-KU-00223 — fill your water bottle

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **AGREE** | MU new verdict: **REVISE**
- Triage category: MASTER_GLOSS_IDENTITY | Next owner: CG-MASTER
- CG-QA issue: The English 'fill your water bottle' is natural, but the Chinese '装满水杯' is not its literal translation; water bottle通常指水瓶；另外，'请把水杯装满'和'fill your cup'的中文翻译是'倒满水'，因此源释义建议改为'把水瓶装满水'。
- MU reasoning: CG-QA's issue is real and visible inside the record itself, which is internally inconsistent: meaning_zh/display 'm' say "装满水杯", but the record's own example_zh says "上班出门前我会把水瓶装满。" — the example correctly uses 水瓶 while the gloss says 水杯. A water bottle is a 水瓶, not a 水杯 (cup), so the source gloss '装满水杯' misidentifies the object; the example proves the author knew the right word and the gloss did not follow it. Source V51 CSV (SC50-0001, rank 223) confirms the source sense_zh is '装满水杯', so the defect sits in the source gloss, not in MU-ENTEACH's answer text.
- Owner decision note: AGREE pending CG-MASTER's source-gloss decision: the source sense_zh '装满水杯' should be corrected to '把水瓶装满水' (water bottle = 水瓶, not 水杯), and the answer meaning_zh / display 'm' updated to match. MU changes its verdict to REVISE on this basis; the fix itself requires the owner's source-gloss decision, so no answer-text edit is prescribed unilaterally.

### SC1341-KU-00234 — turn on the alarm

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: TRANSLATION_AND_USAGE | Next owner: CG-ENTEACH
- CG-QA issue: 'Set the alarm' is the more common way to express setting an alarm; 'turn on the alarm' can be read as toggling a switch, so the specific usage of 'turn on the alarm' is imprecise.
- MU reasoning: CG-QA's concern is already handled inside the record. The usage_note explicitly draws exactly the distinction CG-QA asks for: "turn on the alarm在手机场景中可指启用已有闹钟；设定新时间更常说set an alarm。" The gloss "打开闹钟功能" matches the enable-an-existing-alarm reading, and the example "I turned on the alarm for six thirty tomorrow morning." / "我打开了明早六点半的闹钟。" is a natural phone scenario (enabling the alarm already set for 6:30), not a claim that 'turn on' is the way to create a new alarm time. The record therefore teaches the set-vs-turn-on contrast rather than committing the imprecision CG-QA alleges. MU maintains PASS.

### SC1341-KU-00239 — shower gel

- CG-QA verdict: PASS | MU original verdict: REVISE | MU position: **DISAGREE** | MU new verdict: **REVISE**
- Triage category: TERMINOLOGY_VARIATION | Next owner: CG-MASTER
- CG-QA issue: 唯一的PASS与REVISE相反项。CG-QA读取原作者包确认'沐浴啫喱'与'沐浴露'指同一类沐浴用品，语义等值；词形差异不独立构成REVISE。MU-ENTEACH结论未作修改，按原结论保留。
- MU reasoning: The terms are near-synonyms, but the record really does use two different Chinese terms for the same word, which is exactly the inconsistency MU flagged: meaning_zh/display 'm' say "沐浴啫喱" while example_zh says "我把沐浴露放在淋浴间的架子上。" A learner meeting '沐浴啫喱' as the gloss and then '沐浴露' in the example has to reconcile two labels for one item with no note explaining they are the same. MU therefore maintains REVISE as a terminology-consistency note within the record (MU's original proposed fix: change example_zh to use 沐浴啫喱), while accepting CG-QA's coordination as the disposition: the note is non-blocking and no forced revision is required.
- Disposition: non-blocking terminology note retained; CG-QA coordination accepted as disposition; no forced revision required.

### SC1341-KU-00241 — shower curtain

- CG-QA verdict: CONDITIONAL | MU original verdict: PASS | MU position: **DISAGREE** | MU new verdict: **PASS**
- Triage category: TRANSLATION_AND_USAGE | Next owner: CG-ENTEACH
- CG-QA issue: The Chinese 'before turning on the water' is vague: it does not clearly state whether it means to turn on the tap or to start showering; shower curtain 浴帘 is also not the same as 'bath curtain'.
- MU reasoning: CG-QA's issue does not hold against the record. First, the 'bath curtain' point misreads the record: the record never says 'bath curtain' anywhere; it correctly glosses "shower curtain是浴帘" in the usage_note ("shower curtain是浴帘，用来挡住淋浴时溅出的水。"). Second, the alleged vagueness of 'before turning on the water' is not a real ambiguity in this scene: in a shower context, turning on the water IS starting to shower — the tap and the shower are the same event — and the usage_note anchors the scene to 淋浴 ("用来挡住淋浴时溅出的水"), so the example "Pull the shower curtain closed before turning on the water." / "开水前先把浴帘拉好。" has exactly one sensible reading. MU maintains PASS.

## Observations for CG-QA (not verdicts)

1. **Systematic misalignment in the chunk-3 issue summaries.** For all five items 00161 / 00163 / 00193 / 00195 / 00199, the strings CG-QA's issue_summary quotes do not exist in the actual records — e.g. 00163 discusses "feel groggy" / "我头晕脑胀" / "waking up groggy and grumpy" while the record is "clear your head" / "让脑子清醒" (example: "I went outside for five minutes to clear my head."); 00199's summary describes a mirror/grooming routine while the record is "toast" / "烤面包片；吐司"; 00193's summary faults "泡茶", a string absent from the record (the record uses "煮咖啡"/"冲泡咖啡" and its usage note already guards brew semantics). This looks like a mapping error on the CG-QA side (summaries attached to the wrong records) rather than five independent content defects, and is worth checking before the remaining 50-item second review (SC50-0002 ranks 21–70) is reconciled.
2. **One CG-QA request was already satisfied by the record.** For 00080 (early start), the fix CG-QA asks for — gloss as "starting the day early" — is already in place: both the source CSV and the pack gloss read "提前开始一天", with usage note "early start常指一天或活动较早开始。"; no "waking up early" gloss exists in the record.
3. **Item 00239 (shower gel) is the only reverse-direction dispute** (CG-QA PASS vs MU REVISE). MU maintains REVISE as a non-blocking terminology-consistency note (meaning_zh "沐浴啫喱" vs example_zh "沐浴露" in the same record) and accepts CG-QA's coordination as the disposition: non-blocking, not tracked as a forced REVISE, no revision demanded.
4. **Item 00117 (bedside table) is agreed on substance by both sides** — only the severity label differed; MU's REVISE stands with its original fix.
