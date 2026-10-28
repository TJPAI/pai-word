#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"wold":["开阔丘陵地","Sheep grazed across the grassy ___.","丘陵"],"tomboy":["假小子（旧式称呼）","The novel portrays her as a lively ___.","假小子"],"tartly":["尖刻地","He replied ___ to the criticism.","尖刻"],"secessionist":["分离主义支持者","The historian interviewed a former ___.","分离主义"],"tankard":["大酒杯","A pewter ___ stood on the tavern table.","大酒杯"],"sax":["萨克斯管","He played the ___ in a jazz band.","萨克斯管"],"diachronic":["历时的","The linguist conducted a ___ study.","历时"],"garret":["阁楼","The painter worked in a cramped ___.","阁楼"],"vociferous":["喧嚷的","The reform drew ___ protests.","喧嚷"],"unbreakable":["不易打破的","They tested an ___ plastic container.","不易碎"],"fescue":["羊茅草","The farmer planted ___ in the pasture.","羊茅"],"dinnertime":["晚餐时间","The children returned at ___.","晚餐"],"sunlit":["阳光照耀的","They stepped into a ___ courtyard.","阳光"],"brownish":["略呈棕色的","The water appeared ___ after the storm.","棕色"],"submergence":["淹没","The sudden ___ damaged the equipment.","淹没"],"acrobat":["杂技演员","The ___ performed high above the audience.","杂技"],"propitious":["有利的","The weather seemed ___ for the expedition.","有利"],"hallelujah":["哈利路亚；赞美呼喊","The choir sang ___.","赞美"],"homegrown":["本地种植的","The restaurant used ___ tomatoes.","本地种植"],"revue":["歌舞杂耍剧","The theater staged a musical ___.","歌舞剧"],"inexplicably":["无法解释地","The engine stopped ___ during the test.","无法解释"],"hereof":["本文件的","The provisions ___ shall apply.","本文件"],"pelican":["鹈鹕","A ___ caught a fish in its bill.","鹈鹕"],"unimpressed":["不以为然的","The judges seemed ___ by the display.","不以为然"],"battlement":["城垛","A guard watched from the castle ___.","城垛"],"reassuringly":["令人安心地","She spoke ___ to the worried patient.","安慰"],"nightgown":["睡袍","She put on a cotton ___ before bed.","睡袍"],"playboy":["花花公子","The novel depicts a wealthy ___.","花花公子"],"transept":["教堂横翼","Visitors entered the cathedral's northern ___.","横翼"],"businessperson":["商人","The local ___ opened another shop.","商人"],"mullion":["窗竖梃","The architect repaired the stone ___.","窗竖梃"],"wholemeal":["全麦的","He bought ___ flour for the bread.","全麦"],"musicology":["音乐学","She pursued graduate study in ___.","音乐学"],"viaduct":["高架桥","The train crossed the old stone ___.","高架桥"],"boatman":["船夫","The ___ steered across the river.","船夫"],"whitewater":["湍急水流","The raft entered dangerous ___.","激流"],"joist":["托梁","The carpenter replaced a broken floor ___.","托梁"],"ergonomic":["符合人体工学的","The office installed ___ chairs.","人体工学"],"poncho":["斗篷","She wore a waterproof ___ in the rain.","斗篷"],"gorse":["荆豆","Yellow ___ bloomed beside the path.","荆豆"],"baseless":["毫无根据的","The allegations proved ___.","无根据"],"parthenote":["孤雌生殖细胞","The biologist examined a ___ under a microscope.","孤雌生殖"],"endearment":["爱意表达","She whispered a term of ___.","爱称"],"mountainside":["山坡","A village lay on the steep ___.","山坡"],"transect":["横切","The survey line will ___ the valley.","横切"],"topsoil":["表土","The gardeners added fresh ___.","表土"],"cichlid":["慈鲷","A colorful ___ swam in the aquarium.","慈鲷"],"disloyalty":["不忠","The commander accused him of ___.","不忠"],"westerner":["西部居民","The historian interviewed a lifelong ___.","西部居民"],"arty":["故作艺术的","The reviewer found the design rather ___.","故作艺术"],"desegregation":["取消种族隔离","The book documents school ___.","取消隔离"],"remorseless":["无情的","The villain showed ___ cruelty.","无情"],"evacuee":["撤离人员","The shelter welcomed each ___.","撤离"],"diametrically":["截然相反地","Their opinions were ___ opposed.","相反"],"octagonal":["八角形的","The tower had an ___ roof.","八角形"],"atheism":["无神论","The lecture discussed the history of ___.","无神论"],"headstrong":["任性的","The ___ teenager ignored the warning.","固执"],"acrobatic":["杂技般的","The dancers performed an ___ routine.","杂技"],"chancel":["教堂圣坛区","The choir gathered in the ___.","圣坛区"],"compositor":["排字工","The printing shop employed a skilled ___.","排字"],"ideologue":["意识形态的坚定拥护者","The journalist interviewed a political ___.","意识形态"],"reveler":["狂欢者","A noisy ___ danced in the square.","狂欢"],"venerate":["尊崇","Many people ___ the ancient poet.","尊崇"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial25",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch25.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH25_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
