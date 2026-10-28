#!/usr/bin/env python3
"""Selection V6: find defensible attested evidence from OEWN examples, preserving all senses.
WordNet example presence is positive contextual evidence, not sense frequency.
"""
import pathlib,json,collections,time
import wn
t=time.monotonic()
found=list(pathlib.Path(".").rglob("sense_selection_v3_decisions_batch001.jsonl"))
assert len(found)==1
root=found[0].parent
lex=wn.Wordnet(lexicon="oewn:2025")
counts=collections.Counter();rows=[]
for b in range(1,41):
 for line in (root/f"sense_selection_v3_decisions_batch{b:03d}.jsonl").open(encoding="utf8"):
  d=json.loads(line);sid=d["external_sense_id"]
  if not sid.startswith("oewn-"):continue
  try:
   sense=lex.sense(sid)
   syn=sense.synset()
   examples=list(syn.examples()) if hasattr(syn,"examples") else []
  except (KeyError,ValueError,wn.Error,AttributeError) as e:
   counts["unresolvable_source_id"]+=1;continue
  if examples:
   counts["example_attested_senses"]+=1
   if d["recommended_action"]=="DEFER_REVIEW":
    rows.append({"rank":d["rank"],"lemma":d["lemma"],"external_sense_id":sid,
     "source_examples":examples[:3],"recommendation":"KEEP_REVIEW_WITH_ATTESTED_SOURCE_EXAMPLE",
     "frequency_claim":None,"automated_final_delete":False,"independent_semantic_review":False})
    counts["defer_candidate_with_examples"]+=1
  else:counts["no_example_in_source"]+=1
(root/"sense_selection_v6_attested_examples.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows),encoding="utf8")
out={"source":"OEWN2025 synset example sentences","source_examples_senses":counts["example_attested_senses"],
"defer_candidates_with_source_examples":counts["defer_candidate_with_examples"],
"unresolvable_ids":counts["unresolvable_source_id"],"no_example_in_source":counts["no_example_in_source"],
"final_sense_defer":0,"final_semantic_merges":0,"elapsed_seconds":round(time.monotonic()-t,2),
"caution":"OEWN examples support usage but do not establish frequency or justify DEFER/REJECT."}
(root/"sense_selection_v6_manifest.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SENSE_V6_EXAMPLE_EVIDENCE_PASS",json.dumps(out))
