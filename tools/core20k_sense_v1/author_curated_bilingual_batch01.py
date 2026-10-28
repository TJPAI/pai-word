#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"positional":["位置的；由位置决定的","The ___ accuracy of the sensor improved after calibration.","与位置有关的"],"friday":["星期五","Our weekly project meeting takes place every ___.","星期五"],"wednesday":["星期三","The laboratory holds its weekly seminar on ___.","星期三"],"saturday":["星期六","The community garden opens to volunteers every ___.","星期六"],"newness":["新颖性；崭新状态","The ___ of the idea attracted everyone's attention.","新颖性"],"thursday":["星期四","Please send your draft by ___ so we can review it before Friday.","星期四"],"preventable":["可预防的；可避免的","Many workplace injuries are ___ with proper training.","可预防的"],"needful":["必要的；必需的","The volunteers delivered ___ supplies to families after the flood.","必需的"],"conditionally":["有条件地","The proposal was ___ approved, pending a safety review.","有条件地"],"populism":["民粹主义","The historian examined the rise of ___ during the election.","民粹主义"],"shapely":["形状匀称的；线条优美的","The sculptor carved a ___ vase from a block of stone.","形状匀称的"],"crowded":["拥挤的；挤满的","The train was so ___ that passengers could barely move.","拥挤的"],"bilingualism":["双语能力；双语使用","The study examined the benefits of childhood ___.","双语能力"],"militancy":["激进战斗性；好斗倾向","The movement's growing ___ concerned the local authorities.","激进战斗性"],"checkup":["全面体检","My doctor recommended a routine ___ before the long trip.","体检"],"faceless":["没有身份特征的；匿名的","The novel portrays a ___ bureaucracy that never answers complaints.","没有人格特征的"],"afterwards":["后来；之后","We finished the experiment and discussed the results ___.","之后"],"schoolmate":["同学；校友","She recognized an old ___ at the reunion.","以前的同学"],"typhoon":["台风","The coastal villages prepared shelters before the ___ arrived.","台风"],"computationally":["在计算方面；从计算角度","The optimization problem is ___ expensive for large networks.","计算方面"],"opinionated":["固执己见的","The ___ commentator rarely considered opposing arguments.","固执己见的"],"tofu":["豆腐","She added cubes of ___ to the vegetable soup.","豆腐"],"snowman":["雪人","The children built a ___ after the first heavy snowfall.","雪人"],"achiever":["有成就的人；成绩突出者","She was a high ___ who consistently met ambitious goals.","有成就的人"],"storybook":["故事书","The teacher read a ___ aloud to the young children.","故事书"],"faucet":["水龙头","Please turn off the ___ before you leave the kitchen.","水龙头"],"stairwell":["楼梯间","The emergency exit led into a narrow ___.","楼梯间"],"formalization":["形式化；正式确定","The ___ of the rules made the process easier to audit.","规则形式化"],"lifeguard":["救生员","The ___ blew a whistle when swimmers entered the dangerous area.","救生员"],"blurry":["模糊的；轮廓不清的","The photograph looked ___ because the camera moved.","模糊的"],"halftime":["中场休息","The coach gave the players new instructions at ___.","中场休息"],"rephrase":["换一种说法表达","Could you ___ the question in simpler English?","换一种说法表达"],"dutiful":["尽职的；恪守职责的","The ___ assistant checked every document before the meeting.","尽职的"],"cupcake":["纸杯小蛋糕","She decorated each ___ with a swirl of icing.","纸杯小蛋糕"],"habitable":["适合居住的","Engineers inspected the damaged building to see if it was still ___.","适合居住的"],"attentively":["专心地；注意地","The audience listened ___ as the scientist explained the discovery.","专心地"],"sailboat":["帆船","A small ___ crossed the bay using only the wind.","帆船"],"minutely":["极其详细地","The inspector examined the damaged circuit ___.","非常详细地"],"seatbelt":["安全带","Please fasten your ___ before the aircraft takes off.","安全带"],"constructively":["建设性地","The team discussed the criticism ___ and revised the design.","建设性地"],"expressway":["高速公路；快速道路","The new ___ shortened the drive between the two cities.","快速道路"],"regionally":["在地区范围内","The company sells its products ___ rather than nationwide.","在地区范围内"],"restful":["令人放松的；有助于休息的","The quiet cabin offered a ___ weekend away from the city.","令人放松的"],"opportunism":["机会主义","His political ___ made his promises difficult to trust.","机会主义"],"guesthouse":["旅馆；客房别墅","We stayed in a small ___ near the old town.","旅馆"],"yummy":["美味的；好吃的","The freshly baked bread smelled ___.","美味的"],"seabed":["海床；海底","Scientists collected sediment samples from the ___.","海底"],"handlebar":["车把；自行车把手","He tightened the loose ___ before riding downhill.","自行车车把"],"swatch":["布料样品","The designer showed us a ___ of the new fabric.","布料样品"],"capsize":["（船）倾覆","The sudden wave threatened to ___ the little boat.","使船倾覆"],"alcove":["壁龛；凹室","A comfortable reading chair stood in a small ___ beside the window.","凹室"],"recyclable":["可回收利用的","The packaging is made from fully ___ paper.","可回收利用的"],"porridge":["粥；麦片粥","She made warm ___ from oats and milk for breakfast.","麦片粥"],"teethe":["长乳牙","Babies often become irritable when they begin to ___.","长乳牙"],"loner":["独来独往的人","Although he was a ___, he enjoyed talking with his neighbors.","独来独往的人"],"scalable":["可扩展的；可规模化的","The engineers designed a ___ service for millions of users.","可扩展的"],"scoreboard":["记分牌","The final score appeared on the stadium ___.","记分牌"],"methodical":["有条理的；按步骤进行的","Her ___ approach helped the team identify the error.","有条理的"],"inflatable":["可充气的","The rescue boat has an ___ hull that can be stored compactly.","可充气的"],"mascot":["吉祥物","The school chose an owl as its new ___.","吉祥物"],"unwell":["身体不适的","She stayed home because she felt ___.","身体不适的"],"conversant":["熟悉的；精通的","The engineer is fully ___ with the latest safety standards.","熟悉的"],"antler":["鹿角","The deer shed an ___ at the end of winter.","鹿角"],"circadian":["昼夜节律的","Light exposure can affect the body's ___ rhythm.","昼夜节律的"]}''')
index=json.loads((batchroot/"index.json").read_text())
by_lemma={}
for b in index["batches"]:
    f=batchroot/("batch%03d"%b["batch"])/"bilingual_ku_editorial_candidates.jsonl"
    for line in f.open(encoding="utf8"):
        r=json.loads(line)
        if r["lemma"] in entries and r["editing_state"]=="EDITORIAL_SINGLE_GLOSS_CANDIDATE":
            by_lemma.setdefault(r["lemma"],[]).append(r)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:
    words=json.load(f)["headwords"]
out=[];skipped={}
for lemma,(zh,prompt,cue) in entries.items():
    candidates=by_lemma.get(lemma,[])
    if len(candidates)!=1:
        skipped[lemma]="NOT_EXACTLY_ONE_LOW_RISK_SOURCE";continue
    r=candidates[0];rank=r["rank"]
    assert words[rank-1][1].casefold()==lemma and prompt.count("___")==1
    out.append({"draft_sense_id":f"staging:v21:bilingual:{rank}:{r['oewn_sense_id']}",
      "headword_id":f"core20k:rank:{rank}","rank":rank,"lemma":lemma,
      "oewn_sense_id":r["oewn_sense_id"],"definition_en_source":r["definition_en"],
      "gloss_zh_editorial":zh,"ecdict_wordlevel_reference":r["translation_zh_wordlevel_source"],
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial02",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",lemma),
      "correct_answer":lemma,"acceptable_answers":[lemma],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch01.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH01_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
