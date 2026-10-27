#!/usr/bin/env python3
"""Parallel shard of frozen 20K semantic neighbor search, evidence-only."""
import os,json,pathlib,collections
import numpy as np
from sentence_transformers import SentenceTransformer
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
shard=int(os.environ.get("SHARD","0"));shards=int(os.environ.get("SHARDS","10"))
assert 0<=shard<shards
rows=[]
for line in (p/"full20k_sense_preclusters.jsonl").open(encoding="utf8"):
 r=json.loads(line)
 if (r["rank"]-1)%shards==shard:rows.append(r)
assert len(rows)==20000//shards
model=SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
stats=collections.Counter()
# Encode the whole shard in large batches once, then slice by word/POS.
all_glosses=[]
word_offsets={}
for r in rows:
 start=len(all_glosses)
 all_glosses.extend(str(g["gloss_en"]) for g in r["gloss_clusters"])
 word_offsets[r["rank"]]=(start,len(all_glosses))
all_vectors=model.encode(all_glosses,batch_size=128,convert_to_numpy=True,normalize_embeddings=True,show_progress_bar=False)
assert len(all_vectors)==len(all_glosses)
dst=p/f"embedding_shard_{shard:02d}.jsonl"
with dst.open("w",encoding="utf8") as out:
 for r in rows:
  glosses=r["gloss_clusters"];bypos=collections.defaultdict(list)
  for i,g in enumerate(glosses):bypos[str(g["pos"]).lower()].append(i)
  matches=[]
  for pos,idx in bypos.items():
   if len(idx)<2:continue
   # Preserve a bound for extreme polysemy and log truncation.
   if len(idx)>240:stats["truncated_pos_groups"]+=1;idx=idx[:240]
   offset=word_offsets[r["rank"]][0]
   v=all_vectors[[offset+i for i in idx]]
   sims=v@v.T
   for i in range(len(idx)):
    for j in range(i+1,len(idx)):
     score=float(sims[i,j])
     if score<.84:continue
     a,b=glosses[idx[i]],glosses[idx[j]]
     matches.append({"left":idx[i],"right":idx[j],"cosine":round(score,4),
       "pos":pos,"cross_source":bool(set(x["source"] for x in a["source_refs"])!=set(x["source"] for x in b["source_refs"])),
       "decision":"REVIEW_ONLY_NO_AUTOMERGE"})
  matches.sort(key=lambda x:-x["cosine"])
  stats["headwords"]+=1;stats["candidate_glosses"]+=len(glosses);stats["candidate_pairs"]+=len(matches)
  stats["words_with_pairs"]+=bool(matches)
  if len(matches)>200:stats["truncated_pairs_words"]+=1
  out.write(json.dumps({"rank":r["rank"],"lemma":r["lemma"],"pairs":matches[:200],
   "total_pairs":len(matches),"independent_certified":False},ensure_ascii=False)+"\n")
report={"shard":shard,"shards":shards,"stats":dict(stats),"certified":0,"auto_merged":0}
(p/f"embedding_shard_{shard:02d}_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("EMBEDDING_SHARD",json.dumps(report))
