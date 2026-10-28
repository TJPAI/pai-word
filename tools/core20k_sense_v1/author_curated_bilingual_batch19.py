#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"racecourse":["赛马场","Thousands of fans gathered at the ___.","赛马场"],"pushchair":["婴儿推车","She folded the ___ before boarding the bus.","婴儿推车"],"lino":["油毡地板","The kitchen floor was covered with worn ___.","油毡地板"],"showpiece":["展品中的精品","The sculpture became the museum's ___.","镇馆之宝"],"monosyllable":["单音节词","The toddler answered with a single ___.","单音节词"],"crazily":["疯狂地","The vehicle swerved ___ around the corner.","疯狂地"],"multicolored":["多色的","Children waved ___ flags at the parade.","多彩"],"slacker":["偷懒者","The manager refused to reward a ___.","懒散者"],"culvert":["涵洞","Rainwater flowed through the ___ beneath the road.","涵洞"],"plinth":["基座","The statue stood on a stone ___.","基座"],"groggy":["昏昏沉沉的","He felt ___ after waking from surgery.","昏沉"],"minnow":["小鲦鱼","The child spotted a ___ in the stream.","小鱼"],"gunpoint":["枪口威胁","The robbers held the guard at ___.","枪口"],"gargantuan":["庞大的","The engineers faced a ___ challenge.","巨大"],"opus":["作品；乐曲","The composer completed his final ___.","作品"],"willpower":["意志力","Quitting the habit required enormous ___.","意志力"],"rhetorically":["修辞性地","She asked the question ___, expecting no answer.","反问"],"longingly":["渴望地","He looked ___ at the distant mountains.","渴望"],"drafter":["起草者","The legal ___ revised the agreement.","起草者"],"syntactically":["句法上","The two phrases differ ___.","句法"],"wader":["涉禽","A ___ searched for food in the shallow water.","涉禽"],"greedily":["贪婪地","The child ___ grabbed another slice.","贪婪"],"hairbrush":["发刷","She used a ___ to untangle her hair.","发刷"],"toothpick":["牙签","He used a ___ after dinner.","牙签"],"felted":["毡制的","The artist wore a ___ wool hat.","毡制"],"raptor":["猛禽","The eagle is a powerful ___.","猛禽"],"gazebo":["凉亭","They sheltered from the rain in a ___.","凉亭"],"newsman":["新闻记者（男性）","The experienced ___ covered the election.","记者"],"resplendent":["华美耀眼的","The hall looked ___ in the morning light.","华美"],"elitism":["精英主义","The essay criticized academic ___.","精英主义"],"docker":["码头装卸工","A ___ helped unload the ship.","码头工"],"repairer":["修理工","The bicycle ___ replaced the broken wheel.","修理工"],"lamplight":["灯光","She read the letter by ___.","灯光"],"wildflower":["野花","A purple ___ bloomed beside the trail.","野花"],"wimpy":["软弱的","The villain mocked the hero as ___.","软弱"],"preeminent":["卓越的；首屈一指的","The award honored a ___ scientist.","卓越"],"saxophonist":["萨克斯演奏家","The ___ performed a jazz solo.","萨克斯手"],"apolitical":["不关心政治的；政治中立的","The organization remained strictly ___.","政治中立"],"abash":["使窘迫","The unexpected question seemed to ___ him.","使窘迫"],"upriver":["向上游","The crew paddled ___ against the current.","上游"],"plaudit":["赞誉","The actor received a ___ from the critics.","称赞"],"summerhouse":["花园凉亭","They relaxed in the garden ___.","凉亭"],"archeologist":["考古学家","The ___ excavated an ancient settlement.","考古学家"],"expository":["说明性的","The textbook uses clear ___ prose.","说明性的"],"apprehensively":["忧虑地","She waited ___ outside the office.","担忧"],"wizardry":["非凡的技艺","The engineer's technical ___ impressed us.","非凡技能"],"dieter":["节食者","The ___ tracked meals in a notebook.","节食者"],"multiracial":["多种族的","The city has a ___ population.","多种族"],"nimbly":["敏捷地","The dancer moved ___ across the stage.","敏捷"],"heretical":["异端的","The scholar faced criticism for ___ ideas.","异端"],"hosiery":["袜类商品","The shop specializes in women's ___.","袜类"],"religiosity":["宗教虔诚；宗教热忱","The historian examined expressions of ___.","宗教热忱"],"icily":["冷冰冰地","She responded ___ to the insult.","冷淡"],"surrealist":["超现实主义艺术家","The painter became a leading ___.","超现实主义"],"certitude":["确信","He spoke with absolute ___.","确信"],"sociolinguistics":["社会语言学","She studies language variation through ___.","社会语言学"],"decommission":["退役；停用","The navy decided to ___ the aging ship.","退役"],"stork":["鹳","A ___ nested on the chimney.","鹳"],"chipmunk":["花栗鼠","A ___ gathered seeds near the cabin.","花栗鼠"],"politico":["政界人士","The journalist interviewed a local ___.","政界人士"],"bulkhead":["隔舱板","The ship's ___ separated the storage areas.","隔舱板"],"zeta":["希腊字母ζ","The equation uses ___ as a variable.","希腊字母"],"vivacious":["活泼的","Her ___ personality brightened the party.","活泼"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial19",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch19.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH19_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
