import json,pathlib,hashlib
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_patchC_semantic_fix_v5"
d=json.loads((O/"decisions.json").read_text());assert len(d)==4
src=R/"cg_enlex_mu_patchC_hold_v4"/"semantic_mismatch_priority.jsonl"
q=[json.loads(x) for x in src.read_text().splitlines()]
assert len(q)==4
byrank={x["rank"]:x for x in q}
rows=[]
for x in d:
 z=byrank[x["rank"]];assert z["lemma"]==x["lemma"]
 rows.append({"ku_id":z["ku_id"],"teaching_sense_id":z["ku_id"].split("staging:cg-enlex-active-recall-v1:")[1].split(":zh_to_en:")[0],"rank":x["rank"],"lemma":x["lemma"],"action":x["action"],"reason":x["reason"],"replacement_policy":x["replacement_policy"],"old_link_disabled":True,"release_eligible":False,"keep_rank_lemma":True})
(O/"disabled_wrong_links.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows))
summary={"confirmed_wrong_links":4,"disabled_candidate_links":4,"replacement_senses_not_yet_attested":4,"runtime_modified":False}
(O/"summary.json").write_text(json.dumps(summary,indent=2)+"\n")
print(summary)
