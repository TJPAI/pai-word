#!/usr/bin/env python3
"""Produce 500 distinct active-recall KU candidates from 500 verified existing Senses.
No translation invention, no legacy modifications, 10 independently addressable shards.
"""
import pathlib,json,collections,hashlib
B=pathlib.Path(__file__).resolve().parent
O=B/"ku_drafts"/"v3_active_recall";O.mkdir(exist_ok=True)
rows={}
for p in sorted((B/"ku_drafts"/"v2").glob("ku_recognition_*.jsonl")):
 for line in p.open(encoding="utf8"):
  if not line.strip():continue
  x=json.loads(line)
  sid=x.get("teaching_sense_id");zh=x.get("gloss_zh");en=x.get("gloss_en");lemma=x.get("lemma")
  if not (sid and zh and en and lemma and x.get("response")==lemma and x.get("rank")):continue
  if sid not in rows:rows[sid]=x
picked=sorted(rows.values(),key=lambda a:(int(a["rank"]),a["teaching_sense_id"]))[21500:25500]
assert len(picked)==4000
manifest=[]
for part in range(80):
 group=picked[part*50:(part+1)*50]
 assert len(group)==50
 out=[]
 for x in group:
  sid=x["teaching_sense_id"]
  out.append({"ku_id":"staging:cg-enlex-active-recall-v1:"+sid+":zh_to_en:01","teaching_sense_id":sid,"rank":x["rank"],"lemma":x["lemma"],"pos":x.get("pos"),"ku_type":"zh_to_en_active_recall","render_kind":"text_input","question":"请根据中文释义写出对应的英语词（词性："+str(x.get("pos") or "待核查")+"）："+x["gloss_zh"],"response":x["lemma"],"answer_variants":[x["lemma"]],"gloss_zh":x["gloss_zh"],"gloss_en":x["gloss_en"],"pos_review_needed":not bool(x.get("pos")),"source_ku_id":x["ku_id"],"draft":True,"production_ready":False,"release_eligible":False})
 name=f"active_recall_{part+431:03d}.jsonl"
 text="".join(json.dumps(v,ensure_ascii=False)+"\n" for v in out)
 (O/name).write_text(text,encoding="utf8")
 manifest.append({"file":name,"rows":50,"sha256":hashlib.sha256(text.encode()).hexdigest()})
assert len({x["teaching_sense_id"] for x in picked})==4000
(O/"manifest_431_510.json").write_text(json.dumps({"new_distinct_ku_ids":4000,"group_count":80,"records_per_group":50,"question_type":"zh_to_en_active_recall","manifest":manifest,"source_modified":False,"runtime_modified":False},ensure_ascii=False,indent=2)+"\n")
print("ACTIVE_RECALL_CREATED NEXT 4000 in 8x10x50")
