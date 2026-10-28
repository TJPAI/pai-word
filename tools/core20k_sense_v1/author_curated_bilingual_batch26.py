#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"environ":["环绕","Low hills ___ the village.","环绕"],"nearer":["更近的","The ___ station is only two blocks away.","更近"],"imam":["伊玛目；清真寺领拜人","The ___ led the prayers at the mosque.","领拜人"],"courtesan":["宫廷交际花（历史）","The biography describes a celebrated ___.","交际花"],"ladyship":["贵族夫人尊称","The attendant addressed her as Your ___.","尊称"],"antipsychotic":["抗精神病药物","The patient was prescribed an ___ under medical supervision.","药物"],"navvy":["土木工程工人（英式旧称）","A ___ helped build the nineteenth-century canal.","工人"],"indomethacin":["吲哚美辛","The pharmacist checked the prescription for ___.","药品"],"anaphoric":["回指的","The pronoun has an ___ function here.","回指"],"ecologically":["从生态角度","The project was assessed ___.","生态"],"collude":["秘密串通","The suppliers agreed not to ___ on bids.","串通"],"bronco":["未驯服的野马","The rider approached the nervous ___.","野马"],"ungrammatical":["不合语法的","The editor corrected an ___ sentence.","不合语法"],"demonstrably":["可证实地","The revised design was ___ safer.","可证实"],"moonlit":["月光照耀的","They walked along a ___ path.","月光"],"drifter":["漂泊者","The novel follows a solitary ___.","漂泊者"],"catamaran":["双体船","The tourists sailed aboard a ___.","双体船"],"sundial":["日晷","The garden contains an ancient ___.","日晷"],"concisely":["简洁地","She explained the results ___.","简洁"],"motherland":["祖国","The poet wrote of his ___.","祖国"],"preconceive":["预先形成观念","Try not to ___ the outcome before the study.","先入为主"],"uninfected":["未感染的","The lab isolated ___ samples.","未感染"],"forecourt":["建筑前院","The crowd gathered in the museum ___.","前院"],"secondarily":["次要地","The system was designed primarily for safety and ___ for speed.","次要"],"mistral":["密史脱拉风","A cold ___ swept through southern France.","寒风"],"immunological":["免疫学的","The team measured the ___ response.","免疫学"],"preexist":["预先存在","The condition may ___ the treatment.","先于存在"],"reawaken":["重新唤醒","The song seemed to ___ forgotten memories.","唤醒"],"tribulation":["苦难","The family endured a long ___.","苦难"],"uncouth":["粗俗无礼的","His ___ behavior offended the guests.","粗鲁"],"eukaryotic":["真核的","The researcher studied ___ cells.","真核"],"armful":["一抱之量","She carried an ___ of firewood.","一抱"],"sociability":["善于社交","Her natural ___ helped her make friends.","社交"],"quagmire":["泥沼","The truck became trapped in a ___.","泥沼"],"startlingly":["惊人地","The results were ___ different.","惊人"],"cosmonaut":["俄罗斯宇航员","The ___ trained for the orbital mission.","宇航员"],"orthography":["正字法","The course covers spelling and ___.","正字法"],"beholder":["观看者","Beauty is in the eye of the ___.","观看者"],"bison":["野牛","A herd of ___ crossed the prairie.","野牛"],"despondency":["沮丧绝望","The defeat filled him with ___.","绝望"],"imperceptible":["难以察觉的","The change was almost ___.","难察觉"],"bookshelves":["书架","The library installed new ___.","书架"],"chuff":["喷气作响","The old locomotive began to ___.","喷气"],"puffin":["海鹦","A ___ nested on the cliff.","海鹦"],"oldie":["经典老歌","The radio played an ___.","老歌"],"towpath":["运河纤道","They cycled along the canal ___.","纤道"],"opencast":["露天开采的","The company operates an ___ mine.","露天开采"],"thrips":["蓟马","The farmer found ___ on the leaves.","蓟马"],"mecca":["聚集圣地","The city became a ___ for jazz fans.","文化圣地"],"lintel":["门楣横梁","A stone ___ supported the doorway.","横梁"],"maliciously":["恶意地","Someone ___ deleted the records.","恶意"],"airframe":["飞机机体","The engineers inspected the ___.","机体"],"convener":["会议召集人","The ___ opened the discussion.","召集人"],"messianic":["救世主式的","He adopted a ___ tone.","救世主式"],"tactfully":["得体地","She ___ resolved the disagreement.","得体"],"expressionless":["毫无表情的","The witness remained ___.","无表情"],"smilingly":["微笑着","She ___ accepted the gift.","微笑"],"besot":["使沉迷昏头","Luxury seemed to ___ the young heir.","沉迷"],"wept":["哭泣（过去式）","She ___ upon hearing the news.","哭泣"],"hereabout":["在这附近","Few people live ___ in winter.","附近"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial26",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch26.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH26_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
