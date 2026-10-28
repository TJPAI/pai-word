#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"demote":["降职；降级","The company decided to ___ the manager after repeated failures.","降职"],"hairpin":["发夹","She secured her hair with a metal ___.","发夹"],"windswept":["被风吹拂的；迎风的","The hikers crossed a ___ ridge.","迎风的"],"moldy":["发霉的","We threw away the ___ bread.","发霉的"],"absently":["心不在焉地","He ___ stirred his coffee while reading the letter.","心不在焉地"],"tern":["燕鸥","A ___ dived into the sea to catch a fish.","燕鸥"],"blithely":["无忧无虑地；欢快地","The children skipped ___ along the path.","欢快地"],"weirdly":["古怪地","The clock was ___ silent all afternoon.","奇怪地"],"kiddy":["小孩（口语）","The cartoon is designed for every little ___.","小孩子"],"gaffe":["失言；失礼行为","His awkward remark was a diplomatic ___.","失言"],"puzzlement":["困惑；迷惑","Her expression showed genuine ___.","困惑"],"rote":["机械记忆；死记硬背","Learning a language requires more than ___.","死记硬背"],"surgically":["通过外科手术","The damaged tissue was ___ removed.","通过外科手术"],"veracity":["真实性；诚实性","The journalist checked the ___ of the witness's account.","真实性"],"houseboat":["水上住宅船","The family lived on a ___ moored by the canal.","水上住宅船"],"realign":["重新调整；重新对齐","The engineer had to ___ the sensor after the impact.","重新对齐"],"flirtation":["调情","Their playful ___ quickly attracted attention.","调情"],"bookshelf":["书架","She placed the dictionary on the ___.","书架"],"waistband":["腰头；裤腰带","The trousers have an elastic ___.","裤腰"],"commandant":["指挥官；校长（军校）","The academy's ___ addressed the new recruits.","军校指挥官"],"bioterrorism":["生物恐怖主义","The report discussed measures to prevent ___.","生物恐怖主义"],"definable":["可定义的","The research team established a clearly ___ objective.","可定义的"],"homepage":["主页","The university published the notice on its ___.","网站主页"],"lectern":["讲台；演讲台","The speaker placed her notes on the ___.","讲台"],"outwit":["以智取胜","The detective managed to ___ the thief.","以智取胜"],"interstellar":["星际的","The scientists detected gas in ___ space.","星际的"],"footbridge":["人行天桥","Pedestrians used the ___ to cross the busy road.","步行桥"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial05",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",lemma),
      "correct_answer":lemma,"acceptable_answers":[lemma],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch05.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH05_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
