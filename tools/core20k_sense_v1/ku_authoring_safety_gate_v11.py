#!/usr/bin/env python3
"""V11: executable correction of unsupported placeholder KU authoring.
Keep source and Sense selection drafts immutable; quarantine 4176 coverage placeholders.
"""
import pathlib,json,collections,time
start=time.monotonic()
hits=list(pathlib.Path(".").rglob("teaching_sense_v1_ku_drafting_queue.jsonl"))
assert len(hits)==1
base=hits[0].parent
mask={ (x["rank"],x["source_sense_id"]):x["teaching_v1_inclusion_proposal"] for ln in (base/"teaching_sense_v1_provisional_selection.jsonl").open() if (x:=json.loads(ln))}
rows=[json.loads(ln) for ln in hits[0].open()]
counts=collections.Counter();safe=[];blocked=[]
for row in rows:
    kind=mask[(row["rank"],row["sense_source_id"])]
    if kind=="INCLUDE_COVERAGE_PLACEHOLDER_REVIEW":
        row["ku_drafting_status"]="BLOCKED_UNSUPPORTED_PREFERRED_SENSE"
        row["original_context_ku_can_be_generated_now"]=False
        blocked.append(row);counts["blocked_placeholder"]+=1
    elif kind=="INCLUDE_SINGLE_SENSE_PROTECTED":
        row["ku_drafting_status"]="SEMANTIC_REVIEW_BEFORE_AUTHORED_KU"
        row["original_context_ku_can_be_generated_now"]=False
        blocked.append(row);counts["blocked_single_sense_without_usage"]+=1
    else:
        row["ku_drafting_status"]="STAGING_CONTENT_DRAFT_ALLOWED_NOT_CERTIFIED"
        row["original_context_ku_can_be_generated_now"]=True
        safe.append(row);counts["draft_allowed"]+=1
assert len(rows)==30504 and counts["blocked_placeholder"]==4176
for name,records in (("ku_draft_allowed_v11.jsonl",safe),("ku_draft_blocked_v11.jsonl",blocked)):
    (base/name).write_text("".join(json.dumps(v,ensure_ascii=False)+"\n" for v in records),encoding="utf8")
r={"prior_ku_queue":len(rows),"draft_allowed":len(safe),"blocked_placeholder":counts["blocked_placeholder"],
"blocked_single_sense":counts["blocked_single_sense_without_usage"],"total_blocked":len(blocked),
"selection_mask_not_mutated":True,"source_data_not_mutated":True,"reviewed_ku_newly_created":0,
"elapsed_seconds":round(time.monotonic()-start,3),
"note":"Allowed means original-context drafting may start in staging, not verified Sense correctness."}
(base/"ku_authoring_safety_v11_manifest.json").write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("KU_AUTHORING_SAFETY_GATE_V11_PASS",json.dumps(r,ensure_ascii=False))
