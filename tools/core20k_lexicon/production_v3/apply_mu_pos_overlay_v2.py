import json,pathlib,hashlib
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_pos_overlay_v2";O.mkdir(exist_ok=True)
src=R/"active_recall_unified_review_pack_v1"/"review_pack.jsonl"
assert hashlib.sha256(src.read_bytes()).hexdigest()=="e9b9c158a5563ff6396be66d0993a5a0cd9ef6379c433cf2fd4d578862a68fac"
base={x["ku_id"]:x for x in (json.loads(t) for t in src.read_text().splitlines())}
P=[json.loads(t) for t in (R/"cg_enlex_mu_pos_placeholder_v1"/"pos_candidates.jsonl").read_text().splitlines()]
assert len(P)==101
fixed=[];blocked=[]
for p in P:
 x=base.get(p["ku_id"])
 if x is None or x.get("pos") or any(x.get(f)!=p.get(f) for f in ("rank","lemma","gloss_zh","gloss_en")) or not p.get("proposed_pos"):
  blocked.append({"ku_id":p["ku_id"],"reason":"precondition_failed"});continue
 y=dict(x);y["pos"]=p["proposed_pos"];y["editorial_review_needed"]=True;y["production_ready"]=False;y["release_eligible"]=False;y["mu_pos_overlay"]=True
 assert (y["ku_id"],y["teaching_sense_id"],y["response"])==(x["ku_id"],x["teaching_sense_id"],x["response"])
 fixed.append(y)
for name,data in (("candidate_overlay.jsonl",fixed),("blocked.jsonl",blocked)):
 with (O/name).open("w") as f:
  for x in data:f.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"input":len(P),"applied_candidates":len(fixed),"blocked":len(blocked),"source_modified":False,"runtime_modified":False,"candidate_only":True}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("POS OVERLAY",summary)
