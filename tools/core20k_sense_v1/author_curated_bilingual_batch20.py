#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"nu":["希腊字母ν","The physicist used ___ to represent frequency.","字母nu"],"balustrade":["栏杆","The old staircase had a carved stone ___.","栏杆"],"newsreel":["新闻纪录短片","The museum screened a wartime ___.","新闻短片"],"yearlong":["持续一年的","They completed a ___ research project.","一年"],"bigwig":["大人物；要员","The conference attracted several industry ___.","行业大人物"],"hyena":["鬣狗","A ___ prowled the savanna at dusk.","鬣狗"],"debauchery":["放纵享乐","The novel describes a life of ___.","放纵"],"harpsichord":["羽管键琴","The musician performed the sonata on a ___.","羽管键琴"],"trapeze":["空中秋千","The acrobat swung from a ___.","空中秋千"],"dispersive":["扩散性的","The experiment examined a ___ medium.","扩散性"],"minaret":["宣礼塔","A tall ___ rose beside the mosque.","宣礼塔"],"hater":["憎恨者","He refused to let a single ___ ruin his day.","憎恨者"],"assertiveness":["坚定自信；敢于表达","The workshop helped students develop ___.","坚定表达"],"serological":["血清学的","The hospital conducted ___ tests.","血清学"],"bullfight":["斗牛表演","The documentary discussed a traditional ___.","斗牛"],"subconsciously":["下意识地","She ___ adjusted her posture.","下意识"],"snuffbox":["鼻烟盒","The antique ___ was made of silver.","鼻烟盒"],"torchlight":["火炬光","The explorers moved forward by ___.","火炬光"],"cavort":["蹦跳嬉闹","The puppies began to ___ on the lawn.","嬉闹"],"topmost":["最高处的","The climber reached the ___ ledge.","最高处"],"exegesis":["经文阐释；文本释义","The scholar published an ___ of the ancient text.","释义"],"stative":["状态动词的","The verb know is generally considered ___.","状态"],"squeamish":["容易恶心的","The medical student was too ___ to watch the procedure.","易恶心"],"moniker":["绰号","The singer performed under a familiar ___.","绰号"],"gutsy":["勇敢果断的","She made a ___ decision in the final minute.","勇敢"],"glittery":["闪闪发光的","The dancers wore ___ costumes.","闪亮"],"diatribe":["长篇激烈抨击","The editor wrote a furious ___ against corruption.","激烈抨击"],"elegy":["挽歌；哀歌","The poet composed an ___ for his late friend.","挽歌"],"bloodstain":["血迹","Investigators noticed a ___ on the carpet.","血迹"],"prepositional":["介词的","The teacher explained a ___ phrase.","介词短语"],"cicada":["蝉","A ___ sang loudly in the tree.","蝉"],"hydrodynamic":["流体动力学的","The engineers tested the vehicle's ___ design.","流体动力学"],"triptych":["三联画","The gallery displayed a medieval ___.","三联画"],"mote":["微粒","A ___ of dust floated in the sunlight.","微粒"],"minimalism":["极简主义","The exhibition explored ___ in modern art.","极简主义"],"diplomatically":["圆通得体地","She responded ___ to the disagreement.","圆通"],"touristy":["游客众多的","The waterfront felt too ___ in summer.","游客众多"],"multiculturalism":["多元文化主义","The course examined the principles of ___.","多元文化"],"biracial":["涉及两个种族的","The study examined experiences in ___ families.","双种族"],"marlin":["马林鱼","The fisherman spotted a ___ offshore.","马林鱼"],"blowgun":["吹箭筒","The exhibit included a traditional ___.","吹箭筒"],"geophysical":["地球物理的","The team conducted a ___ survey.","地球物理"],"ditty":["短小歌曲","She hummed a cheerful ___.","小曲"],"curbside":["路缘旁","The parcel was ready for ___ pickup.","路边"],"cirque":["冰斗","The hikers reached a glacial ___ in the mountains.","冰斗"],"pied":["杂色的","The bird had ___ feathers.","杂色"],"burgh":["苏格兰自治市镇","The ancient ___ grew around a trading port.","自治市"],"speechwriter":["演讲稿撰写人","The president hired an experienced ___.","演讲撰稿人"],"teary":["眼含泪水的","The audience grew ___ during the farewell.","含泪"],"changeover":["转换；交接","The factory scheduled a ___ between shifts.","交接"],"filly":["小母马","The trainer led a young ___ into the paddock.","小母马"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial20",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch20.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH20_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
