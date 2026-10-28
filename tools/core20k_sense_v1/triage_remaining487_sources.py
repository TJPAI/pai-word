#!/usr/bin/env python3
"""Source-traceable fallback discovery using OEWN normalization/morphology, not invented senses.
Never silently replace frozen lemma, promote candidates, or mark certified.
"""
import pathlib,json,collections,re
import wn
root=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
lex=wn.Wordnet(lexicon="oewn:2025")
counts=collections.Counter();seen=set();gap=[]
for batch in range(1,41):
 p=root/f"batch{batch:03d}.jsonl";rows=[json.loads(x) for x in p.open(encoding="utf8")]
 for row in rows:
  if row["senses"]:continue
  rank=row["rank"];lemma=row["lemma"];seen.add(rank)
  candidates=[];forms={lemma.casefold(),lemma.casefold().replace("-"," "),lemma.casefold().replace("_"," "),lemma.casefold().replace(" ","-")}
  # OEWN morphological normalization is explicitly provisional; never equate derived lemmas semantically.
  for v in sorted(forms):
   if v==lemma:continue
   for word in lex.words(v):
    for sense in word.senses():
     syn=sense.synset()
     if not syn.definition():continue
     if sense.id not in {x["oewn_sense_id"] for x in candidates}:
      candidates.append({"oewn_sense_id":sense.id,"matched_form":v,"gloss_en":syn.definition(),"pos":syn.pos,"evidence":"NORMALIZED_FORM_OEWN_REVIEW_ONLY"})
  status="NORMALIZED_OEWN_FORM_CANDIDATE" if candidates else "EXTERNAL_SOURCE_STILL_NEEDED"
  counts[status]+=1
  gap.append({"rank":rank,"frozen_lemma":lemma,"status":status,"normalized_form_candidates":candidates,"independent_semantic_certified":False,"production_ready":False})
assert len(seen)==487
(root/"unresolved487_alternative_source_queue.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in gap),encoding="utf8")
report={"remaining_source_gap":len(gap),"categories":dict(counts),"normalized_oe wn_candidates":sum(len(x["normalized_form_candidates"]) for x in gap),"auto_accepted":0,"certified":0}
(root/"unresolved487_source_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_SOURCE_GAP_487_TRIAGE_PASS",json.dumps(report,ensure_ascii=False))
