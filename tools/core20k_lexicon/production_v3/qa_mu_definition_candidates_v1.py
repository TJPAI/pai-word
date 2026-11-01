import json,pathlib,hashlib
B=pathlib.Path(__file__).resolve().parent
R=B/"qa_reports"
O=R/"cg_enlex_mu_definition_candidates_v1"
defs=json.loads((O/"curated_definitions.json").read_text())
src=R/"active_recall_unified_review_pack_v1"/"review_pack.jsonl"
assert hashlib.sha256(src.read_bytes()).hexdigest()=="e9b9c158a5563ff6396be66d0993a5a0cd9ef6379c433cf2fd4d578862a68fac"
base={x["ku_id"]:x for x in (json.loads(s) for s in src.read_text().splitlines())}
patches=[json.loads(s) for s in (R/"mu-independent-audit-v20261101"/"patchF_placeholder_definitions96.jsonl").read_text().splitlines()]
assert len(patches)==96
used=set();generated=[];hold=[];errors=[]
for p in patches:
 k=p["ku_id"];x=base.get(k)
 if not x or x["lemma"]!=p["lemma"] or x["gloss_zh"]!=p["gloss_zh"] or x["gloss_en"]!=p["gloss_en"]:
  errors.append({"ku_id":k,"reason":"source_drift"});continue
 lemma=p["lemma"]
 if lemma not in defs:
  hold.append({"ku_id":k,"lemma":lemma,"reason":"requires_independent_semantic_review"});continue
 d=defs[lemma]
 if lemma in used or not d or d.startswith("core modern learner use"):
  errors.append({"ku_id":k,"reason":"duplicate_or_bad_definition"});continue
 used.add(lemma)
 y=dict(x);y["gloss_en"]=d;y["mu_definition_candidate"]=True
 y["editorial_review_needed"]=True;y["production_ready"]=False;y["release_eligible"]=False
 y["single_answer_verified"]=False
 generated.append(y)
for name,rows in (("definition_overlay.jsonl",generated),("deferred_review.jsonl",hold),("blocked.jsonl",errors)):
 with (O/name).open("w") as f:
  for row in rows:f.write(json.dumps(row,ensure_ascii=False)+"\n")
summary={"patchF_input":96,"candidate_definitions":len(generated),"deferred":len(hold),"blocked":len(errors),"all_candidate_only":True,"runtime_modified":False,"baseline_modified":False}
assert len(generated)+len(hold)+len(errors)==96
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("DEFINITION CANDIDATES",summary)
