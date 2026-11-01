import json,pathlib,hashlib,collections
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_integrated_v1";O.mkdir(exist_ok=True)
basepath=R/"active_recall_unified_review_pack_v1"/"review_pack.jsonl"
assert hashlib.sha256(basepath.read_bytes()).hexdigest()=="e9b9c158a5563ff6396be66d0993a5a0cd9ef6379c433cf2fd4d578862a68fac"
base={x["ku_id"]:x for x in (json.loads(t) for t in basepath.read_text().splitlines())}
assert len(base)==27471
sources=[
 ("patchA","cg_enlex_mu_patchA_v1","candidate_overlay.jsonl",["gloss_zh"]),
 ("pos","cg_enlex_mu_pos_overlay_v2","candidate_overlay.jsonl",["pos"]),
 ("definition_v1","cg_enlex_mu_definition_candidates_v1","definition_overlay.jsonl",["gloss_en"]),
 ("definition_v2","cg_enlex_mu_definition_candidates_v2","definition_candidates.jsonl",["gloss_en","gloss_zh"])]
changes={};collisions=[];counts=collections.Counter()
for label,folder,file,fields in sources:
 seen=set()
 for line in (R/folder/file).read_text().splitlines():
  x=json.loads(line);k=x["ku_id"]
  assert k in base and k not in seen,(label,k)
  seen.add(k)
  for key in ("teaching_sense_id","rank","lemma","response","answer_variants"):
   assert x.get(key)==base[k].get(key),(label,k,key)
  for field in fields:
   if x.get(field)==base[k].get(field):continue
   changes.setdefault(k,{})
   if field in changes[k] and changes[k][field][0]!=x[field]:
    collisions.append({"ku_id":k,"field":field,"previous":changes[k][field],"next":[x[field],label]})
   else:changes[k][field]=(x[field],label);counts[label]+=1
assert not collisions,collisions[:3]
full=[];touched=[]
for k,x in base.items():
 y=dict(x)
 if k in changes:
  for field,(value,label) in changes[k].items():y[field]=value
  # The original prompt may carry old Chinese meaning, English clues, or stale POS.
  # Never allow an outdated prompt into a published quiz.
  if any(f in changes[k] for f in ("gloss_zh","gloss_en","pos")):
   y["question_requires_rebuild"]=True
   y["single_answer_quiz_enabled"]=False
  y["editorial_review_needed"]=True
  touched.append(k)
 y["production_ready"]=False;y["release_eligible"]=False;y["single_answer_verified"]=False
 full.append(y)
assert len(full)==27471 and len({x["ku_id"] for x in full})==27471
for name,data in (("integrated_review_pack.jsonl",full),("conflicts.jsonl",collisions)):
 with (O/name).open("w") as f:
  for x in data:f.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"total":27471,"changed_unique_ku":len(touched),"field_edits_by_source":dict(counts),"conflicts":len(collisions),"questions_disabled_pending_rebuild":sum(x.get("question_requires_rebuild",False) for x in full),"production_ready":0,"baseline_modified":False,"runtime_modified":False,"sha256":hashlib.sha256((O/"integrated_review_pack.jsonl").read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("INTEGRATED",json.dumps(summary))
