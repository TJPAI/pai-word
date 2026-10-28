#!/usr/bin/env python3
"""Fast incremental selection from a frozen prior GitHub Actions artifact.
Measure actual changes separately from record scans; do not fabricate semantic certification.
"""
import json,pathlib,time,collections
t=time.perf_counter()
candidates=list(pathlib.Path(".").rglob("sense_selection_v4_review_manifest.json"))
assert len(candidates)==1, f"Expected unique downloaded manifest; found {len(candidates)}: {candidates[:6]}"
base=candidates[0].parent
print("FROZEN_ARTIFACT_ROOT",base)
counts=collections.Counter();seen=set();expected=0
for batch in range(1,41):
 p=base/f"sense_selection_v3_decisions_batch{batch:03d}.jsonl"
 assert p.is_file(),p
 for line in p.open(encoding="utf8"):
  d=json.loads(line);key=(d["rank"],d["external_sense_id"])
  assert key not in seen;seen.add(key)
  counts[d["recommended_action"]]+=1
  expected+=1
assert expected==60204
source=json.loads((base/"sense_selection_v4_review_manifest.json").read_text(encoding="utf8"))
assert source["defer_candidates"]==5931 and source["exact_definition_merge_candidates"]==26
elapsed=round(time.perf_counter()-t,3)
report={"pipeline":"incremental-selection-from-frozen-artifact","input_source_run_id":40684148197,
"source_senses_scanned":expected,"decision_proposals":dict(counts),"evidence_confirmed_defer":0,
"evidence_confirmed_merge":0,"usable_final_selection_delta":0,"runtime_seconds":elapsed,
"scan_rate_per_second":round(expected/max(elapsed,.001),1),
"productive_decision_rate":0,"bottleneck":"No attested sense-frequency or semantic adjudication; scan throughput is not meaningful selection productivity.",
"next_optimization":"Use tagged corpus or source sense-frequency annotations and sampled human/AI semantic decisions, then measure accepted KEEP/DEFER/MERGE."}
(base/"selection_efficiency_round1.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("INCREMENTAL_SELECTION_EFFICIENCY_PASS",json.dumps(report,ensure_ascii=False))
