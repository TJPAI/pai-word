#!/usr/bin/env python3
"""Fast-lane 201 multi-lexeme source triage. No unsupported semantic approval.
Splits candidates into auditable lexical alternatives and risk tiers in one pass.
"""
import json,pathlib,hashlib,collections,re
root=pathlib.Path("tools/core20k_lexicon/production_v3/coverage")
src=root/"omw_multi201_source_hold/source_hold_201.jsonl"
rows=[json.loads(x) for x in src.read_text(encoding="utf-8").splitlines()]
assert len(rows)==201 and len({x["teaching_sense_id"] for x in rows})==201
out=root/"multi201_fastlane_output";out.mkdir(parents=True,exist_ok=True)
counts=collections.Counter();records=[]
for r in rows:
 zh=r["original_chinese_lexicalizations"]
 assert len(zh)>1
 valid=[x for x in zh if re.search("[\u3400-\u9fff]",x) and not re.search(r"[+*/=<>|{}@A-Za-z0-9]",x) and len(x)<=12]
 invalid=[x for x in zh if x not in valid]
 # Same-source alternatives are evidence candidates, not independent corroboration.
 if invalid: lane="FORMAT_REPAIR"
 elif len(set(valid))>5:lane="HIGH_AMBIGUITY"
 else:lane="SENSE_DISAMBIGUATION"
 counts[lane]+=1
 records.append({"teaching_sense_id":r["teaching_sense_id"],"rank":r["rank"],"lemma":r["lemma"],"synset_id":r["synset_id"],"definition_en":r["definition_en"],"lexical_options":valid,"invalid_options":invalid,"lane":lane,"review_status":"AI_SEMANTIC_DISAMBIGUATION_REQUIRED","gloss_zh":None,"independent_certified":False,"production_ready":False})
for lane in ("SENSE_DISAMBIGUATION","HIGH_AMBIGUITY","FORMAT_REPAIR"):
 target=out/(lane.lower()+".jsonl")
 target.write_text("".join(json.dumps(x,ensure_ascii=False)+chr(10) for x in records if x["lane"]==lane),encoding="utf-8")
manifest={"source_records":201,"unique_ids":201,"lanes":dict(counts),"automated_semantic_approvals":0,"independent_certified":0,"production_ready":0,"output_files":{p.name:{"rows":sum(1 for _ in p.open()),"sha256":hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.glob("*.jsonl")}}
(out/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+chr(10),encoding="utf-8")
print(json.dumps(manifest,ensure_ascii=False))
