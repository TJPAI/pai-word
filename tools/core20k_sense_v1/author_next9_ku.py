#!/usr/bin/env python3
import json,pathlib
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
senses=[json.loads(x) for x in (root/"next13_bilingual_semantic_adjudication.jsonl").open(encoding="utf8")]
examples={"interesting":["The documentary was so ___ that everyone watched until the end.","有趣的；引人注意的"],"urbane":["The diplomat remained ___ and courteous throughout the reception.","温文尔雅的"],"surprised":["She looked ___ when her friends arrived unexpectedly.","感到惊讶的"],"heartbroken":["He was ___ after hearing that his lifelong friend had died.","悲痛欲绝的"],"recyclable":["This packaging is ___ and can be processed into new materials.","可回收再利用的"],"metaphoric":["The phrase 'a sea of troubles' uses ___ language.","隐喻的"],"operationally":["The two factories are ___ independent, despite common ownership.","在运营方面"],"detachable":["The camera has a ___ lens that can be removed easily.","可拆卸的"],"sociocultural":["The study examines ___ influences on language learning.","社会文化的"]}
good={r["lemma"]:r for r in senses if r["decision"]=="EDITORIAL_DRAFT"}
assert set(good)==set(examples) and len(good)==9
rows=[]
for lemma,(prompt,zh) in examples.items():
 s=good[lemma]
 assert s["editorial_gloss_zh"] and prompt.count("___")==1
 rows.append({"draft_ku_id":f"staging:v21:next:{s['rank']}:context01",
 "headword_id":f"core20k:rank:{s['rank']}","rank":s["rank"],"lemma":lemma,
 "external_sense_id":s["oewn_sense_id"],"canonical_sense_id":None,
 "render_kind":"guided_cloze","question_instruction_zh":f"填写符合“{zh}”这一义项的英文词。",
 "prompt":prompt,"correct_answer":lemma,"acceptable_answers":[lemma],
 "context_en":prompt.replace("___",lemma),"gloss_en":s["gloss_en"],
 "gloss_zh":s["editorial_gloss_zh"],"review_status":"NEW_KU_CONTEXT_DRAFT_PENDING_INDEPENDENT_QA",
 "production_ready":False,"release_eligible":False})
assert len(rows)==len({r["draft_ku_id"] for r in rows})==9
(root/"next9_editorial_context_ku.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf8")
print("NEXT9_NEW_CONTEXT_KU_PASS",json.dumps({"new_lexical_headwords":9,"new_ku_drafts":9,"production_ready":0}))
