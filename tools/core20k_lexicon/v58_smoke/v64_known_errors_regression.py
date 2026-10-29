import json,pathlib
rows=[json.loads(x) for x in pathlib.Path("v63_import/risk_triage_200.jsonl").read_text().splitlines() if x.strip()]
assert len(rows)==200
known=set("""core20k:rank:1361::oewn-delay__2.30.00..
core20k:rank:1361::oewn-delay__2.30.01..
core20k:rank:1362::oewn-forest__1.14.00..
core20k:rank:1362::oewn-forest__1.17.00..
core20k:rank:1393::oewn-sweep__2.35.00..
core20k:rank:1413::oewn-correct__2.30.00..
core20k:rank:1417::oewn-guard__2.33.00..
core20k:rank:1429::oewn-fight__2.41.00..
core20k:rank:1456::oewn-disaster__1.11.00..""".splitlines())
assert len(known)==9 and known.issubset({x["teaching_sense_id"] for x in rows})
assert all(x["triage_status"]=="REVIEW_REQUIRED" and x["semantic_certified"] is False for x in rows)
ranked=sorted(rows,key=lambda x:x["crosslingual_cosine"])
report={"total":200,"known_error_count":9,"rule_flag_recall":sum(bool(x["risk_flags"]) and x["teaching_sense_id"] in known for x in rows)/9,"ranking_recall_at_20":sum(x["teaching_sense_id"] in known for x in ranked[:20])/9,"ranking_recall_at_40":sum(x["teaching_sense_id"] in known for x in ranked[:40])/9,"ranking_recall_at_100":sum(x["teaching_sense_id"] in known for x in ranked[:100])/9,"above_0_9_known_errors":sum(x["crosslingual_cosine"]>=.9 and x["teaching_sense_id"] in known for x in rows),"auto_approved":0,"note":"Nine previously flagged errors only; not an independently labeled random sample. No precision or general-population error rate inferred."}
assert report["rule_flag_recall"]<0.5
assert report["above_0_9_known_errors"]>=3
p=pathlib.Path("v64_results");p.mkdir(exist_ok=True)
(p/"known9_regression_report.json").write_text(json.dumps(report,indent=2),encoding="utf8")
print(json.dumps(report,indent=2))
