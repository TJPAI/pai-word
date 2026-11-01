#!/usr/bin/env python3
"""Read-only teaching eligibility audit of unified active recall review pack."""
import pathlib,json,collections,hashlib
B=pathlib.Path(__file__).resolve().parent
I=B/"qa_reports"/"active_recall_unified_review_pack_v1"/"review_pack.jsonl"
O=B/"qa_reports"/"active_recall_release_gate_v1";O.mkdir(parents=True,exist_ok=True)
expected="e9b9c158a5563ff6396be66d0993a5a0cd9ef6379c433cf2fd4d578862a68fac"
assert hashlib.sha256(I.read_bytes()).hexdigest()==expected,"baseline review pack changed"
seen=set();senses=set();counts=collections.Counter();rows=0
examples=collections.defaultdict(list)
for line in I.open(encoding="utf8"):
 x=json.loads(line);rows+=1;k=x["ku_id"];sid=x["teaching_sense_id"]
 assert k not in seen and sid not in senses
 seen.add(k);senses.add(sid)
 assert x["response"]==x["lemma"] and x["response"] in x["answer_variants"]
 assert x["production_ready"] is False and x["release_eligible"] is False
 issues=[]
 if not x.get("pos"): issues.append("missing_pos")
 if x.get("ambiguity_review_needed"):issues.append("ambiguous_prompt")
 if x.get("question_format")=="contextual_cloze_draft": issues.append("contextual_cloze_requires_editorial_review")
 if x.get("single_answer_quiz_enabled") is False:issues.append("explicitly_disabled")
 if any(tag in x.get("gloss_zh","") for tag in ["词头疑应为","原定义疑似错误","原定义与"]):issues.append("source_semantic_dispute")
 if not x.get("question"):issues.append("missing_question")
 # Passing these gates is only an unreviewed candidate, never semantic certification.
 group="hold_for_review" if issues else "structurally_clean_unverified"
 counts[group]+=1
 for reason in issues:
  counts[reason]+=1
  if len(examples[reason])<6:examples[reason].append({"ku_id":k,"lemma":x["lemma"],"gloss_zh":x.get("gloss_zh")})
assert rows==27471 and len(seen)==len(senses)==27471
summary={"total":rows,"unique_ku":len(seen),"unique_sense":len(senses),"status_counts":dict(counts),"examples":dict(examples),"policy":"structurally_clean_unverified is NOT release-approved; semantic uniqueness not checked","formal_release_eligible":0,"source_modified":False,"runtime_modified":False}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("RELEASE_GATE_AUDIT",json.dumps({k:v for k,v in summary.items() if k!="examples"},ensure_ascii=False))
