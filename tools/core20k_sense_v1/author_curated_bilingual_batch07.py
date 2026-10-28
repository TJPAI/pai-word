#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"alphabetically":["按字母顺序地","The names were arranged ___.","按字母顺序地"],"reproducible":["可复现的","The experiment must produce ___ results.","可复现的"],"demographer":["人口学家","A ___ studied the aging population.","人口学家"],"citywide":["全市范围的","The mayor launched a ___ campaign.","全市范围的"],"antihistamine":["抗组胺药","The pharmacist suggested an ___ for allergies.","抗组胺药"],"lawfulness":["合法性","The court considered the ___ of the decision.","合法性"],"memorably":["令人难忘地","The singer performed ___.","令人难忘地"],"concretely":["具体地","Please explain ___ how this works.","具体地"],"layover":["中途停留","We had a short ___ in Seoul.","中途停留"],"authentically":["地道地","The chef prepared the dish ___.","地道地"],"sternly":["严厉地","She spoke ___ to the students.","严厉地"],"emoji":["表情符号","He sent a smiling ___.","表情符号"],"bathrobe":["浴袍","She wore a soft ___ after showering.","浴袍"],"courageously":["勇敢地","The rescue worker acted ___.","勇敢地"],"fashionably":["时髦地","The designer dressed ___.","时髦地"],"warily":["警惕地","The animal approached the river ___.","警惕地"],"prosodic":["韵律的","The study measured ___ speech features.","韵律的"],"forlorn":["凄凉的","The abandoned house looked ___.","凄凉的"],"duchy":["公国","The small ___ had its own ruler.","公国"],"burly":["魁梧的","A ___ guard stood near the gate.","魁梧的"],"undeclared":["未申报的","Customs found ___ goods.","未申报的"],"veranda":["走廊式阳台","We sat on the shaded ___.","走廊式阳台"],"seaport":["海港","The town developed into a busy ___.","海港"],"silky":["丝滑的","The scarf felt ___.","丝滑的"],"wistful":["惆怅的","She gave a ___ smile.","惆怅的"],"llama":["美洲驼","A ___ grazed in the field.","美洲驼"],"gaunt":["消瘦的","He looked ___ after the illness.","消瘦的"],"citadel":["城堡要塞","The ancient ___ stood above the city.","城堡要塞"],"grumpy":["脾气暴躁的","He felt ___ after the delay.","脾气暴躁的"],"copse":["小树林","They rested beside a small ___.","小树林"],"ravine":["深峡谷","The stream flowed through a steep ___.","深峡谷"],"intrepid":["无畏的","The ___ explorer reached the summit.","无畏的"],"terse":["简短生硬的","Her ___ reply ended the discussion.","简短生硬的"],"heinous":["极其恶劣的","The court condemned the ___ crime.","极其恶劣的"],"aghast":["惊骇的","The audience was ___.","惊骇的"],"tricycle":["三轮脚踏车","The child rode a ___.","三轮脚踏车"],"earshot":["听得见的范围","The discussion was beyond his ___.","听得见的范围"],"glade":["林中空地","Deer stood in the forest ___.","林中空地"],"averse":["不愿意的","She was ___ to unnecessary risk.","不愿意的"],"zealous":["热心的","A ___ volunteer led the project.","热心的"]}''')
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
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial07",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",lemma),
      "correct_answer":lemma,"acceptable_answers":[lemma],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch07.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH07_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
