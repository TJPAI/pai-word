#!/usr/bin/env python3
"""Assemble immutable review-only teaching pack; never mark records release ready."""
import pathlib,json,hashlib,collections
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";D=B/"ku_drafts"/"v3_active_recall"
O=R/"active_recall_unified_review_pack_v1";O.mkdir(parents=True,exist_ok=True)
records={}
for f in sorted(D.glob("active_recall_*.jsonl")):
 for line in f.read_text(encoding="utf8").splitlines():
  x=json.loads(line);k=x["ku_id"];assert k not in records;records[k]=x
assert len(records)==27471
sources=[("V2","active_recall_revised_v2","revised_records.jsonl"),("V3","active_recall_revised_v3","revised_records.jsonl"),("V4","active_recall_revised_v4","revised_records.jsonl"),("V5","active_recall_revised_v5","revised_records.jsonl")]
sources += [(v.upper(),"active_recall_"+v+"_contextual","curated_candidates.jsonl") for v in ("v7","v8","v9","v10")]
change_count=collections.Counter();last_source={}
for label,folder,name in sources:
 p=R/folder/name;batch=set()
 for line in p.read_text(encoding="utf8").splitlines():
  x=json.loads(line);k=x["ku_id"];assert k in records and k not in batch,(label,k);batch.add(k)
  original=records[k]
  assert (x["response"],x["teaching_sense_id"],x["answer_variants"])==(original["response"],original["teaching_sense_id"],original["answer_variants"])
  assert x["production_ready"] is False and x["release_eligible"] is False
  # Overlay versions are full records based on older baselines. Preserve earlier clean gloss and POS unless a later layer explicitly improves them.
  merged=dict(original)
  for field,value in x.items():
   if field in ("gloss_zh","pos") and (value is None or (field=="gloss_zh" and "+" in value and "+" not in original.get(field,""))):continue
   if field=="question" and "+" in value and "+" not in original.get("gloss_zh","") and "+" not in merged.get("gloss_zh",""):continue
   merged[field]=value
  records[k]=merged;last_source[k]=label
 change_count[label]=len(batch)
unresolved=set()
for line in (R/"active_recall_v11_context_qa"/"remaining_five.jsonl").read_text().splitlines():
 unresolved.add(json.loads(line)["ku_id"])
assert len(unresolved)==5
for k,x in records.items():
 x["production_ready"]=False;x["release_eligible"]=False
 x["review_pack_only"]=True
 x["single_answer_verified"]=False
 if k in unresolved:
  x["editorial_review_needed"]=True
  x["recommended_learning_mode"]="recognition_until_reviewed"
  x["single_answer_quiz_enabled"]=False
 if x.get("ambiguity_review_needed"):
  x["editorial_review_needed"]=True
# Final global structural checks, detect stale note or stale plus leaks for review.
assert len(records)==len({x["teaching_sense_id"] for x in records.values()})==27471
assert all(x["response"] in x["answer_variants"] for x in records.values())
stats=collections.Counter()
for x in records.values():
 if "+" in x.get("gloss_zh",""):stats["plus_gloss_remaining"]+=1
 if not x.get("pos"):stats["pos_missing"]+=1
 if x.get("ambiguity_review_needed"):stats["ambiguity_flagged"]+=1
 if x.get("question_format")=="contextual_cloze_draft":stats["contextual_candidates"]+=1
 if not x.get("question"):stats["missing_question"]+=1
with (O/"review_pack.jsonl").open("w",encoding="utf8") as f:
 for x in sorted(records.values(),key=lambda x:(int(x["rank"]),x["teaching_sense_id"])):
  f.write(json.dumps(x,ensure_ascii=False)+"\n")
p=O/"review_pack.jsonl"
summary={"total":27471,"unique_ku":len(records),"unique_sense":len({x["teaching_sense_id"] for x in records.values()}),"source_overlay_counts":dict(change_count),"final_stats":dict(stats),"unresolved_five_disabled_single_answer":5,"release_ready":False,"runtime_modified":False,"original_files_modified":False,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("UNIFIED_REVIEW_PACK",json.dumps(summary,ensure_ascii=False))
