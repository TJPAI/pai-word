import json,pathlib,collections
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_patchC_resolution_v2";O.mkdir(exist_ok=True)
p=R/"cg_enlex_mu_patchC_v1"/"fix_mapping_candidates.jsonl"
items=[json.loads(t) for t in p.read_text().splitlines()]
assert len(items)==77
records={x["ku_id"]:x for x in (json.loads(t) for t in (R/"cg_enlex_mu_integrated_v1"/"integrated_review_pack.jsonl").read_text().splitlines())}
out=[];blocked=[]
for x in items:
 old=records.get(x["ku_id"])
 if not old or old["rank"]!=x["rank"] or old["lemma"]!=x["lemma_current"] or old["response"]!=x["response_current"]:
  blocked.append({"ku_id":x["ku_id"],"reason":"source_mapping_drift"});continue
 note=x["note"].lower()
 category="inflection_or_form" if any(word in note for word in ("屈折","过去式","过去分词","比较级","原形","词形")) else "semantic_headword_mismatch"
 out.append({"ku_id":x["ku_id"],"teaching_sense_id":x["teaching_sense_id"],"rank":x["rank"],"original_lemma":old["lemma"],"suggested_sense_lemma":x["lemma_proposed"],"classification":category,"action":"HOLD_SINGLE_ANSWER_AND_REMAP_REVIEW","single_answer_quiz_enabled":False,"runtime_modified":False,"preserve_original_identity":True})
for name,rows in (("resolution_queue.jsonl",out),("blocked.jsonl",blocked)):
 (O/name).write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows))
cnt=dict(collections.Counter(x["classification"] for x in out))
summary={"input":77,"classified":len(out),"blocked":len(blocked),"classes":cnt,"runtime_modified":False,"rank_changed":False,"candidate_only":True}
assert len(out)+len(blocked)==77
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("PATCHC RESOLUTION",summary)
