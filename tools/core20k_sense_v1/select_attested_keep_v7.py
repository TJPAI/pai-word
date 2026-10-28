#!/usr/bin/env python3
"""V7: Evidence-backed provisional KEEP decisions from attested OEWN examples.
A source example licenses 'attested-use keep candidate', not frequency or certification.
"""
import pathlib,json,time,collections
t=time.monotonic()
bases=list(pathlib.Path(".").rglob("sense_selection_v6_attested_examples.jsonl"))
assert len(bases)==1,bases
base=bases[0].parent
rows=[json.loads(x) for x in (base/"sense_selection_v6_attested_examples.jsonl").open(encoding="utf8")]
assert len(rows)==2647
seen=set();counts=collections.Counter();out=[]
for r in rows:
 key=(r["rank"],r["external_sense_id"]);assert key not in seen;seen.add(key)
 examples=r["source_examples"]
 if not examples:continue
 out.append({"rank":r["rank"],"lemma":r["lemma"],"external_sense_id":r["external_sense_id"],
  "selection_proposal":"KEEP_EXTENDED_ATTESTED_CANDIDATE",
  "previous_selection":"DEFER_REVIEW","evidence":"OEWN2025_SOURCE_USAGE_EXAMPLE",
  "example_count_available":len(examples),"examples":examples,
  "source_supported_usage":True,"sense_frequency_verified":False,
  "final_certified":False,"eligible_for_initial_original_ku_drafting":True,
  "production_ready":False})
 counts["keep_from_defer_attested"]+=1
assert counts["keep_from_defer_attested"]==2647
(base/"sense_selection_v7_keep_attested.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
manifest={"prior_defer_review":5931,"attested_keep_extended_proposals":len(out),
"remaining_without_example":5931-len(out),"actual_published_keep":0,"actual_defer":0,
"provisional_decisions_generated":len(out),
"script_runtime_seconds":round(time.monotonic()-t,3),
"limit":"Source examples show usage, not frequency; proposed KEEP only, no final language-level QA."}
(base/"sense_selection_v7_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SENSE_SELECTION_V7_ATTESTED_KEEP_PASS",json.dumps(manifest))
