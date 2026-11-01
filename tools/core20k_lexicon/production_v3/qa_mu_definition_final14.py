import pathlib,json,collections
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_definition_candidates_v3"
q=[json.loads(x) for x in (R/"cg_enlex_mu_definition_candidates_v2"/"deferred.jsonl").read_text().splitlines()]
triage=json.loads((O/"lexical_triage.json").read_text())
assert len(q)==14 and set(triage)=={x["lemma"] for x in q}
items=[{"ku_id":x["ku_id"],"lemma":x["lemma"],"status":triage[x["lemma"]][0],"reason":triage[x["lemma"]][1],"auto_publish":False} for x in q]
(O/"review_queue.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in items))
counts=dict(collections.Counter(x["status"] for x in items))
summary={"reviewed":14,"proposed_definitions":0,"requires_lexical_decision":14,"class_counts":counts,"runtime_modified":False,"existing_pack_modified":False}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("FINAL14",summary)
