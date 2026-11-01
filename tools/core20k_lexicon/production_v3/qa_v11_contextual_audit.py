#!/usr/bin/env python3
"""Independent structural QA of V7-V10 contextual candidates; retain five unresolved source senses."""
import json,pathlib,re,collections,hashlib
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"active_recall_v11_context_qa";O.mkdir(parents=True,exist_ok=True)
allrows=[]
for v in ("v7","v8","v9","v10"):
 d=R/("active_recall_"+v+"_contextual")/"curated_candidates.jsonl"
 allrows.extend((v,json.loads(s)) for s in d.read_text().splitlines())
assert len(allrows)==130
seen=set();flags=[];c=collections.Counter()
for version,x in allrows:
 id=x["ku_id"];assert id not in seen;seen.add(id)
 lemma=x["lemma"];q=x["question"];sentence=q.splitlines()[-1]
 assert sentence.count("____")==1 and x["response"]==lemma
 assert not x["production_ready"] and not x["release_eligible"]
 if re.search(r"(?<![A-Za-z])"+re.escape(lemma)+r"(?![A-Za-z])",sentence,re.I):
  flags.append({"ku_id":id,"lemma":lemma,"version":version,"reason":"target_word_leaks_in_sentence","sentence":sentence});c["target_word_leaks_in_sentence"]+=1
 if not sentence.strip().endswith((".","?","!")):
  flags.append({"ku_id":id,"lemma":lemma,"version":version,"reason":"missing_terminal_punctuation","sentence":sentence});c["missing_terminal_punctuation"]+=1
 if len(sentence)<25:
  flags.append({"ku_id":id,"lemma":lemma,"version":version,"reason":"short_sentence","sentence":sentence});c["short_sentence"]+=1
 if "首字母：" not in q or "字母数：" not in q:
  flags.append({"ku_id":id,"lemma":lemma,"version":version,"reason":"missing_target_constraints","sentence":sentence});c["missing_target_constraints"]+=1
queue=[json.loads(s) for s in (R/"active_recall_v6_review"/"priority_review.jsonl").read_text().splitlines()]
remaining=[x for x in queue if x["ku_id"] not in seen]
assert len(remaining)==5
for file,rows in (("flags.jsonl",flags),("remaining_five.jsonl",remaining)):
 with (O/file).open("w",encoding="utf8") as f:
  for row in rows:f.write(json.dumps(row,ensure_ascii=False)+"\n")
summary={"source_queue":135,"contextual_candidates_checked":130,"distinct_ku_ids":len(seen),"remaining_unrewritten":5,"mechanical_flag_counts":dict(c),"semantic_answer_uniqueness_validated":False,"original_data_modified":False,"runtime_modified":False,"flags_sha256":hashlib.sha256((O/"flags.jsonl").read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("V11_CONTEXT_QA",json.dumps(summary,ensure_ascii=False))
