#!/usr/bin/env python3
"""Evidence-based automated review of 20 editorial words against OEWN 2025.
Scores are candidate suggestions, NOT independent certification.
"""
import json,pathlib,re,collections
import wn
base=pathlib.Path("tools/core20k_sense_v1")
rows=[]
for fn in ("editorial_pilot_8_headwords.jsonl","editorial_pilot_12_more_headwords.jsonl"):
 rows.extend(json.loads(x) for x in (base/fn).read_text(encoding="utf-8").splitlines() if x.strip())
assert len(rows)==20
lex=wn.Wordnet(lexicon="oewn:2025")
stop={"a","an","the","of","to","for","and","or","one","something","someone","that","with","in","on","some","be","is","are","to","from","as","a","particular","thing"}
def tokens(s):return set(re.findall(r"[a-z]+",str(s).lower()))-stop
out=base/"reports/editorial20_oewn2025_evidence.jsonl";out.parent.mkdir(parents=True,exist_ok=True)
counts=collections.Counter()
with out.open("w",encoding="utf-8") as f:
 for row in rows:
  lemma=row["lemma"]; source=[]
  for word in lex.words(lemma):
   for sense in word.senses():
    syn=sense.synset();source.append({"sense_id":sense.id,"pos":syn.pos,"definition":syn.definition()})
  unique={s["sense_id"]:s for s in source};source=list(unique.values())
  proposals=[]
  for proposal in row["sense_proposals"]:
   target=tokens(proposal["gloss_en"]);ranked=[]
   for source_sense in source:
    other=tokens(source_sense["definition"])
    sim=round(len(target&other)/len(target|other),4) if target and other else 0
    if sim>0:ranked.append({"oewn_sense_id":source_sense["sense_id"],"definition":source_sense["definition"],"token_jaccard":sim})
   ranked.sort(key=lambda r:-r["token_jaccard"])
   if not ranked:counts["no_lexical_evidence_hint"]+=1
   else:counts["with_lexical_hint"]+=1
   proposals.append({"draft_sense_key":proposal.get("draft_sense_key",proposal.get("draft_key")),"gloss_zh":proposal["gloss_zh"],"gloss_en":proposal["gloss_en"],"top_source_hints":ranked[:3],"source_agreement":"UNDETERMINED_NEEDS_SEMANTIC_REVIEW","certified":False})
  counts["headwords"]+=1;counts["proposals"]+=len(proposals);counts["oewn_senses_available"]+=len(source)
  f.write(json.dumps({"lemma":lemma,"oewn_2025_senses":len(source),"proposals":proposals,"review_status":"SOURCE_HINTS_ONLY"},ensure_ascii=False)+"\n")
report={"counts":dict(counts),"source":"Open English WordNet 2025","method":"lexical token overlap only; cannot validate entailment, source equivalence, Sense boundaries, or Chinese gloss","certified_senses":0,"release_eligible":False}
(base/"reports/editorial20_oewn2025_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("EDITORIAL20_SOURCE_CHECK",json.dumps(report,ensure_ascii=False))
