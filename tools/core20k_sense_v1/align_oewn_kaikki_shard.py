#!/usr/bin/env python3
"""Cross-source, same-lemma/POS meaning alignment. Independently encode once per shard.
Top-2 reciprocal matches are evidence suggestions, NOT automatic Sense certification."""
import os,json,pathlib,collections
import numpy as np
from sentence_transformers import SentenceTransformer
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
shard=int(os.environ.get("SHARD","0"));shards=10
assert 0<=shard<shards
rows=[json.loads(x) for x in (p/"full20k_sense_preclusters.jsonl").open(encoding="utf8") if (json.loads(x)["rank"]-1)%shards==shard]
assert len(rows)==2000
model=SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
texts=[];offsets={}
for r in rows:
 lo=len(texts);texts.extend(g["gloss_en"] for g in r["gloss_clusters"]);offsets[r["rank"]]=lo
vectors=model.encode(texts,batch_size=128,normalize_embeddings=True,convert_to_numpy=True,show_progress_bar=False)
stats=collections.Counter()
with (p/f"cross_source_shard_{shard:02d}.jsonl").open("w",encoding="utf8") as out:
 for r in rows:
  g=r["gloss_clusters"];lo=offsets[r["rank"]];choices=[]
  oe=[i for i,x in enumerate(g) if any(ref["source"]=="oewn2025" for ref in x["source_refs"])]
  wk=[i for i,x in enumerate(g) if any(ref["source"]=="kaikki_en" for ref in x["source_refs"])]
  for i in oe:
   possible=[]
   for j in wk:
    if i==j or str(g[i]["pos"]).lower()!=str(g[j]["pos"]).lower():continue
    score=float(vectors[lo+i]@vectors[lo+j])
    if score>=.67:possible.append((score,j))
   possible.sort(reverse=True)
   for score,j in possible[:2]:
    choices.append({"oewn_index":i,"kaikki_index":j,"cosine":round(score,4),
      "oewn_gloss":g[i]["gloss_en"],"kaikki_gloss":g[j]["gloss_en"],
      "pos":g[i]["pos"],"review_action":"EVALUATE_EQUIVALENCE_OR_RELATED_MEANING","auto_merge":False})
  stats["headwords"]+=1;stats["oewn_senses"]+=len(oe);stats["kaikki_senses"]+=len(wk)
  stats["cross_source_pairs"]+=len(choices);stats["words_with_pairs"]+=bool(choices)
  out.write(json.dumps({"rank":r["rank"],"lemma":r["lemma"],"pairs":choices,"certified":False},ensure_ascii=False)+"\n")
report={"shard":shard,"stats":dict(stats),"minimum_cosine":0.67,"auto_merged":0,"certified":0}
(p/f"cross_source_shard_{shard:02d}_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CROSS_SOURCE_ALIGNMENT_SHARD",json.dumps(report))
