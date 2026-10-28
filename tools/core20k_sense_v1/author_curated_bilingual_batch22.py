#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"horticultural":["园艺的","The students visited a ___ research station.","园艺的"],"aunty":["阿姨；姑姨","Her ___ brought gifts for the children.","阿姨"],"guesswork":["猜测","The decision should rely on evidence rather than ___.","猜测"],"choosy":["挑剔的","He is ___ about which books he buys.","挑剔"],"retrospectively":["回顾地","The investigators analyzed the records ___.","回顾"],"northbound":["向北行驶的","Passengers boarded the ___ train.","向北"],"neckline":["领口线","The dress has a simple rounded ___.","领口"],"appetizing":["令人有食欲的","A delicious smell made the meal seem ___.","诱人"],"infantryman":["步兵","The ___ carried his equipment across the field.","步兵"],"quantifiable":["可量化的","The project produced ___ benefits.","可量化"],"statuette":["小雕像","A bronze ___ stood on the shelf.","小雕像"],"egalitarianism":["平等主义","The philosopher defended political ___.","平等主义"],"stolid":["冷漠不动声色的","The guard remained ___ during the commotion.","冷漠"],"invulnerable":["不可攻破的","The old fortress was thought to be ___.","坚不可摧"],"tau":["希腊字母τ","The researcher used ___ for the time constant.","希腊字母"],"funnily":["奇怪地","___ enough, no one noticed the error.","奇怪地"],"petulant":["易怒的","The child gave a ___ reply.","易怒"],"bairn":["孩子（苏格兰用语）","The old woman called the boy her ___.","孩子"],"topographical":["地形的","The team prepared a ___ map.","地形"],"northernmost":["最北端的","They reached the country's ___ town.","最北端"],"coliseum":["大型圆形竞技场","The crowd entered the ancient ___.","竞技场"],"strikeout":["三振出局","The pitcher recorded another ___.","三振"],"accusingly":["责备地","She looked ___ at the careless driver.","责备地"],"frilly":["带褶边装饰的","She wore a ___ blouse.","褶边"],"authorial":["作者的","The critic discussed ___ intention.","作者的"],"perfectionist":["完美主义者","As a ___, he revised every detail.","完美主义者"],"chimeric":["嵌合体的；幻想的","The researchers studied ___ immune cells.","嵌合"],"unbridle":["摘下马笼头","The rider stopped to ___ the horse.","摘下马具"],"anachronistic":["不合时代的","The film included an ___ reference.","时代错位"],"introit":["入祭唱；开场圣歌","The choir rehearsed the ___ before the service.","开场圣歌"],"expectantly":["期待地","The students waited ___ for the results.","期待地"],"secularism":["世俗主义","The essay examined the history of ___.","世俗主义"],"homily":["布道；说教","The minister delivered a brief ___.","布道"],"spaniel":["西班牙猎犬","The family adopted a friendly ___.","猎犬"],"seminiferous":["产精的；产生种子的","The biologist examined ___ tissue under the microscope.","产精"],"motorcade":["车队","The official ___ crossed the city center.","车队"],"affricate":["塞擦音","The linguist identified an ___ in the recording.","塞擦音"],"xenograft":["异种移植物","The surgeons considered a temporary ___.","异种移植"],"banknote":["钞票","The collector displayed an old ___.","钞票"],"wickedly":["邪恶地","The villain laughed ___ at his scheme.","邪恶地"],"dingo":["澳洲野犬","A ___ roamed the dry grassland.","澳洲野犬"],"satchel":["挎包","The student placed his books in a ___.","挎包"],"soliton":["孤子波","The physicist modeled the propagation of a ___.","孤子"],"disyllabic":["双音节的","The teacher introduced a ___ word.","双音节"],"modicum":["少量","The team showed a ___ of progress.","少量"],"distrustful":["不信任的","Investors grew ___ after the scandal.","不信任"],"demure":["端庄腼腆的","She gave a ___ smile.","腼腆"],"paternalistic":["家长式的","Workers criticized the company's ___ policies.","家长式"],"knitwear":["针织服装","The shop specializes in winter ___.","针织品"],"reinvigorate":["使恢复活力","The new manager hoped to ___ the team.","恢复活力"],"contemptible":["卑劣的","The judge called the conduct ___.","可鄙"],"esplanade":["海滨散步大道","They walked along the waterfront ___.","海滨大道"],"fanaticism":["狂热主义","The article warned against political ___.","狂热"],"coterie":["小圈子","A small ___ of artists met every Friday.","小圈子"],"imperfective":["未完成体的","The language distinguishes ___ aspect.","未完成体"],"rhododendron":["杜鹃花属植物","A blooming ___ stood beside the path.","杜鹃花"],"homophobic":["恐同的","The report condemned ___ harassment.","恐同的"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial22",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch22.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH22_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
