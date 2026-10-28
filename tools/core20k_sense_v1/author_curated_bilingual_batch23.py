#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"parasol":["遮阳伞","She opened a ___ against the bright sunlight.","遮阳伞"],"outlast":["比……持续更久","The battery may ___ the device itself.","持续更久"],"banality":["陈词滥调","The speech was full of ___.","陈词滥调"],"racecourse":["赛马场","Thousands of spectators gathered at the ___.","赛马场"],"pushchair":["婴儿推车","She folded the ___ before boarding the train.","婴儿推车"],"lino":["油毡地板","The kitchen floor was covered with worn ___.","油毡"],"showpiece":["最出色的展品","The sculpture was the gallery's ___.","精品"],"monosyllable":["单音节词","The toddler answered with a single ___.","单音节"],"crazily":["疯狂地","The car swerved ___ across the road.","疯狂地"],"multicolored":["五彩斑斓的","They decorated the hall with ___ ribbons.","多彩"],"slacker":["偷懒者","The supervisor warned the habitual ___.","偷懒者"],"culvert":["涵洞","Rainwater passed through a ___ under the road.","涵洞"],"plinth":["雕像基座","The statue stood on a marble ___.","基座"],"groggy":["昏昏沉沉的","She felt ___ after the operation.","昏沉"],"minnow":["小鲦鱼","A tiny ___ darted through the stream.","小鱼"],"gunpoint":["枪口威胁","The witnesses were held at ___.","枪口"],"gargantuan":["巨大无比的","The new dam was a ___ engineering project.","巨大"],"opus":["音乐作品","The composer finished a new ___ for strings.","乐曲"],"willpower":["意志力","Resisting the temptation took remarkable ___.","意志力"],"rhetorically":["以修辞方式；反问地","He asked ___ whether anyone could disagree.","反问"],"longingly":["渴望地","She gazed ___ at the distant coast.","渴望"],"drafter":["起草人","The agreement's ___ revised the final clause.","起草人"],"syntactically":["从句法上","These two sentences differ ___.","句法上"],"wader":["涉禽","A long-legged ___ searched the marsh for food.","涉禽"],"greedily":["贪婪地","He ___ grabbed the largest slice.","贪婪地"],"hairbrush":["发刷","She picked up a ___ to tidy her hair.","发刷"],"toothpick":["牙签","He used a ___ after lunch.","牙签"],"felted":["毡制的","The artisan made a ___ wool hat.","毡制"],"raptor":["猛禽","An eagle is a powerful ___.","猛禽"],"gazebo":["凉亭","The wedding guests gathered beneath the ___.","凉亭"],"newsman":["男新闻记者","The veteran ___ reported from the scene.","记者"],"resplendent":["华丽耀眼的","The palace looked ___ in the morning sun.","华丽"],"elitism":["精英主义","The article criticized the committee's ___.","精英主义"],"docker":["码头装卸工","A ___ unloaded crates from the ship.","码头工"],"repairer":["修理工","The appliance ___ replaced the faulty motor.","修理工"],"lamplight":["灯光","He read the manuscript by ___.","灯光"],"wildflower":["野花","A blue ___ grew beside the track.","野花"],"wimpy":["软弱无力的","The coach criticized the team's ___ defense.","软弱"],"preeminent":["首屈一指的","She became a ___ scholar in the field.","杰出的"],"saxophonist":["萨克斯管演奏者","The ___ played a solo at the jazz club.","萨克斯手"],"apolitical":["不涉政治的","The charity describes itself as strictly ___.","不涉政治"],"abash":["使窘迫","The unexpected compliment seemed to ___ him.","使窘迫"],"upriver":["往上游","The team paddled ___ toward the source.","上游"],"plaudit":["热烈赞扬","The actor received a ___ from the critics.","赞誉"],"summerhouse":["花园凉亭","They rested in a small ___ by the pond.","凉亭"],"archeologist":["考古学家","The ___ examined the ancient pottery.","考古学家"],"expository":["说明性的","The lesson began with an ___ passage.","说明性"],"apprehensively":["忧虑地","He waited ___ outside the interview room.","忧虑"],"wizardry":["高超技艺","The programmer's technical ___ impressed the team.","高超技艺"],"dieter":["节食者","The ___ kept a record of daily meals.","节食者"],"multiracial":["多种族的","The neighborhood has a ___ population.","多种族"],"nimbly":["敏捷地","The gymnast moved ___ across the beam.","敏捷"],"heretical":["异端的","The writer's ___ views caused controversy.","异端"],"hosiery":["袜类商品","The store sells gloves and ___.","袜类"],"religiosity":["过度宗教虔诚","The critic questioned his public display of ___.","过度虔诚"],"icily":["冷冰冰地","She replied ___ to his complaint.","冷漠"],"surrealist":["超现实主义艺术家","The exhibition featured a renowned ___.","超现实主义者"],"certitude":["确信","He spoke with complete ___.","确信"],"sociolinguistics":["社会语言学","She pursued graduate research in ___.","社会语言学"],"decommission":["退役；停用","The navy plans to ___ the aging vessel.","退役"],"stork":["鹳","A ___ nested on the village chimney.","鹳"],"chipmunk":["花栗鼠","A ___ gathered seeds near the cabin.","花栗鼠"],"politico":["政界人士","A veteran ___ attended the meeting.","政界人士"],"bulkhead":["舱壁","The ship's ___ kept the compartments separate.","舱壁"],"zeta":["希腊字母ζ","The formula uses ___ as a coefficient.","希腊字母"],"vivacious":["活泼的","Her ___ manner energized the entire room.","活泼"]}''')
allowed={r["lemma"]:r for line in (root/"next500_uncovered_source_cards.jsonl").open(encoding="utf8") for r in [json.loads(line)]}
excluded=[lemma for lemma in entries if lemma not in allowed]
entries={lemma:value for lemma,value in entries.items() if lemma in allowed}
assert entries, "No current deduplicated source entries"
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
    assert allowed[lemma]["rank"]==rank and allowed[lemma]["oewn_sense_id"]==r["oewn_sense_id"]
    assert words[rank-1][1].casefold()==lemma and prompt.count("___")==1
    response=lemma.title() if lemma in {"october","january","june","february","november","december","september","april","monday"} else lemma
    out.append({"draft_sense_id":f"staging:v21:bilingual:{rank}:{r['oewn_sense_id']}",
      "headword_id":f"core20k:rank:{rank}","rank":rank,"lemma":lemma,
      "oewn_sense_id":r["oewn_sense_id"],"definition_en_source":r["definition_en"],
      "gloss_zh_editorial":zh,"ecdict_wordlevel_reference":r["translation_zh_wordlevel_source"],
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial23",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch23.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH23_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
