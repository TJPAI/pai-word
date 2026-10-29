#!/usr/bin/env python3
import json,pathlib,collections
a=[json.loads(l) for l in pathlib.Path("v59/candidates.jsonl").read_text().splitlines()]
b=[json.loads(l) for l in pathlib.Path("v63/risk_triage_200.jsonl").read_text().splitlines()]
assert len(a)==len(b)==200
by={x["teaching_sense_id"]:x for x in a}
assert len(by)==200 and len({x["teaching_sense_id"] for x in b})==200
for x in b:
 y=by[x["teaching_sense_id"]]
 assert x["definition_en"]==y["definition_en"]
 assert x["gloss_zh_machine_candidate"]==y["gloss_zh_machine_candidate"]
 assert x["semantic_certified"] is False and x["production_ready"] is False
 assert x["triage_status"]=="REVIEW_REQUIRED"
assert sum(x["gloss_zh_machine_candidate"]==by[x["teaching_sense_id"]]["gloss_zh_machine_candidate"] for x in b)==200
known=set("""core20k:rank:1361::oewn-delay__2.30.00..
core20k:rank:1361::oewn-delay__2.30.01..
core20k:rank:1362::oewn-forest__1.14.00..
core20k:rank:1362::oewn-forest__1.17.00..
core20k:rank:1393::oewn-sweep__2.35.00..
core20k:rank:1413::oewn-correct__2.30.00..
core20k:rank:1417::oewn-guard__2.33.00..
core20k:rank:1429::oewn-fight__2.41.00..
core20k:rank:1456::oewn-disaster__1.11.00..""".splitlines())
assert known.issubset(by)
report={"joined":200,"machine_source_matches":200,"machine_flagged":sum(bool(x["risk_flags"]) for x in b),"known_errors":9,"known_errors_flagged":sum(x["teaching_sense_id"] in known and bool(x["risk_flags"]) for x in b),"known_errors_score_ge_0_90":sum(x["teaching_sense_id"] in known and x["crosslingual_cosine"]>=.9 for x in b),"auto_certified":0,"caveat":"V60 editor drafts not validated gold labels; known 9 not representative"}
pathlib.Path("v65_results").mkdir(exist_ok=True)
pathlib.Path("v65_results/quality_report.json").write_text(json.dumps(report,indent=2))
print(json.dumps(report))
