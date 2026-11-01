#!/usr/bin/env python3
"""Muse patchC preconditioned mapping proposals. Never mutate existing rank/ID/answer."""
import json,pathlib,collections,hashlib
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports"
base=R/"active_recall_unified_review_pack_v1"/"review_pack.jsonl"
assert hashlib.sha256(base.read_bytes()).hexdigest()=="e9b9c158a5563ff6396be66d0993a5a0cd9ef6379c433cf2fd4d578862a68fac"
original={x["ku_id"]:x for x in (json.loads(t) for t in base.read_text().splitlines())}
patch=R/"mu-independent-audit-v20261101"/"patchC_headword_mismatch98.jsonl"
rows=[json.loads(t) for t in patch.read_text().splitlines()]
assert len(rows)==98
seen=set();keep=[];fix=[];blocked=[]
for x in rows:
 k=x["ku_id"];assert k not in seen;seen.add(k);o=original.get(k)
 reasons=[]
 if not o:reasons.append("missing_id")
 else:
  for f in ("teaching_sense_id","rank","lemma","gloss_zh","gloss_en"):
   if x.get(f)!=o.get(f):reasons.append(f+"_mismatch")
 if x["action"]=="KEEP":
  if reasons:blocked.append({"ku_id":k,"reasons":reasons})
  else:keep.append({"ku_id":k,"action":"KEEP","lemma":o["lemma"],"reason":x.get("note","")})
 elif x["action"]=="FIX_LEMMA":
  if not x.get("correct_headword") or x["correct_headword"]==x["lemma"]:reasons.append("invalid_target")
  if reasons:blocked.append({"ku_id":k,"reasons":reasons})
  else:
   fix.append({"ku_id":k,"teaching_sense_id":o["teaching_sense_id"],"rank":o["rank"],"lemma_current":o["lemma"],"lemma_proposed":x["correct_headword"],"response_current":o["response"],"status":"mapping_review_required","action":"DO_NOT_CHANGE_RANK_OR_ANSWER_AUTOMATICALLY","note":x.get("note","")})
 else:blocked.append({"ku_id":k,"reasons":["unknown_action"]})
O=R/"cg_enlex_mu_patchC_v1";O.mkdir(exist_ok=True)
for name,items in (("fix_mapping_candidates.jsonl",fix),("keep_verified.jsonl",keep),("blocked.jsonl",blocked)):
 with (O/name).open("w") as f:
  for x in items:f.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"input":len(rows),"fix_mapping_candidates":len(fix),"keep":len(keep),"blocked":len(blocked),"rank_or_existing_ku_modified":False,"runtime_modified":False,"candidate_only":True,"sha256":hashlib.sha256((O/"fix_mapping_candidates.jsonl").read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n")
print("PATCHC",json.dumps(summary))
