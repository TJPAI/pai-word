#!/usr/bin/env python3
"""Review first 500 records at meaning level; conservative duplicate grouping and risk marking."""
import json,re,pathlib,collections,hashlib
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
records=[json.loads(s) for s in (p/"first500_semantic_evidence.jsonl").open(encoding="utf8")]
assert len(records)==500
def clean(t):return re.sub(r"\\s+"," ",str(t).strip().lower()).strip(" .;")
def glosses(source,entry):
 if source=="oewn2025":return [entry.get("gloss","")]
 if source in ("kaikki_en","zhwiktionary"):return entry.get("glosses",[])
 if source=="ecdict":return [entry.get("definition_en","")]
 return []
summary=collections.Counter()
with (p/"first500_meaning_triage.jsonl").open("w",encoding="utf8") as out:
 for r in records:
  groups={};issues=[];zh=[]
  for source,entries in r["source_evidence"].items():
   for e in entries:
    pos=e.get("pos") or "unknown"
    if source=="ecdict":
     z=e.get("translation_zh")
     if z:zh.append({"source":source,"translation_zh":z,"pos":pos})
    for g in glosses(source,e):
     if not isinstance(g,str) or not clean(g):continue
     norm=clean(g)
     key=(str(pos).lower(),norm)
     if key not in groups:groups[key]={"pos":pos,"gloss_en":g,"evidence_sources":[],"source_reference":[]}
     if source not in groups[key]["evidence_sources"]:groups[key]["evidence_sources"].append(source)
     groups[key]["source_reference"].append(e.get("id") or source)
  if not groups:issues.append("NO_ENGLISH_GLOSS_CANDIDATE")
  if len(r["source_evidence"])<=1:issues.append("LOW_SOURCE_COVERAGE")
  if len(groups)>15:issues.append("HIGH_POLYSEMY_OR_NOISY_SOURCE")
  if not zh:issues.append("NO_ECDICT_CHINESE_TRANSLATION")
  if r["lemma"] in ("oclock","centerist"):issues.append("SUSPECT_SPELLING_OR_NONCANONICAL_LEMMA")
  candidates=list(groups.values())
  # Only exact POS+normalized-text duplicates are grouped; semantic merging remains pending.
  for c in candidates:c["review_decision"]="KEEP_AS_CANDIDATE_PENDING_SEMANTIC_REVIEW"
  summary["words"]+=1;summary["distinct_exact_gloss_candidates"]+=len(candidates)
  summary["risk_words"]+=bool(issues);summary["chinese_translation_words"]+=bool(zh)
  for x in issues:summary["issue_"+x]+=1
  out.write(json.dumps({"rank":r["rank"],"lemma":r["lemma"],"issues":issues,
   "candidate_glosses":candidates,"chinese_evidence":zh,"canonical_senses":[],"semantic_certified":False,
   "old_new_id_mapping":"PENDING"},ensure_ascii=False)+"\n")
(p/"first500_meaning_triage_summary.json").write_text(json.dumps({"counts":dict(summary),"method":"exact normalized English gloss plus POS dedup only; NO semantic merge; NO semantic certification"},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("MEANING_TRIAGE_500",json.dumps(dict(summary)))
