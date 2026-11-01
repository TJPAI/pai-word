import json,pathlib
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports"
O=R/"cg_enlex_mu_definition_candidates_v2"
defs=json.loads((O/"curated_12.json").read_text())
queue=[json.loads(t) for t in (R/"cg_enlex_mu_definition_candidates_v1"/"deferred_review.jsonl").read_text().splitlines()]
base={x["ku_id"]:x for x in (json.loads(t) for t in (R/"active_recall_unified_review_pack_v1"/"review_pack.jsonl").read_text().splitlines())}
assert len(queue)==26
out=[];deferred=[]
for p in queue:
 x=base[p["ku_id"]];lemma=x["lemma"]
 if lemma not in defs:
  deferred.append({"ku_id":p["ku_id"],"lemma":lemma,"reason":"orthography_or_sense_requires_review"});continue
 en,zh=defs[lemma]
 assert x["gloss_en"].startswith("core modern learner use of")
 y=dict(x);y["gloss_en"]=en
 if zh:y["gloss_zh"]=zh
 y["question_requires_rebuild"]=True
 y["production_ready"]=False;y["release_eligible"]=False
 y["editorial_review_needed"]=True;y["semantic_certified"]=False
 out.append(y)
assert len(out)==12 and len(deferred)==14
for name,rows in (("definition_candidates.jsonl",out),("deferred.jsonl",deferred)):
 (O/name).write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows))
summary={"second_round_candidates":len(out),"remaining":len(deferred),"total_first_and_second_round":82,"runtime_modified":False,"candidate_only":True,"question_regeneration_required":True}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("V2",summary)
