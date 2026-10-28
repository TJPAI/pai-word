#!/usr/bin/env python3
import json,gzip,pathlib,collections
base=pathlib.Path("tools/core20k_sense_v1/editorial")
rows=[json.loads(x) for x in (base/"v21_grammar7_editorial_revision.jsonl").open(encoding="utf8")]
src=[json.loads(x) for x in pathlib.Path("tools/core20k_lexicon/runtime/v1/batch79_seven_grammar_complete_staging.jsonl").open()]
assert len(rows)==len(src)==7
indexed={r["ku_id"]:r for r in src}
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: headwords=json.load(f)["headwords"]
by_lemma={w[1]:w[0] for w in headwords}
for r in rows:
 old=indexed[r["ku_id"]]
 assert r["lemma"]==old["headword"]
 assert r["correct_answer"] in r["acceptable_answers"] and r["explanation_zh"]
 assert not r["production_ready"] and not r["release_eligible"]
 rank=by_lemma[r["lemma"]]
 if r["frozen_rank"] is not None:assert r["frozen_rank"]==rank
 r["frozen_rank"]=rank
 r["headword_id"]=f"core20k:rank:{rank}"
 # Non-cloze explicit questions use a different render type.
 r["render_kind"]="cloze" if r["question"].count("___")==1 else "short_answer"
 assert r["render_kind"] in ("cloze","short_answer")
out=base/"v21_grammar7_qa_review_ready.jsonl"
out.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf8")
print("GRAMMAR7_EDITORIAL_QA_PASS",json.dumps({"revised_records":len(rows),"identity_verified":len(rows),"independent_semantic_certified":0,"production_ready":0}))
