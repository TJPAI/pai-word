# MU-ENTEACH 独立复审：Scene1341 V51 答案型 SC50-0004 ranks 21–210 + SC50-0005 ranks 1–210

- 对象：教学分支 `answer-enrichment-main-dev-20261026` HEAD `70e0edd1`（`70e0edd1335e254f27d352cc287e6b51ac7f638e`），
  九个包：
  - `tools/answer-enrichment/scene1341-v51-sc0004-answer-only-021-070.v2.json`
    （blob `99ce945c7c72f2cbc80a93bd224fe9e01b8dbec4`，50 条，rank 21-70，提交 `885f6d51`）；
  - `tools/answer-enrichment/scene1341-v51-sc0004-answer-only-071-120.v2.json`
    （blob `d69da3f6fed79ce0a28d3e9676c358b273a9a3d8`，50 条，rank 71-120，提交 `74c10b28`）；
  - `tools/answer-enrichment/scene1341-v51-sc0004-answer-only-121-170.v2.json`
    （blob `c695fac50b8d20f9e6c1ccf24129ec565280b05a`，50 条，rank 121-170，提交 `3aafdbdd`）；
  - `tools/answer-enrichment/scene1341-v51-sc0004-answer-only-171-210.v2.json`
    （blob `67a94c4ea8cc4df164bd9af1a92f1cee818699bd`，40 条，rank 171-210，提交 `2a0b22df`）；
  - `tools/answer-enrichment/scene1341-v51-sc0005-answer-only-001-010.v2.json`
    （blob `15b4f654660bd3bf4f9a7b3b60df17794e49cfa8`，10 条，rank 1-10，提交 `57e1729d`）；
  - `tools/answer-enrichment/scene1341-v51-sc0005-answer-only-011-060.v2.json`
    （blob `41ebe4056edfa2b1851afb9e983c72525ab7be88`，50 条，rank 11-60，提交 `e2fd3d97`）；
  - `tools/answer-enrichment/scene1341-v51-sc0005-answer-only-061-110.v2.json`
    （blob `864c17ca8a6fde50961b24d58b8270652f367a1a`，50 条，rank 61-110，提交 `ba322329`）；
  - `tools/answer-enrichment/scene1341-v51-sc0005-answer-only-111-160.v2.json`
    （blob `113ef0896f8212ace1746e328cf716dd77ef6f4a`，50 条，rank 111-160，提交 `1225ee0e`）；
  - `tools/answer-enrichment/scene1341-v51-sc0005-answer-only-161-210.v2.json`
    （blob `545aa3cc5efa8a7a7366d795420ec99388d5f8ca`，50 条，rank 161-210，提交 `45b8df9c`）；
  schema 答案型 V2，`release_status: EDITORIAL_STAGING_ONLY`，`activation_allowed: false`（每条记录）。
- 来源：`cg-main-fourline-integration-20261026` 分支
  `tools/integration/scene1341-ranked/v51-ranked.csv`（blob `eaa6d729…`，2,038 行），
  场景 SC50-0004 整理房间（rank 21–210，190 条）与 SC50-0005 做家务（rank 1–210，210 条）。
- 任务来源：CG-QA 评论 6759768201（请 MU-ENTEACH/MU-QA 补审 400 条第二方缺口，KU00633–01032）。
  **注意：教学分支此后已推进至 `2df09f8d`（合并时 fetch 所见）；
  本复审只对固定版本 HEAD `70e0edd1` 的 400 条负责，不覆盖此后新增内容。**
- 复审性质：**非盲审作者身份**（CG-ENTEACH 为作者），但**盲判他线 verdict**——
  九名复核员（每包一名）只凭包文件与源 CSV 判读，未读任何 Issue 评论，未查任何他线 verdict、
  总账或对账结果（包括 CG-QA 对全部 400 条的复审与 MU-QA 的并行复审），
  各组互不见 verdict，判完才合并。仅答案页教学内容层，不审题目（本题无题目字段）。
- 方法：400 条分 9 组（每包一组：50 / 50 / 50 / 40 / 10 / 50 / 50 / 50 / 50 条），由 9 名复核员各自独立判读；
  协调员合并后核对覆盖（400 条、SC1341-KU-00633..01032 各恰一次），
  并以 scene_id + rank 逐条独立重算身份绑定（CSV 内 rank 按场景重起，须按场景限定查找；
  全局 rank 查找会撞到其他场景的同 rank 行），另独立重算 activation、meaning/display 一致性，
  并对 6 条 REVISE 逐条对包实核。
- 判读标准（与此前各批一致）：身份绑定对源 CSV 行（expression / sense_zh / scene_id /
  rank / sense_id / tier）；例句英文自然且真实体现释义义；汉译忠实自然；搭配真实且贴合该义；
  usage/contrast 注真实、在范围内、有用；meaning_zh == sense_zh；display 字段与 answer 字段一致；
  无 question / correct_choice_id 字段。REVISE 只给真实缺陷（须附具体修正方案），
  HOLD 只给身份或义确实不清者，不用 HOLD 装风格问题；轻微不完美但正确自然者判 PASS。
- 语义依据与限制：V51 CSV 未附冻结英文定义，判读依据为源 sense_zh、expression 与
  场景上下文；不凭中文像自动 PASS，每条均核对英文例句是否真实体现该义。
  本复审为 Muse 教学线独立判断，**不是双 AI 认证**：双 AI 对账须待 CG-QA verdict 后
  由 CG-QA 按版本规则确认，本复审不代记双 AI 结论。
- 范围说明（editorial_addition）：SC50-0004 rank 24（SC1341-KU-00636 put away clutter，
  tier CORE）、rank 208–209（SC1341-KU-00820 find a place for everything、00821 sort through，
  tier ADDITIONAL）与 SC50-0005 rank 31（SC1341-KU-00853 clean as you go，tier CORE）的源 CSV 行为
  editorial_addition（decision_note 为 "New scene gap candidate, requires independent validation"），
  仍待 CG-MASTER / 独立 QA 审查；本复审按同一标准对现有 CSV 行判读，四条内容均 PASS，
  但其源义身份本身未获本复审认证，待 CG-MASTER 裁决。
- 范围说明（editorial_gap_candidate，与上类不同）：SC50-0004 rank 206–207
  （SC1341-KU-00818 put things back where they belong、00819 clear the clutter，tier SUPPORTING）
  的源 CSV 行为 editorial_gap_candidate（decision_note 为 "Original candidate retained for scene
  vocabulary inventory"，即原候选保留、非新增缺口候选），同样仍待 CG-MASTER / 独立 QA 审查；
  本复审按同一标准判读，两条内容均 PASS，源义身份未获本复审认证。
- 范围说明（未覆盖）：任务简报中列出的 SC50-0005 rank 221–223（divide up the chores、
  keep up with housework、do the housework，KU 01043–01045）不在本批任何包内——九个包止于
  rank 210 / SC1341-KU-01032——故本批未审，属后续批次。

## 结论

**PASS 394 / REVISE 6 / HOLD 0。** 分包：SC50-0004 rank 21–70 PASS 50 / REVISE 0；rank 71–120 PASS 49 / REVISE 1；rank 121–170 PASS 50 / REVISE 0；rank 171–210 PASS 38 / REVISE 2；SC50-0005 rank 1–10 PASS 10 / REVISE 0；rank 11–60 PASS 48 / REVISE 2；rank 61–110 PASS 50 / REVISE 0；rank 111–160 PASS 50 / REVISE 0；rank 161–210 PASS 49 / REVISE 1。
身份绑定 400/400（协调员 scene-scoped 独立重算；各复核员亦逐条核对）；无题目字段 400/400；
display 与 answer 一致性 400/400；meaning_zh == sense_zh 400/400；
per-record activation_allowed false 400/400。
首 20 条校验器（`test-scene1341-v51-answer-only-v2.mjs`）只断言首 20 条包，
不适用于本批，故本批不报 STRUCTURE_PASS；本批的结构与身份改由上述独立重算覆盖。

| scene_ku_id | expression | 结论 | 备注 |
|---|---|---|---|
| SC1341-KU-00633 | vacuum the carpet | PASS |  |
| SC1341-KU-00634 | clean up broken glass | PASS |  |
| SC1341-KU-00635 | put away sharp tools | PASS |  |
| SC1341-KU-00636 | put away clutter | PASS | editorial_addition per source CSV (rank 24, decision_note: New scene gap candidate, requires independent validation); usage_note flags this pending status. Content itself (example, translation, collocations, note) is accurate as it stands. |
| SC1341-KU-00637 | straighten up | PASS |  |
| SC1341-KU-00638 | clear out | PASS |  |
| SC1341-KU-00639 | clear off | PASS |  |
| SC1341-KU-00640 | get rid of | PASS |  |
| SC1341-KU-00641 | keep | PASS |  |
| SC1341-KU-00642 | donate | PASS |  |
| SC1341-KU-00643 | recycle | PASS |  |
| SC1341-KU-00644 | store | PASS |  |
| SC1341-KU-00645 | arrange | PASS |  |
| SC1341-KU-00646 | rearrange | PASS |  |
| SC1341-KU-00647 | make space | PASS |  |
| SC1341-KU-00648 | free up space | PASS |  |
| SC1341-KU-00649 | stack | PASS |  |
| SC1341-KU-00650 | pile up | PASS |  |
| SC1341-KU-00651 | spread out | PASS |  |
| SC1341-KU-00652 | wipe down | PASS |  |
| SC1341-KU-00653 | sweep | PASS |  |
| SC1341-KU-00654 | mop | PASS |  |
| SC1341-KU-00655 | change the sheets | PASS |  |
| SC1341-KU-00656 | fluff up the pillows | PASS |  |
| SC1341-KU-00657 | open the windows | PASS |  |
| SC1341-KU-00658 | air out the room | PASS |  |
| SC1341-KU-00659 | freshen the room | PASS |  |
| SC1341-KU-00660 | pick up clothes | PASS |  |
| SC1341-KU-00661 | put things back | PASS |  |
| SC1341-KU-00662 | wipe up a spill | PASS |  |
| SC1341-KU-00663 | take out the trash | PASS |  |
| SC1341-KU-00664 | empty the bin | PASS |  |
| SC1341-KU-00665 | room | PASS |  |
| SC1341-KU-00666 | bedroom | PASS |  |
| SC1341-KU-00667 | living room | PASS |  |
| SC1341-KU-00668 | floor | PASS |  |
| SC1341-KU-00669 | carpet | PASS |  |
| SC1341-KU-00670 | rug | PASS |  |
| SC1341-KU-00671 | bookshelf | PASS |  |
| SC1341-KU-00672 | dresser | PASS |  |
| SC1341-KU-00673 | wardrobe | PASS |  |
| SC1341-KU-00674 | cabinet | PASS |  |
| SC1341-KU-00675 | storage bin | PASS |  |
| SC1341-KU-00676 | basket | PASS |  |
| SC1341-KU-00677 | hamper | PASS |  |
| SC1341-KU-00678 | organizer | PASS |  |
| SC1341-KU-00679 | container | PASS |  |
| SC1341-KU-00680 | label | PASS |  |
| SC1341-KU-00681 | hook | PASS |  |
| SC1341-KU-00682 | hanger | PASS |  |
| SC1341-KU-00683 | rack | PASS |  |
| SC1341-KU-00684 | desk | PASS |  |
| SC1341-KU-00685 | chair | PASS |  |
| SC1341-KU-00686 | nightstand | REVISE | Collocation "bedside nightstand" is redundant and not a standard English collocation: a nightstand already is a bedside table, so "bedside nightstand" is pleonastic (like "ATM machine"). |
| SC1341-KU-00687 | coffee table | PASS |  |
| SC1341-KU-00688 | side table | PASS |  |
| SC1341-KU-00689 | cushion | PASS |  |
| SC1341-KU-00690 | pillow | PASS |  |
| SC1341-KU-00691 | blanket | PASS |  |
| SC1341-KU-00692 | bedsheet | PASS |  |
| SC1341-KU-00693 | duvet cover | PASS |  |
| SC1341-KU-00694 | curtain | PASS |  |
| SC1341-KU-00695 | window sill | PASS |  |
| SC1341-KU-00696 | laundry basket | PASS |  |
| SC1341-KU-00697 | trash can | PASS |  |
| SC1341-KU-00698 | bin liner | PASS |  |
| SC1341-KU-00699 | broom | PASS |  |
| SC1341-KU-00700 | dustpan | PASS |  |
| SC1341-KU-00701 | mop | PASS |  |
| SC1341-KU-00702 | microfiber cloth | PASS |  |
| SC1341-KU-00703 | duster | PASS |  |
| SC1341-KU-00704 | cleaning spray | PASS |  |
| SC1341-KU-00705 | disinfectant | PASS |  |
| SC1341-KU-00706 | junk | PASS |  |
| SC1341-KU-00707 | stuff | PASS |  |
| SC1341-KU-00708 | belongings | PASS |  |
| SC1341-KU-00709 | personal items | PASS |  |
| SC1341-KU-00710 | valuables | PASS |  |
| SC1341-KU-00711 | keepsake | PASS |  |
| SC1341-KU-00712 | spare items | PASS |  |
| SC1341-KU-00713 | storage space | PASS |  |
| SC1341-KU-00714 | surface | PASS |  |
| SC1341-KU-00715 | corner | PASS |  |
| SC1341-KU-00716 | under the bed | PASS |  |
| SC1341-KU-00717 | on the shelf | PASS |  |
| SC1341-KU-00718 | in the drawer | PASS |  |
| SC1341-KU-00719 | at the back of the closet | PASS |  |
| SC1341-KU-00720 | within reach | PASS |  |
| SC1341-KU-00721 | out of reach | PASS |  |
| SC1341-KU-00722 | on display | PASS |  |
| SC1341-KU-00723 | out of sight | PASS |  |
| SC1341-KU-00724 | in its place | PASS |  |
| SC1341-KU-00725 | tidy | PASS |  |
| SC1341-KU-00726 | neat | PASS |  |
| SC1341-KU-00727 | organized | PASS |  |
| SC1341-KU-00728 | cluttered | PASS |  |
| SC1341-KU-00729 | messy | PASS |  |
| SC1341-KU-00730 | dusty | PASS |  |
| SC1341-KU-00731 | dirty | PASS |  |
| SC1341-KU-00732 | spotless | PASS |  |
| SC1341-KU-00733 | cramped | PASS |  |
| SC1341-KU-00734 | spacious | PASS |  |
| SC1341-KU-00735 | crowded | PASS | crowded applied to shelves/boxes is acceptable here and the usage note flags the people sense. |
| SC1341-KU-00736 | bare | PASS |  |
| SC1341-KU-00737 | empty | PASS |  |
| SC1341-KU-00738 | full | PASS |  |
| SC1341-KU-00739 | overstuffed | PASS |  |
| SC1341-KU-00740 | musty | PASS |  |
| SC1341-KU-00741 | stale air | PASS | Collocation 'let stale air out' is bare but acceptable as a phrase form; example is natural. |
| SC1341-KU-00742 | fresh air | PASS |  |
| SC1341-KU-00743 | dust bunny | PASS |  |
| SC1341-KU-00744 | cobweb | PASS |  |
| SC1341-KU-00745 | stain | PASS |  |
| SC1341-KU-00746 | scratch | PASS |  |
| SC1341-KU-00747 | spill | PASS |  |
| SC1341-KU-00748 | odor | PASS |  |
| SC1341-KU-00749 | smell | PASS |  |
| SC1341-KU-00750 | sort by category | PASS |  |
| SC1341-KU-00751 | sort by size | PASS |  |
| SC1341-KU-00752 | sort by color | PASS |  |
| SC1341-KU-00753 | separate clean clothes | PASS |  |
| SC1341-KU-00754 | put dirty clothes in the hamper | PASS |  |
| SC1341-KU-00755 | fold the laundry | PASS |  |
| SC1341-KU-00756 | line up shoes | PASS |  |
| SC1341-KU-00757 | put books on the shelf | PASS |  |
| SC1341-KU-00758 | stack books | PASS |  |
| SC1341-KU-00759 | file documents | PASS |  |
| SC1341-KU-00760 | shred old papers | PASS |  |
| SC1341-KU-00761 | clear the desk | PASS |  |
| SC1341-KU-00762 | wipe the desk | PASS |  |
| SC1341-KU-00763 | clean under the bed | PASS |  |
| SC1341-KU-00764 | sweep the floor | PASS |  |
| SC1341-KU-00765 | mop the floor | PASS |  |
| SC1341-KU-00766 | dust the shelves | PASS |  |
| SC1341-KU-00767 | wipe the mirror | PASS |  |
| SC1341-KU-00768 | clean the windows | PASS |  |
| SC1341-KU-00769 | wash the curtains | PASS |  |
| SC1341-KU-00770 | change the bedding | PASS |  |
| SC1341-KU-00771 | put fresh sheets on | PASS |  |
| SC1341-KU-00772 | take down decorations | PASS |  |
| SC1341-KU-00773 | rearrange furniture | PASS |  |
| SC1341-KU-00774 | move the table | PASS |  |
| SC1341-KU-00775 | push the sofa back | PASS |  |
| SC1341-KU-00776 | make room for a desk | PASS |  |
| SC1341-KU-00777 | open up the space | PASS |  |
| SC1341-KU-00778 | label the boxes | PASS |  |
| SC1341-KU-00779 | put seasonal clothes away | PASS |  |
| SC1341-KU-00780 | pack things into bins | PASS | Usage note correctly disambiguates bin as storage bin, not trash can. |
| SC1341-KU-00781 | dispose of broken items | PASS |  |
| SC1341-KU-00782 | set aside donations | PASS |  |
| SC1341-KU-00783 | keep essentials handy | PASS |  |
| SC1341-KU-00784 | empty the wastebasket | PASS |  |
| SC1341-KU-00785 | replace the trash bag | PASS |  |
| SC1341-KU-00786 | spray air freshener | PASS |  |
| SC1341-KU-00787 | spilled drink | PASS |  |
| SC1341-KU-00788 | broken glass | PASS |  |
| SC1341-KU-00789 | sharp object | PASS |  |
| SC1341-KU-00790 | slippery floor | PASS |  |
| SC1341-KU-00791 | trip hazard | PASS |  |
| SC1341-KU-00792 | loose cable | PASS |  |
| SC1341-KU-00793 | extension cord | PASS |  |
| SC1341-KU-00794 | tangled cables | PASS |  |
| SC1341-KU-00795 | cable organizer | REVISE | Terminology mismatch across fields: sense_zh/meaning_zh gloss is 理线夹, but example_zh says 我用了一个理线器把电线整理在一起, while the usage note says cable organizer is generic and not necessarily a clip. |
| SC1341-KU-00796 | lost item | REVISE | example_zh is awkward/self-contradictory: 我在沙发底下找到了那件找不到的东西 (found the thing that could not be found). |
| SC1341-KU-00797 | misplaced | PASS |  |
| SC1341-KU-00798 | overflowing bin | PASS |  |
| SC1341-KU-00799 | mold | PASS |  |
| SC1341-KU-00800 | mildew | PASS |  |
| SC1341-KU-00801 | damp | PASS |  |
| SC1341-KU-00802 | leak | PASS |  |
| SC1341-KU-00803 | fragile | PASS |  |
| SC1341-KU-00804 | breakable | PASS |  |
| SC1341-KU-00805 | handle with care | PASS |  |
| SC1341-KU-00806 | keep away from children | PASS |  |
| SC1341-KU-00807 | use a step stool | PASS |  |
| SC1341-KU-00808 | secure heavy furniture | PASS |  |
| SC1341-KU-00809 | wipe up immediately | PASS |  |
| SC1341-KU-00810 | find a missing item | PASS |  |
| SC1341-KU-00811 | set aside important papers | PASS |  |
| SC1341-KU-00812 | keep cleaning products separate | PASS |  |
| SC1341-KU-00813 | remove tripping hazards | PASS |  |
| SC1341-KU-00814 | store fragile items safely | PASS |  |
| SC1341-KU-00815 | air out a damp room | PASS |  |
| SC1341-KU-00816 | deal with a bad smell | PASS |  |
| SC1341-KU-00817 | take a break from cleaning | PASS |  |
| SC1341-KU-00818 | put things back where they belong | PASS | Editorial row: source=editorial_gap_candidate in V51 CSV (decision_note: Original candidate retained for scene vocabulary inventory); content itself is correct and natural, pending CG-MASTER/independent QA validation. |
| SC1341-KU-00819 | clear the clutter | PASS | Editorial row: source=editorial_gap_candidate in V51 CSV (decision_note: Original candidate retained for scene vocabulary inventory); content itself is correct and natural, pending CG-MASTER/independent QA validation. |
| SC1341-KU-00820 | find a place for everything | PASS | Editorial row: source=editorial_addition, tier ADDITIONAL in V51 CSV (decision_note: New scene gap candidate, requires independent validation); content itself is correct and natural, pending CG-MASTER/independent QA validation. |
| SC1341-KU-00821 | sort through | PASS | Editorial row: source=editorial_addition, tier ADDITIONAL in V51 CSV (decision_note: New scene gap candidate, requires independent validation); content itself is correct and natural, pending CG-MASTER/independent QA validation. |
| SC1341-KU-00822 | pest | PASS |  |
| SC1341-KU-00823 | housework | PASS | Identity matches CSV rank 1 exactly; example natural and on-sense; usage note on uncountable housework vs countable chore is accurate. |
| SC1341-KU-00824 | chore | PASS | Identity matches CSV rank 2 exactly; example and translation faithful; collocations real. |
| SC1341-KU-00825 | chore chart | PASS | Identity matches CSV rank 3 exactly; example illustrates the sense; usage note on chart as a table is accurate. |
| SC1341-KU-00826 | clean up | PASS | Identity matches CSV rank 4 exactly; example, translation and collocations all sound. |
| SC1341-KU-00827 | scrub | PASS | Identity matches CSV rank 5 exactly; example illustrates forceful scrubbing; scrub vs wipe contrast is accurate. |
| SC1341-KU-00828 | sweep | PASS | Identity matches CSV rank 6 exactly; sweep vs vacuum contrast is accurate; collocations real. |
| SC1341-KU-00829 | mop | PASS | Identity matches CSV rank 7 exactly (verb sense 拖地); example and translation faithful; verb/noun note accurate. |
| SC1341-KU-00830 | vacuum | PASS | Identity matches CSV rank 8 exactly; example natural and on-sense; collocations real. |
| SC1341-KU-00831 | dust | PASS | Identity matches CSV rank 9 exactly (verb sense 清除灰尘); verb/noun note accurate; example faithful. |
| SC1341-KU-00832 | clean the litter box | PASS | Identity matches CSV rank 10 exactly; example natural; 'scoop the litter box' is a real collocation; litter-as-rubbish note is true. |
| SC1341-KU-00833 | mop | PASS |  |
| SC1341-KU-00834 | vacuum cleaner | PASS |  |
| SC1341-KU-00835 | scrub brush | PASS |  |
| SC1341-KU-00836 | detergent | PASS |  |
| SC1341-KU-00837 | laundry detergent | PASS |  |
| SC1341-KU-00838 | trash bag | PASS |  |
| SC1341-KU-00839 | laundry basket | PASS |  |
| SC1341-KU-00840 | cleaning supplies | PASS |  |
| SC1341-KU-00841 | chore rotation | PASS |  |
| SC1341-KU-00842 | sweep the kitchen floor | PASS |  |
| SC1341-KU-00843 | vacuum the living room | PASS |  |
| SC1341-KU-00844 | clean the stovetop | PASS |  |
| SC1341-KU-00845 | clean the microwave | PASS |  |
| SC1341-KU-00846 | scrub the sink | REVISE | example_zh “我用软刷把水槽刷干净。” renders 'the sink' as 水槽 (kitchen sink), while sense_zh / meaning_zh is 刷洗洗手池 (bathroom wash-basin); the example translation is inconsistent with the gloss given in the same record. |
| SC1341-KU-00847 | clean the toilet | PASS |  |
| SC1341-KU-00848 | scrub the bathtub | REVISE | example_en “I scrub the bathtub after soaking it with water.” is not natural: 'soak' takes the thing immersed as its object, but the bathtub is the container, not the thing soaked in water. |
| SC1341-KU-00849 | clean the shower tiles | PASS |  |
| SC1341-KU-00850 | take out the garbage | PASS |  |
| SC1341-KU-00851 | clean the vents | PASS |  |
| SC1341-KU-00852 | clean the vacuum filter | PASS |  |
| SC1341-KU-00853 | clean as you go | PASS | Editorial row: V51 CSV source is editorial_addition (decision_note: 'New scene gap candidate, requires independent validation'); usage_note already flags it as pending independent review. Content judged PASS as it stands; activation still requires CG-MASTER / independent QA validation. |
| SC1341-KU-00854 | household chores | PASS |  |
| SC1341-KU-00855 | cleaning | PASS |  |
| SC1341-KU-00856 | tidying | PASS |  |
| SC1341-KU-00857 | deep cleaning | PASS |  |
| SC1341-KU-00858 | spring cleaning | PASS |  |
| SC1341-KU-00859 | maintenance | PASS |  |
| SC1341-KU-00860 | household upkeep | PASS |  |
| SC1341-KU-00861 | do the chores | PASS |  |
| SC1341-KU-00862 | share the chores | PASS |  |
| SC1341-KU-00863 | split the chores | PASS |  |
| SC1341-KU-00864 | assign chores | PASS |  |
| SC1341-KU-00865 | cleaning schedule | PASS |  |
| SC1341-KU-00866 | daily chores | PASS |  |
| SC1341-KU-00867 | weekly chores | PASS |  |
| SC1341-KU-00868 | to-do list | PASS |  |
| SC1341-KU-00869 | tidy up | PASS |  |
| SC1341-KU-00870 | wipe down | PASS |  |
| SC1341-KU-00871 | polish | PASS |  |
| SC1341-KU-00872 | sanitize | PASS |  |
| SC1341-KU-00873 | disinfect | PASS |  |
| SC1341-KU-00874 | rinse | PASS |  |
| SC1341-KU-00875 | soak | PASS |  |
| SC1341-KU-00876 | hang out laundry | PASS |  |
| SC1341-KU-00877 | fold laundry | PASS |  |
| SC1341-KU-00878 | iron | PASS |  |
| SC1341-KU-00879 | take out the trash | PASS |  |
| SC1341-KU-00880 | wash the dishes | PASS |  |
| SC1341-KU-00881 | load the dishwasher | PASS |  |
| SC1341-KU-00882 | empty the dishwasher | PASS |  |
| SC1341-KU-00883 | make the bed | PASS |  |
| SC1341-KU-00884 | change the sheets | PASS |  |
| SC1341-KU-00885 | water the plants | PASS |  |
| SC1341-KU-00886 | feed the pets | PASS |  |
| SC1341-KU-00887 | run errands | PASS |  |
| SC1341-KU-00888 | broom | PASS |  |
| SC1341-KU-00889 | dustpan | PASS |  |
| SC1341-KU-00890 | bucket | PASS |  |
| SC1341-KU-00891 | robot vacuum | PASS |  |
| SC1341-KU-00892 | microfiber cloth | PASS |  |
| SC1341-KU-00893 | sponge | PASS |  |
| SC1341-KU-00894 | duster | PASS |  |
| SC1341-KU-00895 | paper towel | PASS |  |
| SC1341-KU-00896 | cleaning rag | PASS |  |
| SC1341-KU-00897 | rubber gloves | PASS |  |
| SC1341-KU-00898 | apron | PASS |  |
| SC1341-KU-00899 | all-purpose cleaner | PASS |  |
| SC1341-KU-00900 | glass cleaner | PASS |  |
| SC1341-KU-00901 | floor cleaner | PASS |  |
| SC1341-KU-00902 | dish soap | PASS |  |
| SC1341-KU-00903 | fabric softener | PASS |  |
| SC1341-KU-00904 | stain remover | PASS |  |
| SC1341-KU-00905 | bleach | PASS |  |
| SC1341-KU-00906 | disinfectant | PASS |  |
| SC1341-KU-00907 | baking soda | PASS |  |
| SC1341-KU-00908 | vinegar | PASS |  |
| SC1341-KU-00909 | garbage can | PASS |  |
| SC1341-KU-00910 | recycling bin | PASS |  |
| SC1341-KU-00911 | compost bin | PASS |  |
| SC1341-KU-00912 | dishwasher | PASS |  |
| SC1341-KU-00913 | washing machine | PASS |  |
| SC1341-KU-00914 | dryer | PASS |  |
| SC1341-KU-00915 | clothesline | PASS |  |
| SC1341-KU-00916 | drying rack | PASS |  |
| SC1341-KU-00917 | iron | PASS |  |
| SC1341-KU-00918 | ironing board | PASS |  |
| SC1341-KU-00919 | lint roller | PASS |  |
| SC1341-KU-00920 | plunger | PASS |  |
| SC1341-KU-00921 | drain cleaner | PASS |  |
| SC1341-KU-00922 | cleaning caddy | PASS |  |
| SC1341-KU-00923 | storage cupboard | PASS |  |
| SC1341-KU-00924 | dirty | PASS |  |
| SC1341-KU-00925 | dusty | PASS |  |
| SC1341-KU-00926 | greasy | PASS |  |
| SC1341-KU-00927 | sticky | PASS |  |
| SC1341-KU-00928 | stained | PASS |  |
| SC1341-KU-00929 | smudged | PASS |  |
| SC1341-KU-00930 | grimy | PASS |  |
| SC1341-KU-00931 | clogged | PASS |  |
| SC1341-KU-00932 | moldy | PASS |  |
| SC1341-KU-00933 | damp | PASS |  |
| SC1341-KU-00934 | musty | PASS |  |
| SC1341-KU-00935 | wet | PASS |  |
| SC1341-KU-00936 | dry | PASS |  |
| SC1341-KU-00937 | spotless | PASS |  |
| SC1341-KU-00938 | shiny | PASS |  |
| SC1341-KU-00939 | squeaky clean | PASS |  |
| SC1341-KU-00940 | fresh-smelling | PASS |  |
| SC1341-KU-00941 | messy | PASS |  |
| SC1341-KU-00942 | tidy | PASS |  |
| SC1341-KU-00943 | organized | PASS |  |
| SC1341-KU-00944 | overdue | PASS | usage note correctly scopes overdue to task-due, not person-late. |
| SC1341-KU-00945 | time-consuming | PASS |  |
| SC1341-KU-00946 | repetitive | PASS |  |
| SC1341-KU-00947 | boring | PASS |  |
| SC1341-KU-00948 | manageable | PASS |  |
| SC1341-KU-00949 | exhausting | PASS |  |
| SC1341-KU-00950 | fair share | PASS |  |
| SC1341-KU-00951 | workload | PASS |  |
| SC1341-KU-00952 | elbow grease | PASS |  |
| SC1341-KU-00953 | stubborn stain | PASS |  |
| SC1341-KU-00954 | soap scum | PASS |  |
| SC1341-KU-00955 | limescale | PASS |  |
| SC1341-KU-00956 | grease buildup | PASS |  |
| SC1341-KU-00957 | pet hair | PASS |  |
| SC1341-KU-00958 | crumbs | PASS |  |
| SC1341-KU-00959 | lint | PASS |  |
| SC1341-KU-00960 | dust mites | PASS |  |
| SC1341-KU-00961 | spilled liquid | PASS |  |
| SC1341-KU-00962 | food scraps | PASS |  |
| SC1341-KU-00963 | household waste | PASS |  |
| SC1341-KU-00964 | recyclables | PASS |  |
| SC1341-KU-00965 | compost | PASS |  |
| SC1341-KU-00966 | mop the hallway | PASS |  |
| SC1341-KU-00967 | dust the furniture | PASS |  |
| SC1341-KU-00968 | wipe the countertops | PASS |  |
| SC1341-KU-00969 | degrease the oven | PASS |  |
| SC1341-KU-00970 | wipe the fridge shelves | PASS |  |
| SC1341-KU-00971 | defrost the freezer | PASS | example uses passive 'needs to be defrosted' but still illustrates the expression's sense. |
| SC1341-KU-00972 | polish the faucet | PASS |  |
| SC1341-KU-00973 | wipe the bathroom mirror | PASS |  |
| SC1341-KU-00974 | wash the windows | PASS |  |
| SC1341-KU-00975 | dust the blinds | PASS |  |
| SC1341-KU-00976 | change the bedding | PASS |  |
| SC1341-KU-00977 | wash the sheets | PASS |  |
| SC1341-KU-00978 | strip the bed | PASS | usage note usefully blocks the dismantle-the-bed misreading. |
| SC1341-KU-00979 | sort the laundry | PASS |  |
| SC1341-KU-00980 | separate whites and colors | PASS |  |
| SC1341-KU-00981 | start a wash cycle | PASS |  |
| SC1341-KU-00982 | transfer laundry to the dryer | PASS |  |
| SC1341-KU-00983 | hang clothes to dry | PASS |  |
| SC1341-KU-00984 | fold clean clothes | PASS |  |
| SC1341-KU-00985 | put away laundry | PASS |  |
| SC1341-KU-00986 | iron shirts | PASS |  |
| SC1341-KU-00987 | replace the bin liner | PASS |  |
| SC1341-KU-00988 | sort the recycling | PASS |  |
| SC1341-KU-00989 | put out the bins | PASS |  |
| SC1341-KU-00990 | bring the bins back in | PASS |  |
| SC1341-KU-00991 | wash the dishes by hand | PASS |  |
| SC1341-KU-00992 | rinse the dishes | PASS |  |
| SC1341-KU-00993 | dry the dishes | PASS |  |
| SC1341-KU-00994 | put dishes away | PASS |  |
| SC1341-KU-00995 | change the air filter | PASS |  |
| SC1341-KU-00996 | replace a light bulb | PASS |  |
| SC1341-KU-00997 | wash the doormat | PASS |  |
| SC1341-KU-00998 | shake out the rug | PASS |  |
| SC1341-KU-00999 | water the houseplants | PASS |  |
| SC1341-KU-01000 | wipe up a spill | PASS |  |
| SC1341-KU-01001 | spot-clean the carpet | PASS |  |
| SC1341-KU-01002 | check for leaks | PASS |  |
| SC1341-KU-01003 | stubborn grease | PASS |  |
| SC1341-KU-01004 | blocked drain | PASS |  |
| SC1341-KU-01005 | overflowing sink | PASS |  |
| SC1341-KU-01006 | broken vacuum | PASS |  |
| SC1341-KU-01007 | full dust bag | PASS |  |
| SC1341-KU-01008 | clogged filter | PASS |  |
| SC1341-KU-01009 | leaking washing machine | PASS |  |
| SC1341-KU-01010 | shrunk clothes | PASS |  |
| SC1341-KU-01011 | color bleeding | PASS |  |
| SC1341-KU-01012 | delicate fabric | PASS |  |
| SC1341-KU-01013 | damaged surface | PASS |  |
| SC1341-KU-01014 | scratched floor | PASS |  |
| SC1341-KU-01015 | slippery tiles | PASS |  |
| SC1341-KU-01016 | cleaning fumes | REVISE | usage_note Chinese is garbled: '出现不适应停止接触' omits the conditional/modal, so the clause does not read as grammatical Chinese (cf. the otherwise correct note 'cleaning fumes指挥发性气体或刺激性气味'). |
| SC1341-KU-01017 | chemical residue | PASS |  |
| SC1341-KU-01018 | skin irritation | PASS |  |
| SC1341-KU-01019 | allergic reaction | PASS |  |
| SC1341-KU-01020 | protective gloves | PASS |  |
| SC1341-KU-01021 | ventilation | PASS |  |
| SC1341-KU-01022 | pet-safe cleaner | PASS |  |
| SC1341-KU-01023 | check the care label | PASS |  |
| SC1341-KU-01024 | test on a small area | PASS |  |
| SC1341-KU-01025 | dilute the cleaner | PASS |  |
| SC1341-KU-01026 | follow the instructions | PASS |  |
| SC1341-KU-01027 | don't mix cleaning products | PASS |  |
| SC1341-KU-01028 | rinse off residue | PASS |  |
| SC1341-KU-01029 | unclog a drain | PASS |  |
| SC1341-KU-01030 | empty the dust container | PASS |  |
| SC1341-KU-01031 | replace a mop head | PASS |  |
| SC1341-KU-01032 | deal with a spill | PASS |  |

## REVISE / HOLD 明细

- **SC1341-KU-00686 nightstand（SC50-0004 rank 74）——REVISE。**
  释义：床头柜。例句英文：`I keep my glasses on the nightstand.`
  例句汉译：`我把眼镜放在床头柜上。`。搭配：`['bedside nightstand', 'nightstand drawer']`。
  用法注：`nightstand是美式常用的床头柜说法，英式也可说bedside table。`
  ——Collocation "bedside nightstand" is redundant and not a standard English collocation: a nightstand already is a bedside table, so "bedside nightstand" is pleonastic (like "ATM machine").
  拟议修正：Replace the collocation "bedside nightstand" with "bedside table" (display c becomes "bedside table · nightstand drawer").，display 相应字段同步改。

- **SC1341-KU-00795 cable organizer（SC50-0004 rank 183）——REVISE。**
  释义：理线夹。例句英文：`I used a cable organizer to keep the cords together.`
  例句汉译：`我用了一个理线器把电线整理在一起。`。搭配：`['cable organizer', 'desk cable organizer']`。
  用法注：`cable organizer是泛指理线用品，不一定仅为夹子。`
  ——Terminology mismatch across fields: sense_zh/meaning_zh gloss is 理线夹, but example_zh says 我用了一个理线器把电线整理在一起, while the usage note says cable organizer is generic and not necessarily a clip.
  拟议修正：Change example_zh to 我用了一个理线夹把电线整理在一起。 so the example uses the same term as the gloss; keep the usage note explaining the English term is broader.，display 相应字段同步改。

- **SC1341-KU-00796 lost item（SC50-0004 rank 184）——REVISE。**
  释义：找不到的物品。例句英文：`I found the lost item under the sofa.`
  例句汉译：`我在沙发底下找到了那件找不到的东西。`。搭配：`['lost item', 'look for a lost item']`。
  用法注：`lost item可指遗失或一时找不到的物件，不一定永久丢失。`
  ——example_zh is awkward/self-contradictory: 我在沙发底下找到了那件找不到的东西 (found the thing that could not be found).
  拟议修正：Change example_zh to 我在沙发底下找到了那件丢失的东西。，display 相应字段同步改。

- **SC1341-KU-00846 scrub the sink（SC50-0005 rank 24）——REVISE。**
  释义：刷洗洗手池。例句英文：`I scrub the sink with a soft brush.`
  例句汉译：`我用软刷把水槽刷干净。`。搭配：`['scrub the sink', 'scrub a stained sink']`。
  用法注：`scrub比wipe更强调擦洗用力；根据表面材料选合适工具。`
  ——example_zh “我用软刷把水槽刷干净。” renders 'the sink' as 水槽 (kitchen sink), while sense_zh / meaning_zh is 刷洗洗手池 (bathroom wash-basin); the example translation is inconsistent with the gloss given in the same record.
  拟议修正：Change example_zh (and display.example_zh in sync) to “我用软刷把洗手池刷干净。” so the example matches sense_zh 刷洗洗手池.，display 相应字段同步改。

- **SC1341-KU-00848 scrub the bathtub（SC50-0005 rank 26）——REVISE。**
  释义：刷浴缸。例句英文：`I scrub the bathtub after soaking it with water.`
  例句汉译：`把浴缸浸湿后，我会刷洗浴缸。`。搭配：`['scrub the bathtub', 'scrub the bathtub surface']`。
  用法注：`scrub the bathtub强调刷洗浴缸，不等于冲淋或简单擦干。`
  ——example_en “I scrub the bathtub after soaking it with water.” is not natural: 'soak' takes the thing immersed as its object, but the bathtub is the container, not the thing soaked in water.
  拟议修正：Replace the example pair with example_en “I scrub the bathtub after letting it soak.” and example_zh “让浴缸浸泡一会儿后，我会刷洗浴缸。” (sync display.e / display.example_zh).，display 相应字段同步改。

- **SC1341-KU-01016 cleaning fumes（SC50-0005 rank 194）——REVISE。**
  释义：清洁剂挥发气体。例句英文：`Open the windows if cleaning fumes build up, and leave the area if needed.`
  例句汉译：`如果清洁剂气体积聚，就开窗通风，必要时离开现场。`。搭配：`['cleaning fumes', 'breathe in cleaning fumes']`。
  用法注：`cleaning fumes指挥发性气体或刺激性气味；出现不适应停止接触。`
  ——usage_note Chinese is garbled: '出现不适应停止接触' omits the conditional/modal, so the clause does not read as grammatical Chinese (cf. the otherwise correct note 'cleaning fumes指挥发性气体或刺激性气味').
  拟议修正：Change the usage_note tail from '出现不适应停止接触。' to '出现不适时应停止接触并通风。'，display 相应字段同步改。

  无 HOLD 条目。

## 非阻断观察（不构成 verdict，均已按不拔高规则判 PASS）

- SC1341-KU-00636 put away clutter（rank 24，editorial_addition）：内容均 PASS，且其用法注已标明
  源 Master 新增候选、待独立接受的状态；源义身份待 CG-MASTER 裁决，见上文范围说明。
- SC1341-KU-00735 crowded：用于架子/箱子拥挤是成立用法，用法注已提示指人的本义。
- SC1341-KU-00741 let stale air out：短语形式较裸，但例句自然，可接受。
- SC1341-KU-00780 bin：用法注正确区分 storage bin（储物箱）与 trash can（垃圾桶）。
- SC1341-KU-00818 / 00819（rank 206–207，editorial_gap_candidate）与 00820 / 00821 / 00853
  （editorial_addition）：六条内容均 PASS，源义身份待 CG-MASTER 裁决，见上文范围说明。
- SC1341-KU-00886 feed：用法注中文略拗口但可懂、事实正确。
- SC1341-KU-00892 microfiber cloth、00893 sponge、00897 rubber gloves：用法注偏通用但真实、在范围内。
- SC1341-KU-00944 overdue：用法注正确限定为任务到期、非指人迟到。
- SC1341-KU-00971 defrost：例句用被动语态仍真实体现该义。
- SC1341-KU-00978 dismantle：用法注有用地排除了拆床的误读。
- SC1341-KU-01009 leaking washing machine、01013 damaged surface：措辞略松但语法正确、语境忠实。

## 批准列表（PASS，394 条，供 CG-MAIN SRS 门禁）

以下 394 个 scene_ku_id 为本批 PASS 结论，与裁决表逐条一致
（SC1341-KU-00633..01032 除 REVISE 的 00686、00795、00796、00846、00848、01016）：

SC1341-KU-00633, SC1341-KU-00634, SC1341-KU-00635, SC1341-KU-00636, SC1341-KU-00637, SC1341-KU-00638, SC1341-KU-00639, SC1341-KU-00640, SC1341-KU-00641, SC1341-KU-00642, SC1341-KU-00643, SC1341-KU-00644, SC1341-KU-00645, SC1341-KU-00646, SC1341-KU-00647, SC1341-KU-00648, SC1341-KU-00649, SC1341-KU-00650, SC1341-KU-00651, SC1341-KU-00652, SC1341-KU-00653, SC1341-KU-00654, SC1341-KU-00655, SC1341-KU-00656, SC1341-KU-00657, SC1341-KU-00658, SC1341-KU-00659, SC1341-KU-00660, SC1341-KU-00661, SC1341-KU-00662, SC1341-KU-00663, SC1341-KU-00664, SC1341-KU-00665, SC1341-KU-00666, SC1341-KU-00667, SC1341-KU-00668, SC1341-KU-00669, SC1341-KU-00670, SC1341-KU-00671, SC1341-KU-00672, SC1341-KU-00673, SC1341-KU-00674, SC1341-KU-00675, SC1341-KU-00676, SC1341-KU-00677, SC1341-KU-00678, SC1341-KU-00679, SC1341-KU-00680, SC1341-KU-00681, SC1341-KU-00682, SC1341-KU-00683, SC1341-KU-00684, SC1341-KU-00685, SC1341-KU-00687, SC1341-KU-00688, SC1341-KU-00689, SC1341-KU-00690, SC1341-KU-00691, SC1341-KU-00692, SC1341-KU-00693, SC1341-KU-00694, SC1341-KU-00695, SC1341-KU-00696, SC1341-KU-00697, SC1341-KU-00698, SC1341-KU-00699, SC1341-KU-00700, SC1341-KU-00701, SC1341-KU-00702, SC1341-KU-00703, SC1341-KU-00704, SC1341-KU-00705, SC1341-KU-00706, SC1341-KU-00707, SC1341-KU-00708, SC1341-KU-00709, SC1341-KU-00710, SC1341-KU-00711, SC1341-KU-00712, SC1341-KU-00713, SC1341-KU-00714, SC1341-KU-00715, SC1341-KU-00716, SC1341-KU-00717, SC1341-KU-00718, SC1341-KU-00719, SC1341-KU-00720, SC1341-KU-00721, SC1341-KU-00722, SC1341-KU-00723, SC1341-KU-00724, SC1341-KU-00725, SC1341-KU-00726, SC1341-KU-00727, SC1341-KU-00728, SC1341-KU-00729, SC1341-KU-00730, SC1341-KU-00731, SC1341-KU-00732, SC1341-KU-00733, SC1341-KU-00734, SC1341-KU-00735, SC1341-KU-00736, SC1341-KU-00737, SC1341-KU-00738, SC1341-KU-00739, SC1341-KU-00740, SC1341-KU-00741, SC1341-KU-00742, SC1341-KU-00743, SC1341-KU-00744, SC1341-KU-00745, SC1341-KU-00746, SC1341-KU-00747, SC1341-KU-00748, SC1341-KU-00749, SC1341-KU-00750, SC1341-KU-00751, SC1341-KU-00752, SC1341-KU-00753, SC1341-KU-00754, SC1341-KU-00755, SC1341-KU-00756, SC1341-KU-00757, SC1341-KU-00758, SC1341-KU-00759, SC1341-KU-00760, SC1341-KU-00761, SC1341-KU-00762, SC1341-KU-00763, SC1341-KU-00764, SC1341-KU-00765, SC1341-KU-00766, SC1341-KU-00767, SC1341-KU-00768, SC1341-KU-00769, SC1341-KU-00770, SC1341-KU-00771, SC1341-KU-00772, SC1341-KU-00773, SC1341-KU-00774, SC1341-KU-00775, SC1341-KU-00776, SC1341-KU-00777, SC1341-KU-00778, SC1341-KU-00779, SC1341-KU-00780, SC1341-KU-00781, SC1341-KU-00782, SC1341-KU-00783, SC1341-KU-00784, SC1341-KU-00785, SC1341-KU-00786, SC1341-KU-00787, SC1341-KU-00788, SC1341-KU-00789, SC1341-KU-00790, SC1341-KU-00791, SC1341-KU-00792, SC1341-KU-00793, SC1341-KU-00794, SC1341-KU-00797, SC1341-KU-00798, SC1341-KU-00799, SC1341-KU-00800, SC1341-KU-00801, SC1341-KU-00802, SC1341-KU-00803, SC1341-KU-00804, SC1341-KU-00805, SC1341-KU-00806, SC1341-KU-00807, SC1341-KU-00808, SC1341-KU-00809, SC1341-KU-00810, SC1341-KU-00811, SC1341-KU-00812, SC1341-KU-00813, SC1341-KU-00814, SC1341-KU-00815, SC1341-KU-00816, SC1341-KU-00817, SC1341-KU-00818, SC1341-KU-00819, SC1341-KU-00820, SC1341-KU-00821, SC1341-KU-00822, SC1341-KU-00823, SC1341-KU-00824, SC1341-KU-00825, SC1341-KU-00826, SC1341-KU-00827, SC1341-KU-00828, SC1341-KU-00829, SC1341-KU-00830, SC1341-KU-00831, SC1341-KU-00832, SC1341-KU-00833, SC1341-KU-00834, SC1341-KU-00835, SC1341-KU-00836, SC1341-KU-00837, SC1341-KU-00838, SC1341-KU-00839, SC1341-KU-00840, SC1341-KU-00841, SC1341-KU-00842, SC1341-KU-00843, SC1341-KU-00844, SC1341-KU-00845, SC1341-KU-00847, SC1341-KU-00849, SC1341-KU-00850, SC1341-KU-00851, SC1341-KU-00852, SC1341-KU-00853, SC1341-KU-00854, SC1341-KU-00855, SC1341-KU-00856, SC1341-KU-00857, SC1341-KU-00858, SC1341-KU-00859, SC1341-KU-00860, SC1341-KU-00861, SC1341-KU-00862, SC1341-KU-00863, SC1341-KU-00864, SC1341-KU-00865, SC1341-KU-00866, SC1341-KU-00867, SC1341-KU-00868, SC1341-KU-00869, SC1341-KU-00870, SC1341-KU-00871, SC1341-KU-00872, SC1341-KU-00873, SC1341-KU-00874, SC1341-KU-00875, SC1341-KU-00876, SC1341-KU-00877, SC1341-KU-00878, SC1341-KU-00879, SC1341-KU-00880, SC1341-KU-00881, SC1341-KU-00882, SC1341-KU-00883, SC1341-KU-00884, SC1341-KU-00885, SC1341-KU-00886, SC1341-KU-00887, SC1341-KU-00888, SC1341-KU-00889, SC1341-KU-00890, SC1341-KU-00891, SC1341-KU-00892, SC1341-KU-00893, SC1341-KU-00894, SC1341-KU-00895, SC1341-KU-00896, SC1341-KU-00897, SC1341-KU-00898, SC1341-KU-00899, SC1341-KU-00900, SC1341-KU-00901, SC1341-KU-00902, SC1341-KU-00903, SC1341-KU-00904, SC1341-KU-00905, SC1341-KU-00906, SC1341-KU-00907, SC1341-KU-00908, SC1341-KU-00909, SC1341-KU-00910, SC1341-KU-00911, SC1341-KU-00912, SC1341-KU-00913, SC1341-KU-00914, SC1341-KU-00915, SC1341-KU-00916, SC1341-KU-00917, SC1341-KU-00918, SC1341-KU-00919, SC1341-KU-00920, SC1341-KU-00921, SC1341-KU-00922, SC1341-KU-00923, SC1341-KU-00924, SC1341-KU-00925, SC1341-KU-00926, SC1341-KU-00927, SC1341-KU-00928, SC1341-KU-00929, SC1341-KU-00930, SC1341-KU-00931, SC1341-KU-00932, SC1341-KU-00933, SC1341-KU-00934, SC1341-KU-00935, SC1341-KU-00936, SC1341-KU-00937, SC1341-KU-00938, SC1341-KU-00939, SC1341-KU-00940, SC1341-KU-00941, SC1341-KU-00942, SC1341-KU-00943, SC1341-KU-00944, SC1341-KU-00945, SC1341-KU-00946, SC1341-KU-00947, SC1341-KU-00948, SC1341-KU-00949, SC1341-KU-00950, SC1341-KU-00951, SC1341-KU-00952, SC1341-KU-00953, SC1341-KU-00954, SC1341-KU-00955, SC1341-KU-00956, SC1341-KU-00957, SC1341-KU-00958, SC1341-KU-00959, SC1341-KU-00960, SC1341-KU-00961, SC1341-KU-00962, SC1341-KU-00963, SC1341-KU-00964, SC1341-KU-00965, SC1341-KU-00966, SC1341-KU-00967, SC1341-KU-00968, SC1341-KU-00969, SC1341-KU-00970, SC1341-KU-00971, SC1341-KU-00972, SC1341-KU-00973, SC1341-KU-00974, SC1341-KU-00975, SC1341-KU-00976, SC1341-KU-00977, SC1341-KU-00978, SC1341-KU-00979, SC1341-KU-00980, SC1341-KU-00981, SC1341-KU-00982, SC1341-KU-00983, SC1341-KU-00984, SC1341-KU-00985, SC1341-KU-00986, SC1341-KU-00987, SC1341-KU-00988, SC1341-KU-00989, SC1341-KU-00990, SC1341-KU-00991, SC1341-KU-00992, SC1341-KU-00993, SC1341-KU-00994, SC1341-KU-00995, SC1341-KU-00996, SC1341-KU-00997, SC1341-KU-00998, SC1341-KU-00999, SC1341-KU-01000, SC1341-KU-01001, SC1341-KU-01002, SC1341-KU-01003, SC1341-KU-01004, SC1341-KU-01005, SC1341-KU-01006, SC1341-KU-01007, SC1341-KU-01008, SC1341-KU-01009, SC1341-KU-01010, SC1341-KU-01011, SC1341-KU-01012, SC1341-KU-01013, SC1341-KU-01014, SC1341-KU-01015, SC1341-KU-01017, SC1341-KU-01018, SC1341-KU-01019, SC1341-KU-01020, SC1341-KU-01021, SC1341-KU-01022, SC1341-KU-01023, SC1341-KU-01024, SC1341-KU-01025, SC1341-KU-01026, SC1341-KU-01027, SC1341-KU-01028, SC1341-KU-01029, SC1341-KU-01030, SC1341-KU-01031, SC1341-KU-01032

## 未决与不宣称

- CG-ENTEACH 尚未交付对先前各批 REVISE（00006 snooze、00117 bedside table、
  00239 shower gel、00269 get clean、00347 replace the toothbrush head、00373 stubble、
  00390 treat a small cut、00399 get ready quickly、00449 fasten a belt、00476 robe、
  00493 watch、00515 sleeveless、00593 fix a zipper）的修订包；本批新增 6 条 REVISE 的修正亦待作者交付新包后
  定向复验，不在本复审范围。
- CG-QA 的独立语义复核与双 AI 对账仍待进行；本复审不代记双 AI 结论。
- `production_ready: false`、`activation_allowed: false`、`publishable: 0` 均不变，
  本复审不批准启用、不批准发布。
- V51 剩余 1,006 条未生产（本批固定版本 HEAD `70e0edd1` 时点，2,038 − 1,032），不在本复审范围；
  SC50-0005 rank 221–223（KU 01043–01045）亦不在本批范围，见上文范围说明。
