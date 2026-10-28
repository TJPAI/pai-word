#!/usr/bin/env python3
"""Print the first sourced, low-risk unmapped lexical records for human semantic editing.
Diagnostic only; never certifies, publishes or constructs KU.
"""
import json,pathlib
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
idx=json.loads((root/"index.json").read_text())
rows=[]
for b in idx["batches"]:
    d=root/("batch%03d"%b["batch"])/"bilingual_ku_editorial_candidates.jsonl"
    for line in d.open(encoding="utf8"):
        r=json.loads(line)
        if r["editing_state"]!="EDITORIAL_SINGLE_GLOSS_CANDIDATE":continue
        if r["lemma"].casefold() in {"judgmental","evaluative"}:continue
        rows.append({"rank":r["rank"],"lemma":r["lemma"],"oewn_sense_id":r["oewn_sense_id"],"definition_en":r["definition_en"],"zh_wordlevel":r["translation_zh_candidate"]})
rows.sort(key=lambda x:x["rank"])
for r in rows[360:500]:print("SEMANTIC_EDIT_NEXT_SOURCE",json.dumps(r,ensure_ascii=False))
print("SEMANTIC_EDIT_DISCOVERY_PASS",json.dumps({"low_risk_candidates":len(rows),"shown":max(0,min(140,len(rows)-360))}))
