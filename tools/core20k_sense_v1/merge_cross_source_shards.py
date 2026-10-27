#!/usr/bin/env python3
"""Merge 10 OEWN/Kaikki semantic alignment shards into a validated, rank-sorted JSONL."""
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/reports/cross_source_merged")
p.mkdir(parents=True,exist_ok=True)
allrows={}; counts=collections.Counter(); shards=[]
for shard in range(10):
 f=p/f"shard{shard}"/f"cross_source_shard_{shard:02d}.jsonl"
 assert f.is_file(),f
 rows=0;pairs=0
 for line in f.open(encoding="utf-8"):
  rec=json.loads(line);rank=rec["rank"]
  assert isinstance(rank,int) and 1<=rank<=20000
  assert (rank-1)%10==shard,(rank,shard)
  assert rank not in allrows,("duplicate rank",rank)
  assert rec.get("certified") is False
  allrows[rank]=rec;rows+=1;pairs+=len(rec["pairs"])
  counts["word_pairs"]+=len(rec["pairs"])
 assert rows==2000,(shard,rows)
 shards.append({"shard":shard,"headwords":rows,"pairs":pairs})
assert set(allrows)==set(range(1,20001)),("missing ranks",len(allrows))
with (p/"core20k_oewn2025_kaikki_alignment_merged.jsonl").open("w",encoding="utf-8") as out:
 for rank in range(1,20001):
  out.write(json.dumps(allrows[rank],ensure_ascii=False)+"\n")
summary={"frozen_headwords":20000,"alignment_pairs":counts["word_pairs"],
"shards":shards,"rank_coverage":"EXACT_1_TO_20000_NO_DUPLICATES",
"semantic_certification":0,"auto_merged":0,"status":"SOURCE_ALIGNMENT_CANDIDATES"}
(p/"core20k_oewn2025_kaikki_alignment_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("CROSS_SOURCE_MERGE_OK",json.dumps(summary,ensure_ascii=False))
