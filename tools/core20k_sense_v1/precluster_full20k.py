#!/usr/bin/env python3
"""20K full-corpus source-aware pre-clustering. Does NOT certify or merge semantic senses."""
import json,gzip,pathlib,collections,re,hashlib
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:words=json.load(f)["headwords"]
byrank={w[0]:w for w in words};assert len(byrank)==20000
sources={"oewn2025":p/"oewn"/"oewn2025_full20k_sense_candidates.jsonl","kaikki_en":p/"kaikki"/"kaikki_en_core20k.jsonl","ecdict":p/"ecdict"/"ecdict_core20k.jsonl","zhwiktionary":p/"zh"/"zhwiktionary_core20k.jsonl"}
def norm(s):return " ".join(str(s).casefold().split()).strip(" .;")
entries=collections.defaultdict(dict)
for source,path in sources.items():
 assert path.exists(),path
 for line in path.open(encoding="utf8"):
  r=json.loads(line);rank=r["rank"];assert byrank[rank][1].casefold()==r["lemma"].casefold()
  word=entries[rank]
  word.setdefault("source_set",set()).add(source)
  word.setdefault("glosses",{})
  if source=="oewn2025": items=[(str(z.get("pos","unknown")),str(z.get("gloss_en") or ""),z.get("oewn_sense_id")) for z in r.get("oewn_candidates",[])]
  elif source in ("kaikki_en","zhwiktionary"):
   items=[(str(r.get("pos","unknown")),str(g),source) for s in r.get("senses",[]) for g in (s.get("glosses") or []) if isinstance(g,str)]
  else:
   items=[(str(r.get("pos","unknown")),str(r.get("definition_en") or ""),source)]
   if r.get("translation_zh"):word.setdefault("zh_evidence",[]).append(str(r["translation_zh"])[:500])
  for pos,gloss,sid in items:
   if not norm(gloss):continue
   key=(pos.lower(),norm(gloss))
   val=word["glosses"].setdefault(key,{"pos":pos,"gloss_en":gloss,"source_refs":[]})
   val["source_refs"].append({"source":source,"id":sid})
stats=collections.Counter()
with (p/"full20k_sense_preclusters.jsonl").open("w",encoding="utf8") as out:
 for rank,w in sorted(byrank.items()):
  e=entries.get(rank,{})
  candidates=list(e.get("glosses",{}).values())
  sources_present=sorted(e.get("source_set",set()))
  risk=("NO_GLOSS" if not candidates else "LOW_SUPPORT" if len(sources_present)<2 else "HIGH_POLYSEMY" if len(candidates)>18 else "STANDARD")
  stats["headwords"]+=1;stats["candidate_glosses"]+=len(candidates);stats["risk_"+risk]+=1
  stats["headwords_with_zh"]+=bool(e.get("zh_evidence"))
  out.write(json.dumps({"rank":rank,"lemma":w[1],"source_count":len(sources_present),"sources":sources_present,
    "gloss_clusters":candidates,"zh_evidence":e.get("zh_evidence",[]),"risk":risk,
    "semantic_selection":"REQUIRES_REVIEW","certified":False,"release_eligible":False},ensure_ascii=False)+"\n")
assert stats["headwords"]==20000
summary={"stats":dict(stats),"scope":"all 20000 frozen headwords","semantic_merges":0,"certified":0}
(p/"full20k_precluster_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("FULL20K_PRECLUSTER",json.dumps(summary,ensure_ascii=False))
