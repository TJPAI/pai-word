#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"greeting":["问候；致意","The visitor received a warm ___ at the door.","问候"],"rapidity":["迅速；快速","The ___ of the response surprised the emergency team.","反应速度快"],"conch":["海螺","A large ___ lay on the sandy beach.","海螺"],"attractively":["漂亮地；美观地","The shop displayed its handmade ceramics ___.","美观地"],"suddenness":["突然性","The ___ of the announcement left everyone speechless.","突然性"],"joyfully":["欢快地；高兴地","The children sang ___ as they walked home.","高兴地"],"lateness":["迟到；晚到","The train's ___ caused several passengers to miss their connections.","晚到"],"banjo":["班卓琴","The musician played a lively tune on his ___.","班卓琴"],"educationally":["在教育方面","The new software is ___ valuable for younger students.","在教育方面"],"artiste":["艺人；表演者","The cabaret ___ performed two songs for the audience.","表演者"],"orbiter":["轨道飞行器","The lunar ___ sent images back to mission control.","轨道飞行器"],"anorak":["带风帽的防寒外套","She wore a thick ___ during the winter hike.","防寒外套"],"mermaid":["美人鱼","The fairy tale tells of a ___ who lived beneath the waves.","美人鱼"],"antler":["鹿角","A deer had lost one ___ during the winter.","鹿角"],"particularity":["特殊性；独特性","The lawyer emphasized the ___ of the case.","特定案件的特殊性"],"cappuccino":["卡布奇诺咖啡","He ordered a ___ at the café after lunch.","卡布奇诺咖啡"],"concierge":["门房；礼宾员","The hotel ___ arranged a taxi for the guests.","酒店礼宾员"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial03",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",lemma),
      "correct_answer":lemma,"acceptable_answers":[lemma],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch02.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH02_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
