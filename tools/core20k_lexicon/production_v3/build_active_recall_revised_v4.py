#!/usr/bin/env python3
"""V4: semantic cues from existing English gloss; avoid target answer leakage."""
import pathlib,json,re,hashlib,collections
B=pathlib.Path(__file__).resolve().parent
V=B/"qa_reports"/"active_recall_revised_v3"/"revised_records.jsonl"
O=B/"qa_reports"/"active_recall_revised_v4";O.mkdir(parents=True,exist_ok=True)
rows=[json.loads(z) for z in V.read_text(encoding="utf8").splitlines()]
assert len(rows)==5381
modified=[];review=[];stats=collections.Counter()
for x in rows:
 if not x.get("ambiguity_review_needed"):continue
 y=dict(x);en=(x.get("gloss_en") or "").strip()
 lemma=(x.get("lemma") or "").strip()
 # Source definitions are already attached to the original Sense; preserve provenance.
 # Reject hints that directly contain the answer or have inadequate content.
 leak=bool(re.search(r"(?<![A-Za-z])"+re.escape(lemma)+r"(?![A-Za-z])",en,re.I)) if lemma else True
 if len(en)<12 or leak or len(en)>450:
  stats["needs_manual_definition_review"]+=1
  review.append({"ku_id":x["ku_id"],"lemma":lemma,"gloss_en":en,"reason":"answer_leak_or_weak_definition"})
  continue
 prefix=x["question"].split("（提示：该释义可能对应多个英文词，请结合上下文辨析。）")[0]
 y["question"]=prefix+"\n英文语义线索："+en+"\n请根据中文释义与英文语义线索作答。"
 y["semantic_hint_source"]="existing_sense_gloss_en"
 y["semantic_hint_uniqueness_verified"]=False
 y["ambiguity_review_needed"]=True
 assert y["ku_id"]==x["ku_id"] and y["response"]==x["response"] and y["answer_variants"]==x["answer_variants"]
 assert y["release_eligible"] is False
 modified.append(y);stats["english_definition_cue_added"]+=1
with (O/"revised_records.jsonl").open("w",encoding="utf8") as f:
 for x in modified:f.write(json.dumps(x,ensure_ascii=False)+"\n")
with (O/"manual_review.jsonl").open("w",encoding="utf8") as f:
 for x in review:f.write(json.dumps(x,ensure_ascii=False)+"\n")
stats["source_ambiguity_records"]=sum(bool(x.get("ambiguity_review_needed")) for x in rows)
assert stats["english_definition_cue_added"]+stats["needs_manual_definition_review"]==stats["source_ambiguity_records"]
summary={"total_active_recall":27471,**stats,"definition_cues_unique_answer_guarantee":False,"overlay_only":True,"source_modified":False,"runtime_modified":False,"overlay_sha256":hashlib.sha256((O/"revised_records.jsonl").read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("V4",json.dumps(summary,ensure_ascii=False))
