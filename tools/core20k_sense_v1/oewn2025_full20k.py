#!/usr/bin/env python3
"""OEWN cross-reference pilot for frozen top-ranked 500 headwords.
Third-party senses are candidates, never silently promoted.
"""
import json,gzip,pathlib,collections,sys
import wn
base=pathlib.Path("tools/core20k_sense_v1/reports");base.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f: rows=json.load(f)["headwords"]
rows=sorted(rows,key=lambda w:w[0]);assert len(rows)==20000
lexicons=wn.lexicons();print("INSTALLED_WN_LEXICONS",[(x.id,x.version) for x in lexicons])
if not lexicons:raise RuntimeError("OEWN not installed")
lex=wn.Wordnet(lexicon="oewn:2025")
stats=collections.Counter()
with (base/"oewn2025_full20k_sense_candidates.jsonl").open("w",encoding="utf-8") as out:
 for rank,lemma,pos,ipa,kus in rows:
  words=lex.words(lemma)
  candidates=[];seen=set()
  for word in words:
   for ss in word.senses():
    if ss.id in seen:continue
    seen.add(ss.id)
    syn=ss.synset()
    candidates.append({"oewn_sense_id":ss.id,"oewn_synset_id":syn.id,"pos":syn.pos,"gloss_en":syn.definition(),"source":"Open English WordNet 2025","review_status":"OEWN_CANDIDATE_UNVERIFIED_FOR_TEACHING"})
  stats["candidate_count"]+=len(candidates);stats["matched_headwords"]+=bool(candidates)
  stats["no_match"]+=not bool(candidates)
  out.write(json.dumps({"rank":rank,"lemma":lemma,"existing_sense_ku_count":sum(len(x)>=2 and str(x[1]).lower()=="sense" for x in kus if isinstance(x,list)),"oewn_candidates":candidates},ensure_ascii=False)+"\n")
report={"scope":"frozen rank 1–20000","source":"Open English WordNet 2025 via wn","stats":dict(stats),"certified_senses":0,"warning":"OEWN synsets are an external candidate source, not frequency-ranked teaching meanings. Bulk sense merging and independent review still required."}
(base/"oewn2025_full20k_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("OEWN2025_FULL20K",json.dumps(report,ensure_ascii=False))
