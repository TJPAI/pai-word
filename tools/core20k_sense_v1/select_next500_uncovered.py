#!/usr/bin/env python3
"""Prepare exactly 500 previously unedited low-risk lexical evidence cards.
Word-level Chinese remains unverified; these are selection inputs, not Sense/KU output.
"""
import json,pathlib,gzip
base=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
other=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch-all")
index=json.loads((base/"index.json").read_text())
completed=set()
editorial_files=sorted(base.glob("bilingual_sense_ku_curated_batch[0-9][0-9].jsonl"))
assert len(editorial_files)>=10, "Missing previously approved curated batch"
for file in editorial_files:
    for line in file.open(encoding="utf8"):
        completed.add(json.loads(line)["rank"])
for line in (other/"newly_resolved_sense_ku_editorial.jsonl").open(encoding="utf8"):
    completed.add(json.loads(line)["rank"])
pool=[];ranks=set()
for batch in index["batches"]:
    path=base/("batch%03d"%batch["batch"])/"bilingual_ku_editorial_candidates.jsonl"
    for line in path.open(encoding="utf8"):
        r=json.loads(line)
        if r["editing_state"]!="EDITORIAL_SINGLE_GLOSS_CANDIDATE" or r["rank"] in completed or r["rank"] in ranks:continue
        ranks.add(r["rank"])
        pool.append({"rank":r["rank"],"lemma":r["lemma"],"oewn_sense_id":r["oewn_sense_id"],"definition_en":r["definition_en"],"zh_wordlevel_unverified":r["translation_zh_candidate"],"status":"SOURCE_EVIDENCE_ONLY"})
pool.sort(key=lambda x:x["rank"])
chosen=pool[:500]
assert 0<len(chosen)<=500 and len({r["rank"] for r in chosen})==len(chosen)
destination=base/"next500_uncovered_source_cards.jsonl"
destination.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in chosen),encoding="utf8")
print("NEXT500_UNCOVERED_EVIDENCE_PASS",json.dumps({"selected":len(chosen),"total_remaining_lowrisk":len(pool),"already_curated_excluded":len(completed),"first_rank":chosen[0]["rank"],"last_rank":chosen[-1]["rank"],"certified":0}))
for r in chosen[110:230]:print("NEXT500_SOURCE_RECORD",json.dumps(r,ensure_ascii=False))
