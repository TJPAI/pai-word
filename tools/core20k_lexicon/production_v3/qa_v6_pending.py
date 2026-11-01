import json,pathlib,hashlib
base=pathlib.Path(__file__).resolve().parent/"qa_reports"
source=base/"active_recall_revised_v5"/"manual_review.jsonl"
target=base/"active_recall_v6_review"
target.mkdir(parents=True,exist_ok=True)
rows=[json.loads(t) for t in source.read_text().splitlines()]
assert len(rows)==135
items=[]
for row in rows:
 items.append({"ku_id":row["ku_id"],"lemma":row["lemma"],"source_gloss_en":row["gloss_en"],"status":"not_unique_answer_ready","recommended_mode":"recognition_only_until_context_verified","reason":row["reason"]})
with (target/"priority_review.jsonl").open("w") as file:
 for item in items:file.write(json.dumps(item,ensure_ascii=False)+"\n")
summary={"reviewed":135,"unique_ku_ids":len({x["ku_id"] for x in items}),"single_answer_eligible":0,"requires_contextual_rewrite":135,"original_modified":False,"runtime_modified":False}
assert summary["unique_ku_ids"]==135
(target/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("V6",json.dumps(summary,ensure_ascii=False))
