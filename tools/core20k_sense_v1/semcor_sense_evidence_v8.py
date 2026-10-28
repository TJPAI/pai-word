#!/usr/bin/env python3
"""SemCor annotated-sense evidence, conservatively aligned by lemma/POS/definition.
Counts only exact normalized definition matches; never treats absence as rarity.
"""
import json,pathlib,collections,re,time
from nltk.corpus import semcor
start=time.monotonic()
roots=list(pathlib.Path(".").rglob("sense_selection_v3_decisions_batch001.jsonl"))
assert len(roots)==1
base=roots[0].parent
def norm(x):return re.sub(r"[^a-z0-9]+"," ",str(x).lower()).strip()
lookup=collections.defaultdict(list)
for b in range(1,41):
 for line in (base/f"sense_selection_v3_decisions_batch{b:03d}.jsonl").open():
  r=json.loads(line)
  if not r["external_sense_id"].startswith("oewn-"):continue
  lookup[(norm(r["lemma"]),norm(r["source_definition"]))].append(r)
freq=collections.Counter();scanned=0;aligned=0;notaligned=0
# tagged_sents contains source-tokenized Tree objects with lemma/synset annotations
for sent in semcor.tagged_sents(tag="sem"):
 for node in sent:
  label=getattr(node,"label",lambda:None)()
  if not hasattr(label,"synset") or not hasattr(label,"name"):continue
  try:
   syn=label.synset()
   word=norm(label.name())
   key=(word,norm(syn.definition()))
  except (AttributeError,ValueError,LookupError):continue
  scanned+=1
  matched=lookup.get(key,[])
  if len(matched)==1:
   freq[(matched[0]["rank"],matched[0]["external_sense_id"])]+=1;aligned+=1
  else:notaligned+=1
out=[]
for (rank,sid),n in freq.items():
 out.append({"rank":rank,"external_sense_id":sid,"semcor_exact_gloss_match_count":n,
 "source":"NLTK SemCor semantic annotations aligned to OEWN via exact lemma and normalized source definition",
 "alignment":"EXACT_LEMMA_AND_DEFINITION_UNIQUE","corpus_specific_count_not_population_frequency":True})
out.sort(key=lambda x:(x["rank"],x["external_sense_id"]))
(base/"semcor_exact_sense_evidence_v8.jsonl").write_text("".join(json.dumps(x)+"\n" for x in out))
deferred=set()
for b in range(1,41):
 for line in (base/f"sense_selection_v3_decisions_batch{b:03d}.jsonl").open():
  r=json.loads(line)
  if r["recommended_action"]=="DEFER_REVIEW":deferred.add((r["rank"],r["external_sense_id"]))
defer_evidence=sum((r["rank"],r["external_sense_id"]) in deferred for r in out)
manifest={"semcor_tagged_lemma_tokens_checked":scanned,"matched_occurrences":aligned,"unmatched_occurrences":notaligned,
"unique_core20k_senses_with_attested_semcor_annotations":len(out),
"defer_candidates_with_semcor_annotations":defer_evidence,
"confirmed_semantic_deletions":0,"runtime_seconds":round(time.monotonic()-start,2),
"caveat":"Strict exact lemma+definition matching has low recall; SemCor absence is not rarity."}
(base/"semcor_selection_v8_manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
print("SENSE_V8_SEMCOR_EVIDENCE_PASS",json.dumps(manifest))
