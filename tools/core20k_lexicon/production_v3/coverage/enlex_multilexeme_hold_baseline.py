#!/usr/bin/env python3
"""Persist 201 original multi-lexeme source cards as an immutable HOLD baseline.
These are source records, NOT reviewed/approved glosses.
"""
import json,hashlib,pathlib,sys,collections
src=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
cards=[json.loads(s) for s in src.read_text(encoding="utf8").splitlines() if s.strip()]
assert len(cards)==400 and len({x["teaching_sense_id"] for x in cards})==400
multi=cards[199:]
assert len(multi)==201
assert all(x["candidate_zh"] is None for x in multi)
rows=[]
for x in multi:
 rows.append({"teaching_sense_id":x["teaching_sense_id"],"rank":x["rank"],"lemma":x["lemma"],"synset_id":x["synset_id"],
 "definition_en":x["definition_en"],"original_chinese_lexicalizations":x["source_lexemes"],
 "editorial_disposition":"HOLD_SOURCE_ONLY","selected_gloss_zh":None,
 "reason":"Multiple OMW lexicalizations require verified sense-specific Chinese selection",
 "source_run":41168168670,"semantic_reviewed":False,"independent_certified":False,"production_ready":False})
dest=out/"source_hold_201.jsonl"
dest.write_text("".join(json.dumps(x,ensure_ascii=False)+chr(10) for x in rows),encoding="utf8")
report={"source_cards":400,"source_hold":201,"unique":len(set(x["teaching_sense_id"] for x in rows)),
 "reviewed":0,"production_ready":0,"sha256":hashlib.sha256(dest.read_bytes()).hexdigest()}
(out/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+chr(10))
print(json.dumps(report,ensure_ascii=False))
