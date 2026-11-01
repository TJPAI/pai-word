#!/usr/bin/env python3
"""Read-only detailed audit of duplicated KU IDs. Preserves every original record."""
import collections, json, pathlib
B=pathlib.Path(__file__).resolve().parent
groups=collections.defaultdict(list)
for path in sorted(B.glob("ku_drafts/v*/ku_*.jsonl")):
    for line_no,line in enumerate(path.read_text(encoding="utf-8").splitlines(),1):
        if line.strip():
            row=json.loads(line)
            groups[row.get("ku_id")].append((str(path.relative_to(B)),line_no,row))
FIELDS=["teaching_sense_id","rank","lemma","pos","response","gloss_en","definition_en","gloss_zh","render_kind","ku_type"]
SENSITIVE={"teaching_sense_id","rank","lemma","response"}
counts=collections.Counter()
details=[]
for kid,rows in groups.items():
    if len(rows)<2: continue
    differences=[field for field in FIELDS if len({json.dumps(r.get(field),sort_keys=True,ensure_ascii=False) for _,_,r in rows})>1]
    # A missing gloss_en is not a missing definition if definition_en supplies it.
    normalized_en={r.get("gloss_en") or r.get("definition_en") for _,_,r in rows}
    if len(normalized_en)>1 and "english_gloss" not in differences: differences.append("english_gloss")
    if len(normalized_en)==1: differences=[d for d in differences if d not in ("gloss_en","definition_en")]
    if not differences: continue
    for field in differences:counts[field]+=1
    severity="high" if SENSITIVE.intersection(differences) else "review"
    details.append({"ku_id":kid,"severity":severity,"different_fields":differences,"sources":[{"file":p,"line":n,"values":{k:r.get(k) for k in differences if k not in ("english_gloss",)}} for p,n,r in rows]})
details.sort(key=lambda x:(x["severity"]!="high",x["ku_id"]))
report={"total_conflict_groups":len(details),"high_risk_groups":sum(x["severity"]=="high" for x in details),"review_groups":sum(x["severity"]=="review" for x in details),"field_counts":dict(counts),"conflicts":details}
out=B/"ku_conflict_detail.json"
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k!="conflicts"},ensure_ascii=False))
