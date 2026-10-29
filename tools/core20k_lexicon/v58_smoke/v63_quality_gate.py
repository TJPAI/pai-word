#!/usr/bin/env python3
"""V63 semantic triage: no similarity-based automatic certification."""
import json,re,collections,pathlib
p=pathlib.Path("v62_import/semantic_triage_200.jsonl")
rows=[json.loads(t) for t in p.read_text(encoding="utf8").splitlines() if t.strip()]
assert len(rows)==200
out=[]
for r in rows:
    zh=r["gloss_zh_machine_candidate"]
    score=r["crosslingual_cosine"]
    reasons=[]
    if score<0.70: reasons.append("LOW_CROSSLINGUAL_SCORE")
    if re.search(r"(.{1,5})\\1{3,}",zh): reasons.append("REPEATED_SUBSTRING")
    if re.search(r"(.{2,9})(?:[，,;； ]?\\1){2,}",zh): reasons.append("REPEATED_PHRASE")
    if re.search(r"[a-zA-Z]\\s*[\u4e00-\u9fff]",zh): reasons.append("MIXED_LATIN_CHINESE")
    if len(zh)>85: reasons.append("LONG_MACHINE_GLOSS")
    if len(zh)<2: reasons.append("SUSPICIOUS_SHORT_GLOSS")
    r={**r,"risk_flags":reasons,"triage_status":"REVIEW_REQUIRED","semantic_certified":False}
    out.append(r)
# Semantic regression: known high-score mistranslations MUST remain quarantined.
for lemma,definition in [("delay","stop or halt"),("forest","the trees and other plants in a large densely wooded area")]:
    matches=[x for x in out if x["lemma"]==lemma and x["definition_en"]==definition]
    assert len(matches)==1 and matches[0]["triage_status"]=="REVIEW_REQUIRED"
pathlib.Path("v63_results").mkdir(exist_ok=True)
q=pathlib.Path("v63_results/risk_triage_200.jsonl")
q.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
report={"count":len(out),"risk_flagged":sum(bool(x["risk_flags"]) for x in out),"low_score":sum(x["crosslingual_cosine"]<0.7 for x in out),"high_score_ge_0_9":sum(x["crosslingual_cosine"]>=0.9 for x in out),"auto_semantic_certified":0,"policy":"ALL machine translations remain review_required regardless of cosine"}
assert len([json.loads(line) for line in q.read_text(encoding="utf8").splitlines()])==200
pathlib.Path("v63_results/report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
print(json.dumps(report,ensure_ascii=False))
