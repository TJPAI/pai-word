#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"perusal":["仔细阅读","The proposal was submitted for her ___.","仔细阅读"],"rancor":["深刻怨恨","The dispute left lasting ___ between neighbors.","怨恨"],"obligingly":["乐于助人地","The clerk ___ carried the luggage upstairs.","乐于帮助"],"jaguar":["美洲豹","A ___ prowled through the rainforest.","美洲豹"],"damsel":["少女（旧式用语）","The medieval tale describes a ___ in distress.","少女"],"hothouse":["温室","The orchids were raised in a warm ___.","温室"],"presumptuous":["冒昧放肆的","It would be ___ to assume they agree.","冒昧"],"qualitatively":["从性质上","The two approaches differ ___.","性质上"],"confidante":["女性知己","She shared the secret with her closest ___.","女性知己"],"earthling":["地球居民","The science-fiction alien greeted an ___.","地球居民"],"indescribable":["难以形容的","The view filled her with ___ joy.","难以形容"],"gleeful":["欢欣雀跃的","The children gave a ___ cheer.","欢乐"],"drake":["公鸭","A colorful ___ swam across the pond.","公鸭"],"inimitable":["独一无二的；无法模仿的","The singer performed in her ___ style.","独特"],"idolatry":["偶像崇拜","The historian studied religious ___.","偶像崇拜"],"priory":["小修道院","The monks lived in a secluded ___.","修道院"],"loving":["充满爱意的","He wrote a ___ letter to his family.","充满爱"],"reservist":["预备役军人","The ___ attended an annual training exercise.","预备役"],"mullah":["毛拉；伊斯兰宗教学者","The local ___ addressed the congregation.","毛拉"],"july":["七月","Their summer course starts in ___.","七月"],"chub":["圆鳍雅罗鱼","The angler caught a ___ in the river.","淡水鱼"],"swarthy":["肤色黝黑的","The old tale describes a ___ sailor.","黝黑肤色"],"untitled":["没有贵族头衔的","The historical record described an ___ gentleman.","无贵族头衔"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial18",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch18.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH18_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
