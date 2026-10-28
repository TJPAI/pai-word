#!/usr/bin/env python3
import json,pathlib,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
src=[json.loads(x) for x in (root/"next100_lexical_sense_ku_candidates.jsonl").open(encoding="utf8")]
decisions={"an":["REJECT","英文为护理副学士学位简称，中文却为不定冠词"],"eta":["REJECT","OEWN为希腊字母η，中文却为预计到达时间"],"judgmental":["BLOCK","词典中文审判的与当前英文义项不充分对应"],"evaluative":["BLOCK","可估价的过窄，英文指评估性的"],"interesting":["EDITORIAL_DRAFT","有趣的；引人注意的"],"urbane":["EDITORIAL_DRAFT","温文尔雅的；世故而有礼的"],"surprised":["EDITORIAL_DRAFT","感到惊讶的"],"heartbroken":["EDITORIAL_DRAFT","悲痛欲绝的；心碎的"],"recyclable":["EDITORIAL_DRAFT","可回收再利用的"],"metaphoric":["EDITORIAL_DRAFT","隐喻的；比喻性的"],"operationally":["EDITORIAL_DRAFT","在操作或运行方面"],"detachable":["EDITORIAL_DRAFT","可拆卸的"],"sociocultural":["EDITORIAL_DRAFT","社会文化的"]}
assert len(src)==len(decisions)==13
counts=collections.Counter();out=[]
for s in src:
 status,note=decisions[s["lemma"]]
 r={"rank":s["rank"],"lemma":s["lemma"],"oewn_sense_id":s["external_sense_id"],
    "gloss_en":s["gloss_en"],"original_ecdict_zh":s["zh_wordlevel_candidate"],
    "decision":status,"reason_or_gloss_zh":note if status!="EDITORIAL_DRAFT" else None,
    "editorial_gloss_zh":note if status=="EDITORIAL_DRAFT" else None,
    "independent_semantic_certified":False,"release_eligible":False,"production_ready":False}
 out.append(r);counts[status]+=1
assert counts["REJECT"]==2 and counts["BLOCK"]==2 and counts["EDITORIAL_DRAFT"]==9
(root/"next13_bilingual_semantic_adjudication.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
print("NEXT13_SEMANTIC_ADJUDICATION_PASS",json.dumps(dict(counts),ensure_ascii=False))
