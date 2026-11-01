#!/usr/bin/env python3
"""Safe, review-only patchA application with exact-old-value preconditions."""
import json,pathlib,hashlib,collections
B=pathlib.Path(__file__).resolve().parent
R=B/"qa_reports";MU=R/"mu-independent-audit-v20261101"
I=R/"active_recall_unified_review_pack_v1"/"review_pack.jsonl"
O=R/"cg_enlex_mu_patchA_v1";O.mkdir(exist_ok=True)
assert hashlib.sha256(I.read_bytes()).hexdigest()=="e9b9c158a5563ff6396be66d0993a5a0cd9ef6379c433cf2fd4d578862a68fac"
records={}
for line in I.open(encoding="utf8"):
 x=json.loads(line);records[x["ku_id"]]=x
assert len(records)==27471
patches=[json.loads(x) for x in (MU/"patchA_confirmed_zh_errors.jsonl").read_text(encoding="utf8").splitlines()]
assert len({x["ku_id"] for x in patches})==len(patches)
applied=[];blocked=[];stat=collections.Counter()
for p in patches:
 k=p["ku_id"];old=records.get(k)
 reason=None
 if old is None: reason="missing_ku_id"
 elif p.get("action")!="FIX_GLOSS_ZH":reason="unexpected_action"
 elif old["teaching_sense_id"]!=p["teaching_sense_id"]:reason="sense_id_conflict"
 elif old["gloss_zh"]!=p["gloss_zh_current"]:reason="old_zh_mismatch"
 elif old["gloss_en"]!=p["gloss_en"]:reason="source_english_mismatch"
 elif old["lemma"]!=p["lemma"]:reason="headword_mismatch"
 elif not p["proposed_gloss_zh"].strip():reason="empty_proposal"
 if reason:
  blocked.append({"ku_id":k,"reason":reason,"patch":p});stat[reason]+=1;continue
 new=dict(old);new["gloss_zh"]=p["proposed_gloss_zh"]
 # Original question may include the obsolete Chinese meaning in more than one place.
 question=old["question"]
 if p["gloss_zh_current"] in question:
  new["question"]=question.replace(p["gloss_zh_current"],p["proposed_gloss_zh"])
  new["question_updated_from_old_zh"]=True
 else:
  new["question"]=question
  new["question_requires_editorial_rebuild"]=True
  stat["question_requires_editorial_rebuild"]+=1
 new.update({"production_ready":False,"release_eligible":False,"single_answer_verified":False,"editorial_review_needed":True,"mu_patch_source":"patchA_confirmed_zh_errors.jsonl","mu_patch_applied":"candidate_only"})
 assert new["ku_id"]==old["ku_id"] and new["response"]==old["response"] and new["answer_variants"]==old["answer_variants"]
 applied.append(new)
for fname,items in (("candidate_overlay.jsonl",applied),("blocked.jsonl",blocked)):
 with (O/fname).open("w",encoding="utf8") as f:
  for item in items:f.write(json.dumps(item,ensure_ascii=False)+"\n")
summary={"input_patches":len(patches),"candidate_applied":len(applied),"blocked":len(blocked),"reason_counts":dict(stat),"baseline_total":len(records),"runtime_modified":False,"source_modified":False,"candidate_only":True,"overlay_sha256":hashlib.sha256((O/"candidate_overlay.jsonl").read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("PATCHA SAFE CANDIDATE",json.dumps(summary,ensure_ascii=False))
