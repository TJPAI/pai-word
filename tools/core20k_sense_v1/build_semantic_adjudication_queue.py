#!/usr/bin/env python3
"""Join 9326 semantic neighbor pairs to source definitions, produce auditable risk-ranked adjudication."""
import json,pathlib,collections
base=pathlib.Path("tools/core20k_sense_v1/reports")
root=base/"source_join";agg=base/"semantic_shards"
pre={r["rank"]:r for r in map(json.loads,(root/"full20k_sense_preclusters.jsonl").open(encoding="utf8"))}
stats=collections.Counter();samples=[]
with (agg/"semantic_adjudication_queue.jsonl").open("w",encoding="utf8") as out:
 for line in (agg/"all20k_semantic_neighbor_pairs.jsonl").open(encoding="utf8"):
  r=json.loads(line);rank=r["rank"];word=pre[rank];glosses=word["gloss_clusters"]
  for match in r["pairs"]:
   a,b=glosses[match["left"]],glosses[match["right"]]
   assert a["pos"].lower()==b["pos"].lower()
   sa={x["source"] for x in a["source_refs"]};sb={x["source"] for x in b["source_refs"]}
   # Same-source matches often reflect grammatical/use distinctions; cross-source independent evidence is more valuable.
   priority= "CROSS_SOURCE_HIGH" if sa.isdisjoint(sb) and match["cosine"]>=.92 else "CROSS_SOURCE" if sa.isdisjoint(sb) else "SAME_SOURCE_REVIEW"
   row={"rank":rank,"lemma":r["lemma"],"left":a,"right":b,"cosine":match["cosine"],"priority":priority,
        "proposed_action":"REVIEW_EQUIVALENCE_NOT_MERGED","review_questions":["same core meaning?","POS and valency compatible?","register/domain/grammar distinction?","Chinese meaning preserved?"],
        "certified":False}
   out.write(json.dumps(row,ensure_ascii=False)+"\n")
   stats["review_pairs"]+=1;stats[priority]+=1
   if len(samples)<12 and priority=="CROSS_SOURCE_HIGH":samples.append({"lemma":r["lemma"],"left":a["gloss_en"],"right":b["gloss_en"],"cosine":match["cosine"]})
  stats["headwords"]+=1
summary={"stats":dict(stats),"examples":samples,"auto_merges":0,"certified":0,"note":"Only stored top 200 pairs per word are available in aggregate artifact; any truncation must be audited."}
(agg/"semantic_adjudication_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SEMANTIC_ADJUDICATION_QUEUE",json.dumps(summary,ensure_ascii=False))
