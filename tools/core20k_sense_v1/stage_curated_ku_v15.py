#!/usr/bin/env python3
"""Small curated bilingual KU pilot: ground every new draft in a unique *actual* source Sense.
Ambiguous/missing Sense matches remain quarantined; no Production promotion.
"""
import collections, json, pathlib, re, time
start=time.monotonic()
# Each entry is an independently authored, specific contextual usage, NOT a paraphrase of a dictionary definition.
# Gloss cues are conservative; a unique source gloss must match to create a draft.
CURATED=[
 ("charge","accus", "The prosecutor charged him with fraud.","检察官指控他犯有欺诈罪。","指控；控告","charged"),
 ("charge","electric", "Remember to charge the battery before the trip.","出发前记得给电池充电。","给……充电","charge"),
 ("model","represent", "The researchers built a model to predict rainfall.","研究人员构建了一个预测降雨的模型。","模型；用于描述或预测的表示","model"),
 ("draft","preliminar", "She sent the first draft of the proposal yesterday.","她昨天发出了提案初稿。","草稿；初稿","draft"),
 ("launch","begin", "The company will launch its new service in June.","该公司将在六月推出新服务。","推出；启动","launch"),
 ("issue","problem", "We should fix this issue before releasing the app.","我们应在发布应用前解决这个问题。","问题；待解决的事项","issue"),
 ("scale","size", "The scale of the project surprised the team.","项目的规模令团队惊讶。","规模；大小","scale"),
 ("network","connect", "A reliable network connects all the sensors.","可靠的网络连接所有传感器。","网络；互联系统","network"),
]
roots=list(pathlib.Path(".").rglob("batch001.jsonl"))
# Batch names are inherited from immutable upstream full-source artifacts.
roots=[p for p in roots if p.parent.name=="oewn-full20k-staging"]
assert len(roots)==1, f"Expected unique source batch, found {len(roots)}"
base=roots[0].parent
wanted={x[0] for x in CURATED}
senses=collections.defaultdict(list)
for p in sorted(base.glob("batch[0-9][0-9][0-9].jsonl")):
 for line in p.open(encoding="utf8"):
  word=json.loads(line)
  if word["lemma"].casefold() in wanted:
   for s in word["senses"]:
    senses[word["lemma"].casefold()].append((word,s))
drafts=[];review=[]
for lemma,cue,example,zh_example,zh_gloss,answer in CURATED:
 hits=[(w,s) for w,s in senses.get(lemma,[]) if cue in s.get("definition_en_source","").casefold()]
 if len(hits)!=1:
  review.append({"lemma":lemma,"cue":cue,"candidate_matches":len(hits),"reason":"SOURCE_SENSE_MATCH_NOT_UNIQUE"})
  continue
 w,s=hits[0]
 assert example.count(answer)==1, (lemma,answer)
 question=example.replace(answer,"____",1)
 assert question.count("____")==1 and len(question)>=20
 sid=s["external_sense_id"];rank=w["rank"]
 drafts.append({"rank":rank,"lemma":lemma,"headword_id":w.get("headword_id"),
  "external_sense_id":sid,"sense_id":s.get("sense_id"),
  "draft_ku_id":f"staging:curated-v15:{rank}:{sid}:{cue}",
  "ku_type":"cloze","render_kind":"cloze","question":question,"response":answer,
  "original_example_en":example,"example_zh":zh_example,"gloss_zh_draft":zh_gloss,
  "definition_en_source":s["definition_en_source"],
  "authorship":"EDITORIALLY_AUTHORED_ORIGINAL_SENTENCE","selection":"REVIEW",
  "qa_status":"STRUCTURAL_PASS_SEMANTIC_REVIEW_REQUIRED","production_ready":False,
  "semantic_certified":False})
out=base/"curated_ku_v15_staging.jsonl"
out.write_text("".join(json.dumps(v,ensure_ascii=False)+"\n" for v in drafts),encoding="utf8")
(base/"curated_ku_v15_review.jsonl").write_text("".join(json.dumps(v,ensure_ascii=False)+"\n" for v in review),encoding="utf8")
report={"curated_attempted":len(CURATED),"actual_source_sense_matched":len(drafts),
 "original_context_ku_drafts":len(drafts),"unresolved":len(review),
 "structural_pass":len(drafts),"semantically_certified":0,"production_ready":0,
 "elapsed_seconds":round(time.monotonic()-start,3)}
(base/"curated_ku_v15_manifest.json").write_text(json.dumps(report,indent=2)+"\n")
print("CURATED_KU_V15",json.dumps(report))
