#!/usr/bin/env python3
"""Merge OEWN 2025 candidates with runtime Sense-KUs into ranked review batches.
This produces provenance-aware candidate clusters, NOT certification.
"""
import gzip,json,pathlib,collections,re
b=pathlib.Path("tools/core20k_sense_v1/reports");b.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f: rows=json.load(f)["headwords"]
byrank={w[0]:w for w in rows}; assert len(byrank)==20000
stats=collections.Counter()
with (b/"sense_v1_oewn2025_review.jsonl").open("w",encoding="utf-8") as output:
 for line in (b/"oewn2025_full20k_sense_candidates.jsonl").open(encoding="utf-8"):
  x=json.loads(line);rank=x["rank"];w=byrank[rank]
  assert w[1].casefold()==x["lemma"].casefold()
  old=[{"legacy_ku_id":z[0],"gloss_zh":z[2],"gloss_en":z[3]} for z in w[4] if isinstance(z,list) and len(z)>=4 and str(z[1]).lower()=="sense"]
  external=[{"source_sense_id":z["oewn_sense_id"],"gloss_en":z["gloss_en"],"source_synset":z["oewn_synset_id"],"pos":z["pos"]} for z in x["oewn_candidates"]]
  if old and external:state="CROSS_SOURCE_REVIEW"
  elif external:state="EXTERNAL_ONLY_NEEDS_ZH"
  elif old:state="RUNTIME_ONLY_NEEDS_SOURCE"
  else:state="NO_CANDIDATE_NEEDS_OTHER_SOURCE"
  stats[state]+=1;stats["external_senses"]+=len(external);stats["runtime_sense_ku"]+=len(old)
  output.write(json.dumps({"rank":rank,"lemma":x["lemma"],"pos":w[2],"state":state,"legacy_sense_kus":old,"oewn2025_candidates":external,"review_status":"PENDING_SEMANTIC_SELECTION","canonical_sense_id_assigned":False},ensure_ascii=False)+"\n")
assert sum(stats[k] for k in ("CROSS_SOURCE_REVIEW","EXTERNAL_ONLY_NEEDS_ZH","RUNTIME_ONLY_NEEDS_SOURCE","NO_CANDIDATE_NEEDS_OTHER_SOURCE"))==20000
summary={"source":"OEWN 2025 + frozen Core20K Runtime","stats":dict(stats),"canonical_senses_certified":0,"release_eligible":False}
(b/"sense_v1_oewn2025_review_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("SENSE_V1_2025_MERGE",json.dumps(summary,ensure_ascii=False))
