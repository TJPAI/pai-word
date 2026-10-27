#!/usr/bin/env python3
"""All-20K deterministic publication gate with lexical anomaly classifications.
This does not semantically merge or certify senses."""
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
path=p/"full20k_sense_preclusters.jsonl"
ANOMALIES={
"centerist":("SPELLING_VARIANT","centrist","Likely nonstandard spelling; preserve frozen lemma"),
"oclock":("ORTHOGRAPHIC_VARIANT","o'clock","Apostrophe form is conventional"),
"acte":("LANGUAGE_OR_PROPER_CONTEXT","acte","Check whether French term appears as English loanword"),
"officier":("LANGUAGE_OR_PROPER_CONTEXT","officer","Check French lexical form rather than automatically replacing"),
"courte":("LANGUAGE_OR_PROPER_CONTEXT","court","Check non-English morphological form"),
"mellitus":("MEDICAL_FIXED_EXPRESSION","diabetes mellitus","Often used in a medical multiword term"),
"nervosa":("MEDICAL_FIXED_EXPRESSION","anorexia nervosa","Often used in a medical multiword term")}
stats=collections.Counter();missing=[]
with path.open(encoding="utf8") as src,(p/"sense20k_release_gate.jsonl").open("w",encoding="utf8") as output:
 for line in src:
  r=json.loads(line);n=len(r["gloss_clusters"])
  anomaly=ANOMALIES.get(r["lemma"].casefold())
  if n==0:missing.append(r["lemma"])
  reasons=[]
  if not n:reasons.append("NO_ENGLISH_DEFINITION")
  if n>18:reasons.append("POLYSEMY_NOT_CONSOLIDATED")
  if not r["zh_evidence"]:reasons.append("MISSING_CHINESE_ECDICT_EVIDENCE")
  if anomaly:reasons.append("LEMMA_FORM_REVIEW")
  reasons.append("INDEPENDENT_SEMANTIC_SIGNOFF_NOT_PRESENT")
  stats["words"]+=1;stats["blocked"]+=1
  for x in reasons:stats[x]+=1
  output.write(json.dumps({"rank":r["rank"],"lemma":r["lemma"],"gloss_count":n,
  "anomaly":{"class":anomaly[0],"reference_form":anomaly[1],"note":anomaly[2]} if anomaly else None,
  "publishable":False,"blockers":reasons,"frozen_rank_unmodified":True},ensure_ascii=False)+"\n")
assert stats["words"]==20000
assert sorted(missing)==sorted(ANOMALIES)
summary={"stats":dict(stats),"no_gloss_anomalies":ANOMALIES,"gate":"ALL_BLOCKED_UNTIL_SEMANTIC_SIGNOFF","formal_certified":0}
(p/"sense20k_release_gate_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SENSE20K_RELEASE_GATE",json.dumps({"stats":dict(stats),"missing":missing},ensure_ascii=False))
