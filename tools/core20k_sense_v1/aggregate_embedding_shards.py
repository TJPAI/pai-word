#!/usr/bin/env python3
"""Verify 10 shards cover exactly 20K ranks and consolidate noncertified neighbor statistics."""
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/reports/semantic_shards")
seen=set();stats=collections.Counter();summary=[]
with (p/"all20k_semantic_neighbor_pairs.jsonl").open("w",encoding="utf8") as out:
 for shard in range(10):
  q=p/f"shard{shard}"/f"embedding_shard_{shard:02d}.jsonl"
  assert q.exists(),q
  rows=0;pair_count=0
  for line in q.open(encoding="utf8"):
   r=json.loads(line);rank=r["rank"]
   assert rank not in seen,(shard,rank)
   assert (rank-1)%10==shard,(shard,rank)
   assert r["independent_certified"] is False
   seen.add(rank);rows+=1;pair_count+=r["total_pairs"]
   out.write(json.dumps(r,ensure_ascii=False)+"\n")
  assert rows==2000,(shard,rows)
  summary.append({"shard":shard,"headwords":rows,"candidate_pairs":pair_count})
  stats["candidate_pairs"]+=pair_count
assert seen==set(range(1,20001)),len(seen)
report={"total_headwords":len(seen),"candidate_pairs":stats["candidate_pairs"],"shards":summary,
        "automatic_merges":0,"independently_certified":0,
        "note":"Embedding pairs are unverified and are not canonical Sense records."}
(p/"all20k_semantic_neighbor_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("FULL20K_EMBEDDING_AGGREGATE",json.dumps(report,ensure_ascii=False))
