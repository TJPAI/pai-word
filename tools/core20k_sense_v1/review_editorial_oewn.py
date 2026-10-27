#!/usr/bin/env python3
"""Evidence-based lexical review of 20 editorial words against OEWN 2025.
Candidate ranking only; no claim of semantic certification.
"""
import json, pathlib, collections, re
import wn
base=pathlib.Path("tools/core20k_sense_v1")
records=[]
for fn in ("editorial_pilot_8_headwords.jsonl","editorial_pilot_12_more_headwords.jsonl"):
 records += [json.loads(s) for s in (base/fn).read_text(encoding="utf-8").splitlines() if s.strip()]
assert len(records)==20
lex=wn.Wordnet(lexicon="oewn:2025")
def tokens(s):return set(re.findall(r"[a-z]+",str(s).lower()))-{"a","an","the","to","of","or","and","in","for","with","that","on","something"}
stats=collections.Counter()
report=[]
for r in records:
 lemma=r["lemma"];external=[]
 for word in lex.words(lemma):
  for sense in word.senses():
   syn=sense.synset();external.append({"id":sense.id,"pos":syn.pos,"gloss":syn.definition()})
 proposals=[]
 for p in r["sense_proposals"]:
  a=tokens(p["gloss_en"])
  best=sorted(((round(len(a&tokens(e["gloss"]))/len(a|tokens(e["gloss"])),4) if a|tokens(e["gloss"]) else 0,e) for e in external),key=lambda z:z[0],reverse=True)[:3]
  proposals.append({"draft_key":p["draft_key"] if "draft_key" in p else p["draft_sense_key"],"zh":p["gloss_zh"],"en":p["gloss_en"],"best_external_gloss_hints":[{"lexical_overlap":sc,**entry} for sc,entry in best],"review_status":"SECOND_SOURCE_SEMANTIC_VALIDATION_PENDING"})
  stats["proposals"]+=1
 stats["external_candidate_count"]+=len(external);stats["headwords"]+=1;stats["without_oewn"]+=not bool(external)
 report.append({"lemma":lemma,"oewn_candidate_count":len(external),"drafts":proposals})
out=base/"reports";out.mkdir(exist_ok=True)
(out/"editorial_20_oewn2025_alignment.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
result={"stats":dict(stats),"note":"Token overlap is NOT semantic agreement. Source senses require editorial evaluation.","independent_certified":0}
(out/"editorial_20_oewn2025_summary.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("EDITORIAL_20_OEWN_ALIGNMENT",json.dumps(result,ensure_ascii=False))
