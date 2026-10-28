#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"demonic":["恶魔般的；极其邪恶的","The villain gave a ___ laugh in the final scene.","邪恶的"],"bookie":["接受赌注的庄家","The police questioned a ___ about illegal betting.","赌注庄家"],"libido":["性欲","The doctor explained that stress can affect ___.","性欲"],"wannabe":["一心想成为某种人物的人","The movie follows a young ___ who dreams of stardom.","梦想成名的人"],"groupie":["狂热追随明星的歌迷","The rock star was followed by an enthusiastic ___.","狂热追星者"],"stewardess":["女空乘人员（旧式称谓）","The novel describes a ___ serving drinks on a 1960s flight.","旧称女空乘"],"karma":["业力；因果报应","In the novel, the character believes bad ___ follows wrongdoing.","业力"],"genie":["精灵；神灯精灵","In the fairy tale, a ___ emerged from the magic lamp.","神灯精灵"],"guerilla":["游击队员","The historian interviewed a former ___ about the conflict.","游击队员"],"spiky":["尖刺状的","The plant has ___ leaves that can scratch your hand.","尖刺状的"],"dining":["就餐；进餐","Outdoor ___ is popular during the summer months.","户外用餐"],"coincidental":["巧合的","The similarities between the two stories were purely ___.","巧合的"],"externality":["外部性（经济学）","Air pollution is a negative ___ of industrial production.","经济外部性"],"plausibly":["貌似可信地；有理由相信地","The witness could ___ explain why he was late.","貌似可信地"],"screener":["安检人员","An airport ___ examined the passenger's luggage.","安检人员"],"homemaker":["料理家务的人","The survey included both employed parents and full-time ___.","全职料理家务者"],"tequila":["龙舌兰酒","The recipe called for a small splash of ___ in the sauce.","龙舌兰酒"],"lingerie":["女式内衣","The boutique sells dresses and delicate ___.","女式内衣"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial04",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",lemma),
      "correct_answer":lemma,"acceptable_answers":[lemma],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch04.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH04_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
