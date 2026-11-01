#!/usr/bin/env python3
"""V5 conservative clue salvage for V4 manual-review candidates; no forced semantics."""
import json,pathlib,re,hashlib,collections
B=pathlib.Path(__file__).resolve().parent
q=B/"qa_reports"/"active_recall_revised_v4"/"manual_review.jsonl"
v3=B/"qa_reports"/"active_recall_revised_v3"/"revised_records.jsonl"
O=B/"qa_reports"/"active_recall_revised_v5";O.mkdir(parents=True,exist_ok=True)
candidates=[json.loads(x) for x in q.read_text().splitlines()]
by_id={x["ku_id"]:x for x in (json.loads(x) for x in v3.read_text().splitlines())}
assert len(candidates)==322
fixed=[];deferred=[];reasons=collections.Counter()
for item in candidates:
 x=by_id[item["ku_id"]];gloss=(x.get("gloss_en") or "").strip();lemma=x["lemma"]
 pattern=re.compile(r"(?<![A-Za-z])"+re.escape(lemma)+r"(?![A-Za-z])",re.I)
 match_count=len(pattern.findall(gloss))
 if not match_count:
  deferred.append({"ku_id":x["ku_id"],"lemma":lemma,"gloss_en":gloss,"reason":"insufficient_nonleaking_definition"});reasons["weak_definition"]+=1;continue
 masked=pattern.sub("____",gloss)
 # Do not use near-empty or tautological definitions as teaching hints.
 residual=re.sub(r"[_\\W]+"," ",masked).strip()
 if len(residual)<18 or len(residual.split())<4:
  deferred.append({"ku_id":x["ku_id"],"lemma":lemma,"gloss_en":gloss,"masked_candidate":masked,"reason":"masked_definition_too_weak"});reasons["masked_too_weak"]+=1;continue
 y=dict(x)
 prefix=y["question"].split("（提示：该释义可能对应多个英文词，请结合上下文辨析。）")[0]
 y["question"]=prefix+"\n英文语义线索："+masked+"\n请根据中文释义与线索作答。"
 y["semantic_hint_source"]="existing_sense_gloss_en_masked"
 y["semantic_hint_uniqueness_verified"]=False
 y["ambiguity_review_needed"]=True
 assert not pattern.search(masked)
 assert y["response"]==x["response"] and y["ku_id"]==x["ku_id"] and not y["release_eligible"]
 fixed.append(y);reasons["masked_hint_added"]+=1
for name,items in [("revised_records.jsonl",fixed),("manual_review.jsonl",deferred)]:
 with (O/name).open("w") as f:
  for item in items:f.write(json.dumps(item,ensure_ascii=False)+"\n")
summary={"v4_manual_candidates":322,"v5_masked_definition_cues":len(fixed),"remain_manual_review":len(deferred),"reason_counts":dict(reasons),"unique_answer_verified":False,"source_modified":False,"runtime_modified":False,"revision_sha256":hashlib.sha256((O/"revised_records.jsonl").read_bytes()).hexdigest()}
assert len(fixed)+len(deferred)==322
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("V5_COMPLETE",json.dumps(summary,ensure_ascii=False))
