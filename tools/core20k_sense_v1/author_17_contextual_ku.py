#!/usr/bin/env python3
"""Produce 17 new original contextual cloze draft KUs from manually authored English example sentences.
Draft KU ids are isolated, no formal Sense IDs forged.
"""
import gzip,json,pathlib,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
source=[json.loads(l) for l in (root/"bilingual_editorial_pilot.jsonl").open(encoding="utf8")]
examples={"january":"Our classes begin in ___ after the winter break.","february":"The conference takes place in ___, the second month of the year.","april":"The project starts in ___, between March and May.","june":"The summer course begins in ___, after May.","september":"The autumn semester starts in ___.","october":"Halloween is celebrated in ___.","november":"The meeting is in ___, the month before December.","december":"The year ends in ___.","monday":"The office reopens on ___ after Sunday.","sunday":"Many families rest on ___, the day after Saturday.","digitization":"The ___ of paper records made searching them easier.","questioner":"The ___ asked a follow-up question during the interview.","discussant":"The ___ contributed to the panel discussion.","roomful":"A ___ of students listened to the lecture.","humanize":"The new policy aims to ___ the treatment of patients.","experienced":"We hired an ___ engineer with ten years of practice.","informer":"The police received information from an anonymous ___."}
assert len(source)==len(examples)==17
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:words=json.load(f)["headwords"]
byrank={r[0]:r for r in words}
out=[]
for r in source:
 rank=r["rank"];lemma=r["lemma"];w=byrank[rank]
 assert w[1].casefold()==lemma
 prompt=examples[lemma]
 assert prompt.count("___")==1
 answer=lemma
 x={"draft_ku_id":f"staging:v21:missing:{rank}:context01","headword_id":r["headword_id"],"rank":rank,
 "lemma":lemma,"external_sense_id":r["oewn_sense_id"],"canonical_sense_id":None,
 "ku_type":"sense","render_kind":"guided_cloze","prompt":prompt,
 "correct_answer":answer,"acceptable_answers":[answer],
 "context_en":prompt.replace("___",answer),
 "gloss_zh":r["gloss_zh_editorial"],"gloss_en":r["gloss_en"],
 "explanation_zh":r["explanation_zh"],"source_attribution":r["evidence"],
 "review_status":"NEW_EDITORIAL_EXAMPLE_PENDING_INDEPENDENT_QA",
 "release_eligible":False,"production_ready":False}
 out.append(x)
assert len({r["draft_ku_id"] for r in out})==17
(root/"bilingual_editorial_17_contextual_ku.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("NEW_CONTEXTUAL_KU17_QA_PASS",json.dumps({"new_contextual_drafts":len(out),"frozen_identity_verified":len(out),"production_ready":0}))
