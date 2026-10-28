#!/usr/bin/env python3
"""High-throughput 200-headword provisional editing queue, not certified Sense translations.
Every English definition is sourced to an exact OEWN sense; ECDICT Chinese stays WORD LEVEL.
Teaching prompts are generated definition-recognition templates, NOT original contextual cloze KU.
"""
import json,pathlib,gzip,re
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
sources=[json.loads(line) for line in (root/"next500_uncovered_source_cards.jsonl").open(encoding="utf8")]
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: words=json.load(f)["headwords"]
out=[];rejected=[]
for s in sources:
    lemma=s["lemma"];rank=s["rank"];zh=s["zh_wordlevel_unverified"].strip()
    reason=[]
    if not zh or len(zh)>24 or re.search(r"[\\[\\]()/;；、，,\\n]",zh):reason.append("CHINESE_POLYSEMY_OR_FORMAT")
    if len(lemma)<3 or any(ch.isdigit() for ch in lemma):reason.append("LEMMA_SHAPE")
    if not s["definition_en"] or len(s["definition_en"])<12:reason.append("SHORT_SOURCE")
    if reason:
        rejected.append({"rank":rank,"lemma":lemma,"reasons":reason})
        continue
    assert words[rank-1][1].casefold()==lemma
    out.append({"headword_id":f"core20k:rank:{rank}","rank":rank,"lemma":lemma,
       "oewn_sense_id":s["oewn_sense_id"],"definition_en_source":s["definition_en"],
       "zh_wordlevel_unverified":zh,"gloss_zh_editorial":None,
       "sense_status":"BILINGUAL_SENSE_ALIGNMENT_PENDING",
       "candidate_ku_id":f"staging:v21:definition-recall:{rank}:01",
       "ku_type":"sense_recognition","render_kind":"guided_definition_recognition",
       "question":f"Read the definition and identify the English word: {s['definition_en']}",
       "response_candidate":lemma,"question_origin":"TEMPLATE_FROM_OEWN_DEFINITION",
       "assessment_semantic_certified":False,"release_eligible":False,"production_ready":False})
    if len(out)==200:break
assert len(out)==200 and len({r["rank"] for r in out})==200
path=root/"next200_source_bound_sense_recognition_queue.jsonl"
path.write_text("".join(json.dumps(x,ensure_ascii=False)+"\\n" for x in out),encoding="utf8")
print("SOURCE_BOUND_NEXT200_PASS",json.dumps({"new_source_bound_wordheads":len(out),"templated_definition_recognition_drafts":len(out),"original_contextual_ku":0,"bilingual_sense_certified":0,"production_ready":0,"excluded_before_selection":len(rejected)}))
