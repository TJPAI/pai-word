#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"universalism":["普救论；人人终将得救的神学学说","The theologian discussed ___ in the lecture.","普救论"],"classicism":["古典主义","The museum presented an exhibition on European ___.","古典主义"],"humanoid":["人形机器人","The laboratory displayed a ___ at the technology fair.","人形机器人"],"artificiality":["人为造作；不自然","Critics disliked the ___ of the scripted dialogue.","不自然"],"prohibitively":["高得令人却步地","The machine was ___ expensive for the small school.","过于昂贵"],"coachman":["马车夫","The ___ drove the horses through the old town.","马车夫"],"houseful":["满屋的人","We had a ___ of guests at the reunion.","满屋的人"],"footman":["男仆；侍从","A ___ opened the door of the carriage.","男仆"],"stoat":["白鼬","A ___ ran across the snowy field.","白鼬"],"steamboat":["汽船","Tourists boarded the old ___ on the river.","汽船"],"suggestiveness":["暗示性","The poem's ___ invites several interpretations.","暗示性"],"boyish":["男孩般的","His ___ enthusiasm made the team smile.","男孩般的"],"friar":["托钵修士","A ___ offered food to the travelers.","修士"],"manger":["牲畜食槽","The farmer placed fresh hay in the ___.","食槽"],"couture":["高级时装设计","She studied French ___ in Paris.","高级时装"],"craggy":["崎岖多岩石的","The path crossed a ___ hillside.","崎岖多岩石"],"governess":["家庭女教师","The family hired a ___ to teach the children.","家庭女教师"],"plaid":["格子花呢","The tailor selected a blue ___ for the coat.","格子花呢"],"hussar":["轻骑兵","The painting depicts a ___ in uniform.","轻骑兵"],"bramble":["荆棘灌木","His jacket caught on a thorny ___.","荆棘灌木"],"berg":["浮冰山","The captain spotted a ___ ahead of the ship.","冰山"],"parson":["牧师","The village ___ conducted the ceremony.","牧师"],"disagreeably":["令人不快地","The chemical smelled ___ strong.","令人不快地"],"foolishly":["愚蠢地","The driver ___ ignored the warning sign.","愚蠢地"],"absurdly":["荒谬地；离谱地","The tickets were ___ expensive.","离谱地"],"afar":["从远方","People traveled from ___ to attend the festival.","远方"],"unionism":["工会主义","The historian researched nineteenth-century ___.","工会主义"],"chubby":["圆胖的","The toddler had ___ cheeks.","胖乎乎的"],"sportswoman":["女运动员","The prize went to a talented ___.","女运动员"],"uselessness":["无用性","The malfunction revealed the ___ of the device.","无用性"],"mantelpiece":["壁炉架","A clock stood on the old ___.","壁炉架"],"greenbelt":["城市周围的绿化带","The new park forms part of the city's ___.","绿化带"],"nobleman":["贵族男子","The ___ lived in a stone castle.","贵族男子"],"victoriously":["胜利地","The captain raised the trophy ___.","胜利地"],"advisability":["是否明智；可取性","They questioned the ___ of the expansion plan.","是否明智"],"staid":["稳重保守的","The company's ___ image changed after the redesign.","稳重保守的"],"nitric":["硝酸的；含氮的","The scientist used ___ acid in the experiment.","硝酸的"],"flattery":["奉承；阿谀","The leader was unimpressed by excessive ___.","奉承"],"hypocrite":["伪君子","He was called a ___ for breaking his own rules.","言行不一的人"],"rudely":["粗鲁地","The impatient customer spoke ___.","粗鲁地"],"weariness":["疲惫；倦怠","Hours of walking left her with deep ___.","疲惫"],"merrily":["欢快地","The children sang ___ on their way home.","欢快地"],"shipbuilding":["造船业","The port has a long history of ___.","造船业"],"marshy":["沼泽的；湿软的","The hikers avoided the ___ ground.","沼泽的"],"tsar":["沙皇","The museum displayed a portrait of a Russian ___.","沙皇"]}''')
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
    response=lemma.title() if lemma in {"october","january","june","february","november","december","september","april","monday"} else lemma
    out.append({"draft_sense_id":f"staging:v21:bilingual:{rank}:{r['oewn_sense_id']}",
      "headword_id":f"core20k:rank:{rank}","rank":rank,"lemma":lemma,
      "oewn_sense_id":r["oewn_sense_id"],"definition_en_source":r["definition_en"],
      "gloss_zh_editorial":zh,"ecdict_wordlevel_reference":r["translation_zh_wordlevel_source"],
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial09",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch09.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH09_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
