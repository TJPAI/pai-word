#!/usr/bin/env python3
"""Make provenance-preserving provisional lexical decisions for 500 triaged headwords.
Deterministic exact-duplicate detection, NOT independent semantic review.
"""
import json,pathlib,collections,re,hashlib
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
triage={r["rank"]:r for r in map(json.loads,(p/"first500_meaning_triage.jsonl").open(encoding="utf8"))}
actions={r["rank"]:r for r in map(json.loads,(p/"first500_review_actions.jsonl").open(encoding="utf8"))}
assert len(triage)==len(actions)==500
def normalize(s):return " ".join(str(s).casefold().split()).strip(" .;")
stats=collections.Counter()
out=p/"first500_provisional_decisions.jsonl"
with out.open("w",encoding="utf8") as f:
 for rank,r in sorted(triage.items()):
  action=actions[rank]["action"];cands=r["candidate_glosses"];decisions=[];bykey={}
  for candidate in cands:
   pos=str(candidate["pos"]).casefold()
   key=(pos,normalize(candidate["gloss_en"]))
   if key in bykey:
    bykey[key]["provenance"].extend(candidate["source_reference"])
    bykey[key]["sources"]=sorted(set(bykey[key]["sources"]+candidate["evidence_sources"]))
    stats["extra_exact_duplicates"]+=1
    continue
   draft_key=hashlib.sha256((str(rank)+"|"+pos+"|"+key[1]).encode()).hexdigest()[:16]
   d={"draft_key":"draft:"+draft_key,"part_of_speech":candidate["pos"],
      "gloss_en":candidate["gloss_en"],"sources":candidate["evidence_sources"],
      "provenance":candidate["source_reference"],
      "decision":"PROVISIONAL_RETAIN_FOR_SEMANTIC_REVIEW",
      "auto_certified":False,"semantic_review_required":True}
   bykey[key]=d;decisions.append(d)
  stats["words"]+=1;stats["draft_senses"]+=len(decisions)
  stats["fast_lane_words"]+= action=="BATCH_AI_SEMANTIC_COMPARE_NOT_CERTIFY"
  stats["fast_lane_draft_senses"]+=len(decisions) if action=="BATCH_AI_SEMANTIC_COMPARE_NOT_CERTIFY" else 0
  if not decisions:stats["no_draft_sense_words"]+=1
  f.write(json.dumps({"rank":rank,"lemma":r["lemma"],"action":action,
     "sense_decisions":decisions,"chinese_evidence":r["chinese_evidence"],
     "legacy_to_new_mapping":"REQUIRES_EXPLICIT_QA","semantic_signoff":False,
     "publishable":False},ensure_ascii=False)+"\n")
summary={"statistics":dict(stats),"words_expected":500,"frozen_mutations":0,
"statement":"PROVISIONAL candidates only. Meaning-to-meaning merging and certification require source-grounded semantic QA."}
(p/"first500_provisional_decisions_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("PROVISIONAL_DECISIONS_500",json.dumps(summary,ensure_ascii=False))
