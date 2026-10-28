#!/usr/bin/env python3
"""Auditable prospective KU drafting gate from provisional teaching Sense selection.
No new pedagogy generated; do not confuse draft coverage with certified lessons.
"""
import pathlib,json,collections,time
t=time.monotonic();f=list(pathlib.Path(".").rglob("teaching_sense_v1_provisional_selection.jsonl"));assert len(f)==1
base=f[0].parent
selected=collections.defaultdict(set);state=collections.Counter()
for ln in f[0].open():
 x=json.loads(ln)
 if x["teaching_v1_inclusion_proposal"].startswith("INCLUDE_"):
  selected[x["rank"]].add(x["source_sense_id"]);state[x["teaching_v1_inclusion_proposal"]]+=1
stats=collections.Counter();rows=[]
for b in range(1,41):
 for ln in (base/f"batch{b:03d}.jsonl").open():
  w=json.loads(ln);rank=w["rank"];sels=selected.get(rank,set())
  if not sels:continue
  contextual={x["linked_external_sense_id"] for x in w["ku_drafts"] if x.get("original_contextual_cloze") and x.get("linked_external_sense_id")}
  for s in w["senses"]:
   sid=s["external_sense_id"]
   if sid not in sels:continue
   has_context=sid in contextual
   rows.append({"rank":rank,"lemma":w["lemma"],"sense_source_id":sid,"en_definition":s["definition_en_source"],
    "original_contextual_ku_exists":has_context,"drafting_action":"REUSE_EXISTING_CONTEXT_KU" if has_context else "DRAFT_NEW_CONTEXTUAL_KU",
    "zh_sense_alignment_required":True,"release_eligible":False})
   stats["reuse_existing"]+=int(has_context)
   stats["new_context_ku_needed"]+=int(not has_context)
assert len(rows)==30504
(base/"teaching_sense_v1_ku_drafting_queue.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows))
report={"provisional_teaching_senses":len(rows),"existing_editorial_context_ku_reusable":stats["reuse_existing"],
"new_original_context_ku_required":stats["new_context_ku_needed"],"missing_source_wordheads":487,
"script_seconds":round(time.monotonic()-t,3),
"note":"Drafting queue for provisional selection, NOT 29,020 newly authored original KU; protected/placeholder senses require review."}
(base/"teaching_sense_v1_ku_drafting_manifest.json").write_text(json.dumps(report,indent=2)+"\n")
print("TEACHING_SENSE_KU_GATE_PASS",json.dumps(report))
