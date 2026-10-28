#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"playtime":["玩耍时间","The children looked forward to ___ after lunch.","玩耍时间"],"customarily":["按照惯例地","Guests are ___ greeted at the entrance.","按惯例"],"aromatherapy":["芳香疗法","The spa offered an ___ session.","芳香疗法"],"unpaired":["不成对的","One ___ sock remained in the drawer.","不成对"],"fractal":["分形","The mathematician generated a complex ___.","分形"],"siesta":["午睡","The workers took a short ___ after lunch.","午睡"],"bylaw":["组织章程；附则","The association adopted a new ___.","附则"],"hairdo":["发型","She chose a new ___ for the celebration.","发型"],"loanword":["外来词","The linguist identified a French ___ in English.","外来词"],"proclivity":["倾向；癖好","He has a ___ for solving difficult puzzles.","倾向"],"hornet":["大黄蜂","A ___ built a nest near the roof.","大黄蜂"],"toupee":["假发片","The actor wore a ___ for the role.","假发"],"goldsmith":["金匠","The ___ crafted a delicate bracelet.","金匠"],"sleight":["手部巧技","The magician relied on ___ of hand.","巧技"],"beeline":["直线路径","She made a ___ for the exit.","直奔"],"subcontinent":["次大陆","The lecture explored the Indian ___.","次大陆"],"correlational":["相关性的","The team conducted a ___ study.","相关研究"],"endocrinology":["内分泌学","She specialized in ___ during medical training.","内分泌学"],"unpalatable":["令人难以接受的","The report revealed an ___ truth.","难以接受"],"oneness":["一体性；统一","The ceremony symbolized the ___ of the community.","一体性"],"brainstem":["脑干","The scan showed an injury to the ___.","脑干"],"hysterically":["歇斯底里地","The witness laughed ___ under stress.","失控大笑"],"tiredly":["疲倦地","He smiled ___ after the long shift.","疲倦"],"honoree":["受表彰者","The ___ accepted the award onstage.","受表彰者"],"werewolf":["狼人","The film features a frightening ___.","狼人"],"horticulture":["园艺学","She studied ___ at university.","园艺"],"finch":["雀类小鸟","A colorful ___ perched on the branch.","雀类"],"slingshot":["弹弓","The child found an old ___ in the attic.","弹弓"],"grouchy":["脾气不好的","He felt ___ after a sleepless night.","暴躁"],"pantyhose":["连裤袜","The shop stocked several styles of ___.","连裤袜"],"valedictorian":["毕业生代表；毕业典礼致辞者","The ___ gave a speech at graduation.","毕业生代表"],"stomachache":["胃痛；肚子痛","He stayed home because of a ___.","肚子痛"],"webcam":["网络摄像头","She switched on her ___ for the meeting.","网络摄像头"],"housewarming":["乔迁聚会","They invited friends to a ___.","乔迁"],"hummus":["鹰嘴豆泥","They served ___ with warm bread.","鹰嘴豆泥"],"laundromat":["自助洗衣店","He washed his clothes at the local ___.","自助洗衣店"],"cheapskate":["吝啬鬼","His friends jokingly called him a ___.","小气鬼"],"manga":["日本漫画","She collects Japanese ___.","日本漫画"],"counterintuitive":["反直觉的","The experiment produced a ___ result.","反直觉"],"sorority":["大学女生联谊会","She joined a campus ___.","女生联谊会"],"nonstick":["不粘的","The cook used a ___ pan.","不粘"],"handrail":["扶手","Hold the ___ while climbing the stairs.","扶手"],"contrite":["深感懊悔的","He sounded ___ during the apology.","懊悔"],"roundtable":["圆桌讨论会","Experts attended a ___ on public health.","圆桌会议"],"monogamous":["一夫一妻制的；单配偶的","Many bird species form ___ pairs.","单配偶"],"invisibility":["隐形；不可见性","The story revolves around a cloak of ___.","隐形"],"solstice":["至日；夏至或冬至","The festival takes place near the winter ___.","冬至"],"matchstick":["火柴梗","He used a ___ to light the candle.","火柴梗"],"nonchalant":["满不在乎的","She remained ___ despite the setback.","满不在乎"],"nepotism":["任人唯亲","The commission investigated allegations of ___.","任人唯亲"],"rainstorm":["暴雨","The hikers took shelter during a ___.","暴雨"],"rhinestone":["仿钻石","The costume glittered with a large ___.","仿钻石"],"influencer":["社交媒体意见领袖","The brand partnered with a popular ___.","网红"],"touchscreen":["触摸屏","Passengers used the ___ to select tickets.","触摸屏"],"ubiquity":["无处不在","The ___ of smartphones has changed daily life.","无处不在"],"schoolhouse":["校舍","The village restored its old ___.","校舍"],"foolhardy":["鲁莽的","It would be ___ to ignore the warning.","鲁莽"],"stopwatch":["秒表","The coach used a ___ to time each runner.","秒表"],"passerby":["路人","A ___ stopped to offer directions.","路人"],"bodega":["街角小杂货店","She bought fruit at the neighborhood ___.","小杂货店"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial21",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch21.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH21_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
