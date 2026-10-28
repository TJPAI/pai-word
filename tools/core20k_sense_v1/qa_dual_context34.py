#!/usr/bin/env python3
"""QA both independent contextual exercises for 17 first bilingual editorial Sense drafts."""
import json,pathlib,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
read=lambda p:[json.loads(x) for x in (root/p).open(encoding="utf8")]
a=read("bilingual_editorial_17_contextual_ku.jsonl")
b=read("bilingual_editorial_17_second_context_ku.jsonl")
assert len(a)==len(b)==17
pairs=collections.defaultdict(list);ids=set()
for r in a+b:
 assert r["draft_ku_id"] not in ids;ids.add(r["draft_ku_id"])
 assert r["prompt"].count("___")==1
 assert r["correct_answer"]==r["lemma"]
 assert r["context_en"]==r["prompt"].replace("___",r["lemma"])
 assert not r["release_eligible"] and not r["production_ready"]
 pairs[r["rank"]].append(r)
for rank,items in pairs.items():
 assert len(items)==2
 assert items[0]["lemma"]==items[1]["lemma"]
 assert items[0]["external_sense_id"]==items[1]["external_sense_id"]
 assert items[0]["prompt"]!=items[1]["prompt"]
 assert items[0]["gloss_zh"]==items[1]["gloss_zh"]
 assert items[0]["gloss_en"]==items[1]["gloss_en"]
print("CONTEXTUAL34_DUAL_QUESTION_QA_PASS",json.dumps({"headwords":17,"draft_kus":len(ids),"independent_signoff":0}))
