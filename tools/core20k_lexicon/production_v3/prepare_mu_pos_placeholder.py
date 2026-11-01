import json,pathlib
B=pathlib.Path(__file__).resolve().parent
R=B/"qa_reports"
M=R/"mu-independent-audit-v20261101"
O=R/"cg_enlex_mu_pos_placeholder_v1"
O.mkdir(exist_ok=True)
P=[json.loads(t) for t in (M/"pos107_proposals.jsonl").read_text().splitlines()]
F=[json.loads(t) for t in (M/"patchF_placeholder_definitions96.jsonl").read_text().splitlines()]
assert len(P)==107 and len(F)==96
high=[x for x in P if x.get("confidence")=="high"]
low=[x for x in P if x.get("confidence")!="high"]
assert len(high)+len(low)==107
assert len({x["ku_id"] for x in P})==107
assert len({x["ku_id"] for x in F})==96
for n,a in [("pos_candidates.jsonl",high),("pos_manual_review.jsonl",low),("placeholder_queue.jsonl",F)]:
 (O/n).write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in a))
s={"pos_proposals":107,"high_confidence":len(high),"manual_review":len(low),"placeholder_definitions":96,"overlap":len({x["ku_id"] for x in P}&{x["ku_id"] for x in F}),"candidate_only":True,"runtime_modified":False}
(O/"summary.json").write_text(json.dumps(s,ensure_ascii=False,indent=2)+"\n")
print("MU POS SUMMARY",s)
