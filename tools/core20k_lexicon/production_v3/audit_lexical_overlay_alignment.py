#!/usr/bin/env python3
"""Read-only semantic linkage QA: 539 Chinese editorial proposals vs V93 and selected KU index."""
import json,pathlib,collections
B=pathlib.Path(__file__).resolve().parent
def records(paths):
 for p in paths:
  for line in p.read_text(encoding="utf8").splitlines():
   if line.strip():yield json.loads(line)
src=list(records(sorted(B.glob("recovery/v93_register_20261030/shards/senses_*.jsonl"))))
v93={x["teaching_sense_id"]:x for x in src}
overlay=list(records([B/"lexical_review_overlay_v1.jsonl"]))
selected=list(records([B/"ku_selected_draft_index.jsonl"]))
ku_by_sense=collections.Counter(x["teaching_sense_id"] for x in selected)
issues=[];mapped=0;exact_en=0;source_zh_match=0
for x in overlay:
 sid=x["teaching_sense_id"];orig=v93.get(sid)
 if not orig:issues.append({"id":sid,"type":"missing_v93_sense"});continue
 if orig.get("lemma")!=x.get("lemma"):issues.append({"id":sid,"type":"lemma_mismatch"})
 if orig.get("definition_en")==x.get("definition_en"):exact_en+=1
 else:issues.append({"id":sid,"type":"english_definition_mismatch","original":orig.get("definition_en"),"review":x.get("definition_en")})
 if ku_by_sense[sid]:mapped+=1
 else:issues.append({"id":sid,"type":"not_in_selected_ku_index"})
 zhvalues=[v.get("value") for v in orig.get("zh_candidates",[]) if isinstance(v,dict)]
 if x.get("recommended_gloss_zh") in zhvalues:source_zh_match+=1
 if x.get("release_eligible") is not False:issues.append({"id":sid,"type":"unexpected_release_flag"})
summary={"v93_source_rows":len(src),"v93_unique_ids":len(v93),"selected_ku_index_rows":len(selected),"overlay_rows":len(overlay),"overlay_unique_ids":len({x["teaching_sense_id"] for x in overlay}),"mapped_to_selected_ku":mapped,"exact_source_english_definition":exact_en,"recommended_zh_exact_source_candidate":source_zh_match,"issue_count":len(issues),"issue_types":dict(collections.Counter(x["type"] for x in issues)),"issue_samples":issues[:60],"manual_semantic_review_pending":True,"release_eligible":False}
(B/"lexical_overlay_alignment_report.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({k:v for k,v in summary.items() if k!="issue_samples"},ensure_ascii=False))
if len(v93)!=27471 or len(overlay)!=539 or len({x["teaching_sense_id"] for x in overlay})!=539:raise SystemExit("Coverage invariants failed")
