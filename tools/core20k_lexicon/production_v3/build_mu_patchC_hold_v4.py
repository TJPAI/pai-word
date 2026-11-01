import json,pathlib,hashlib,collections
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_patchC_hold_v4";O.mkdir(exist_ok=True)
src=R/"cg_enlex_mu_integrated_v1"/"integrated_review_pack.jsonl"
assert hashlib.sha256(src.read_bytes()).hexdigest()=="fd7bc495220a950235111146426d5760cd15fd3f16e761ada50bd63d23385cfc"
actions=[json.loads(t) for t in (R/"cg_enlex_mu_patchC_actions_v3"/"action_queue.jsonl").read_text().splitlines()]
assert len(actions)==77
lookup={x["ku_id"]:x for x in actions};assert len(lookup)==77
rows=[];seen=set();cases=[]
for line in src.open(encoding="utf8"):
 x=json.loads(line);k=x["ku_id"]
 if k in lookup:
  a=lookup[k]
  assert x["rank"]==a["rank"] and x["lemma"]==a["lemma"] and x["teaching_sense_id"]==a["teaching_sense_id"]
  x["single_answer_quiz_enabled"]=False
  x["single_answer_verified"]=False;x["release_eligible"]=False;x["production_ready"]=False
  x["editorial_review_needed"]=True;x["patchC_hold_reason"]=a["reason_code"]
  if a["reason_code"]=="SOURCE_SEMANTIC_MISMATCH":
   cases.append({"ku_id":k,"lemma":x["lemma"],"rank":x["rank"],"gloss_en":x["gloss_en"],"gloss_zh":x["gloss_zh"],"suggested_sense_lemma":a["sense_lemma"],"proposed_action":"REMOVE_WRONG_SENSE_ASSOCIATION_PENDING_SOURCE_RECHECK"})
  seen.add(k)
 rows.append(x)
assert len(rows)==27471 and len(seen)==77
for name,data in (("review_pack_patchC_hold.jsonl",rows),("semantic_mismatch_priority.jsonl",cases)):
 with (O/name).open("w") as f:
  for x in data:f.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"total":27471,"held_patchC":len(seen),"priority_semantic_mismatch":len(cases),"enabled_single_answer_among_patchC":0,"runtime_modified":False,"base_modified":False,"release_ready":False,"sha256":hashlib.sha256((O/"review_pack_patchC_hold.jsonl").read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n")
print("PATCHC HOLD",summary)
