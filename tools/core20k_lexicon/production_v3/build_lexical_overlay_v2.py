#!/usr/bin/env python3
"""Apply explicitly reviewed corrections to the immutable V1 draft overlay."""
import json,pathlib
B=pathlib.Path(__file__).resolve().parent
def lines(p):
 return [json.loads(x) for x in (B/p).read_text(encoding="utf8").splitlines() if x.strip()]
original=lines("lexical_review_overlay_v1.jsonl")
patches=lines("lexical_review_corrections_001.jsonl")
assert len(original)==539 and len({x["teaching_sense_id"] for x in original})==539
byid={r["teaching_sense_id"]:dict(r) for r in original}
changes=[]
for patch in patches:
 sid=patch["teaching_sense_id"]
 if sid not in byid:raise ValueError("Unknown Sense ID "+sid)
 if not patch.get("replacement_gloss_zh") or patch.get("release_eligible") is not False or patch.get("overwrite_original") is not False:raise ValueError("Invalid patch")
 current=byid[sid]
 before=current["recommended_gloss_zh"]
 current["recommended_gloss_zh"]=patch["replacement_gloss_zh"]
 current["requires_english_definition_review"]=bool(patch.get("source_definition_issue"))
 current["review_status"]="editorial_correction_proposal"
 changes.append({"teaching_sense_id":sid,"before":before,"after":current["recommended_gloss_zh"]})
assert len({x["teaching_sense_id"] for x in byid.values()})==539
assert all(x["release_eligible"] is False for x in byid.values())
out=B/"lexical_review_overlay_v2.jsonl"
out.write_text("".join(json.dumps(byid[x["teaching_sense_id"]],ensure_ascii=False,separators=(",",":"))+"\n" for x in original),encoding="utf8")
summary={"records":539,"unique_sense_ids":539,"corrections_applied":len(changes),"changes":changes,"english_definitions_untouched":True,"runtime_pack_untouched":True,"release_eligible":False}
(B/"lexical_review_overlay_v2_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(summary,ensure_ascii=False))
