#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"prescient":["有先见之明的","The analyst made a ___ prediction about the market.","有先见之明"],"dollop":["一大勺；一团","Add a ___ of cream to the dessert.","一勺"],"replant":["重新栽种","The gardeners will ___ the damaged trees.","重新栽种"],"antiphon":["应答圣歌","The choir performed an ancient ___.","应答圣歌"],"gruffly":["粗声粗气地","The captain answered ___ when interrupted.","粗声"],"midwinter":["隆冬","The village was covered in snow by ___.","隆冬"],"skeptically":["怀疑地","She examined the claim ___.","怀疑"],"bagpipe":["风笛","The musician played a traditional ___.","风笛"],"morass":["沼泽","The travelers struggled through a muddy ___.","沼泽"],"leery":["有所戒备的","Investors remained ___ of the risky scheme.","戒备"],"venturous":["勇于冒险的","The ___ explorer sailed toward unknown shores.","冒险的"],"chewable":["可咀嚼的","The tablets are ___ rather than swallowed whole.","可咀嚼"],"lamely":["无说服力地","He ___ explained why he had missed the deadline.","无力地"],"goblin":["小妖精","The tale features a mischievous ___.","小妖精"],"oilfield":["油田","The company developed a new offshore ___.","油田"],"boudoir":["女子私人卧室","The antique furniture stood in her ___.","私人卧室"],"quizzically":["疑惑地","The visitor looked ___ at the unusual exhibit.","疑惑地"],"marzipan":["杏仁糖膏","The baker decorated the cake with ___.","杏仁糖膏"],"altarpiece":["祭坛画","The museum restored a medieval ___.","祭坛画"],"cannibalism":["同类相食","The zoologist discussed ___ among certain species.","同类相食"],"cytological":["细胞学的","The laboratory prepared a ___ examination.","细胞学"],"supremacist":["鼓吹群体至上者","The report examined the activities of a ___ group.","群体至上"],"sarcophagus":["石棺","The archaeologists opened an ancient ___.","石棺"],"flamingo":["火烈鸟","A pink ___ stood in the shallow lagoon.","火烈鸟"],"toga":["古罗马长袍","The actor wore a white ___ for the play.","古罗马长袍"],"jester":["宫廷弄臣","The court ___ entertained the king.","弄臣"],"marshland":["沼泽地","Migrating birds rested in the coastal ___.","沼泽地"],"profuse":["大量的；繁盛的","The garden produced ___ blossoms in spring.","繁盛"],"unworkable":["不可行的","The committee rejected the ___ proposal.","不可行"],"knighthood":["骑士阶层","The historian studied medieval ___.","骑士阶层"],"supranational":["超国家的","The treaty established a ___ authority.","超国家的"],"rearguard":["后卫部队","The ___ protected the retreating soldiers.","后卫"],"forewarn":["预先警告","The agency tried to ___ residents about the storm.","预先警告"],"chive":["细香葱","The chef added chopped ___ to the soup.","细香葱"],"quantitatively":["定量地","The scientists evaluated the results ___.","定量"],"iguana":["鬣蜥","An ___ basked on a warm rock.","鬣蜥"],"weeklong":["持续一周的","The university held a ___ workshop.","一周"],"decaf":["低咖啡因咖啡","She ordered a cup of ___ after dinner.","低咖啡因咖啡"],"enfold":["包裹","The mother used a blanket to ___ the infant.","包裹"],"incredulously":["难以置信地","He stared ___ at the unexpected result.","难以置信"],"interrelationship":["相互关系","The study examined the ___ between stress and sleep.","相互关系"],"heathland":["石南灌丛荒地","The conservation team restored the coastal ___.","石南荒地"],"sleepily":["睡眼惺忪地","The child answered ___ after waking.","睡意朦胧"],"unhindered":["不受阻碍的","The rescue team advanced ___ along the road.","不受阻碍"],"amoebic":["变形虫的","The scientist examined an ___ organism.","变形虫"],"climactic":["高潮的；决定性的","The film ended with a ___ confrontation.","高潮的"],"retriever":["寻回犬","The golden ___ fetched the ball.","寻回犬"],"pinky":["小指","She wore a silver ring on her ___.","小指"],"tambourine":["铃鼓","The musician shook a ___ in rhythm.","铃鼓"],"southernmost":["最南端的","They visited the island's ___ village.","最南端"],"refectory":["修道院食堂","The monks gathered in the ___.","食堂"],"clime":["气候地带","The plant thrives in a warmer ___.","气候"],"typescript":["打字稿","The editor found an early ___ of the novel.","打字稿"],"draper":["布料商","The ___ sold fabric in the town market.","布料商"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial19",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch19.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH19_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
