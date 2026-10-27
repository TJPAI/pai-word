#!/usr/bin/env python3
"""Embedding-based semantic neighbor discovery for the validated 500-word pilot.
No automatic consolidation, frozen ids, or semantic certification.
"""
import json,pathlib,collections
import numpy as np
from sentence_transformers import SentenceTransformer
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
rows=[json.loads(line) for line in (p/"first500_provisional_decisions.jsonl").open(encoding="utf-8")]
assert len(rows)==500
model=SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
all_text=[];spans=[]
for r in rows:
 start=len(all_text)
 all_text.extend(str(s["gloss_en"]) for s in r["sense_decisions"])
 spans.append((start,len(all_text)))
vectors=model.encode(all_text,batch_size=128,convert_to_numpy=True,normalize_embeddings=True,show_progress_bar=False)
assert len(vectors)==len(all_text)
stat=collections.Counter()
with (p/"first500_embedding_semantic_pairs.jsonl").open("w",encoding="utf-8") as out:
 for row,(lo,hi) in zip(rows,spans):
  cand=row["sense_decisions"];pairs=[]
  if hi>lo:
   sims=vectors[lo:hi]@vectors[lo:hi].T
   for i in range(len(cand)):
    for j in range(i+1,len(cand)):
     if str(cand[i]["part_of_speech"]).lower()!=str(cand[j]["part_of_speech"]).lower():continue
     score=float(sims[i,j])
     if score<0.80:continue
     a,b=cand[i],cand[j]
     pairs.append({"left":a["draft_key"],"right":b["draft_key"],
      "left_gloss":a["gloss_en"],"right_gloss":b["gloss_en"],
      "left_sources":a["sources"],"right_sources":b["sources"],
      "cosine":round(score,4),"action":"REVIEW_POSSIBLE_EQUIVALENCE",
      "automatic_merge":False})
  pairs.sort(key=lambda x:-x["cosine"])
  stat["words"]+=1;stat["pairs"]+=len(pairs);stat["words_with_pairs"]+=bool(pairs)
  stat["cross_source_pairs"]+=sum(bool(set(x["left_sources"])^set(x["right_sources"])) for x in pairs)
  out.write(json.dumps({"rank":row["rank"],"lemma":row["lemma"],"candidate_count":len(cand),
   "embedding_pairs":pairs[:120],"truncated":len(pairs)>120,"certified":False},ensure_ascii=False)+"\n")
report={"model":"sentence-transformers/all-MiniLM-L6-v2","threshold":0.80,"stats":dict(stat),
"warning":"Embedding cosine is NOT proof of same lexical meaning. Antonyms, grammar variants and example contexts require human/independent semantic review.",
"semantic_merges":0,"certified":0}
(p/"first500_embedding_semantic_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("EMBEDDING_REVIEW_500",json.dumps(report,ensure_ascii=False))
