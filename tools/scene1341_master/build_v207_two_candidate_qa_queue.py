#!/usr/bin/env python3
"""Create a deterministic low-branching QA review queue from the V206 native candidates."""
import argparse,collections,json,pathlib
p=argparse.ArgumentParser()
p.add_argument("--v206",required=True)
p.add_argument("--output",required=True)
a=p.parse_args()
src=json.load(open(a.v206,encoding="utf-8"))
assert src["total"]==292 and len(src["records"])==292
records=[]
for r in src["records"]:
 if len(r["candidates"])!=2: continue
 records.append({
  "source_final_row":r["source_final_row"],
  "record_id":r["record_id"],
  "scene_id":r["scene_id"],
  "expression":r["expression"],
  "cue_zh":r["cue_zh"],
  "ambiguity_type":r["ambiguity_type"],
  "native_ipa_candidates":r["native_ipa_candidates"],
  "native_candidates":r["candidates"],
  "selected_native_sense":None,
  "qa_stage_label":"待审",
  "release_allowed":False,
 })
records.sort(key=lambda r:(r["scene_id"],r["source_final_row"]))
assert len(records)==43
counts=collections.Counter(r["scene_id"] for r in records)
out={"version":"V207","source":"V206 original Kaikki ambiguity evidence queue","total":len(records),"scene_counts":dict(sorted(counts.items())),"purpose":"43 low-branching two-native-candidate records for human/independent AI disambiguation","guardrail":"No automatic semantic adjudication or QA promotion","qa_stage_label":"待审","formal_ready":0,"records":records}
pathlib.Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"total":len(records),"scene_counts":out["scene_counts"]},ensure_ascii=False))
