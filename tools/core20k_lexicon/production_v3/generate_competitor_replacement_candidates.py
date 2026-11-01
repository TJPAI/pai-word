#!/usr/bin/env python3
"""Build isolated, reproducible alternatives for high-priority ambiguous recognition KUs.
No source KU, Sense or runtime changes. Replacement suggestions require semantic review.
"""
import json,pathlib,collections,re,hashlib
B=pathlib.Path(__file__).resolve().parent
D=B/"teaching_qa/full_recognition_audit"
read=lambda p:[json.loads(x) for x in p.read_text(encoding="utf8").splitlines() if x.strip()]
cases=read(D/"semantic_triage_high_confidence_multiple_answer.jsonl")
assert len(cases)==64
idx=read(B/"ku_selected_draft_index.jsonl")
idx=[x for x in idx if ":recognition:" in x.get("ku_id","")]
idx.sort(key=lambda x:(int(re.search(r"rank:(\d+)",x["teaching_sense_id"]).group(1)),x["teaching_sense_id"],x["ku_id"]))
lookup={x["ku_id"]:x for x in idx}
cache={}
def source(ix):
 p=B/ix["selected_file"]
 if p not in cache:cache[p]=read(p)
 return cache[p][ix["selected_line"]-1]
# Distinct source-verified option candidates from the nearby sorted rank neighborhood.
# Important: heuristic POS and lexical checks are NOT proof of semantic distinction.
rows=[];flag_counts=collections.Counter()
for case in cases:
 ix=lookup.get(case["ku_id"])
 if not ix:raise ValueError("Missing canonical KU "+case["ku_id"])
 original=source(ix)
 if original.get("ku_id")!=case["ku_id"] or original.get("teaching_sense_id")!=case["teaching_sense_id"]:
  raise ValueError("Source/index identity mismatch")
 answer=original["response"];options=original["options"];competing=case["competing_options"]
 if len(options)!=4 or answer not in options or not all(x in options for x in competing):
  raise ValueError("Option contract changed "+case["ku_id"])
 pos=original.get("pos");meaning=str(original.get("gloss_en") or original.get("definition_en") or "").strip().casefold()
 rank=int(ix["teaching_sense_id"].split("rank:")[1].split("::")[0])
 candidates=[]
 # Nearby rank candidates are merely review suggestions, never certified answers/distractors.
 for offset in range(1,80):
  for at in (rank-offset,rank+offset):
   # rank here is a *word rank*, not position in index. Deliberately scan matching rank.
   if len(candidates)>=6:break
   possible=next((item for item in idx if item["teaching_sense_id"].startswith(f"core20k:rank:{at}::")),None)
   if not possible:continue
   other=source(possible)
   lemma=other.get("lemma")
   if not isinstance(lemma,str) or not lemma or lemma.casefold() in {str(x).casefold() for x in options+candidates}:continue
   if pos and other.get("pos")!=pos:continue
   other_definition=str(other.get("gloss_en") or other.get("definition_en") or "").strip().casefold()
   if not other_definition or other_definition==meaning:continue
   if any(w in other_definition.split() for w in [answer.casefold()]):continue
   candidates.append({"lemma":lemma,"pos":other.get("pos"),"gloss_en":other.get("gloss_en") or other.get("definition_en"),"evidence_ku_id":other["ku_id"]})
  if len(candidates)>=6:break
 proposed=None
 if candidates:
  replacement=candidates[0]["lemma"]
  proposed=[replacement if opt in competing else opt for opt in options]
  if len(set(x.casefold() for x in proposed))!=4:
   proposed=None
 status="CANDIDATE_NEEDS_EDITORIAL_APPROVAL" if proposed else "NO_SAFE_AUTOMATIC_CANDIDATE"
 flag_counts[status]+=1
 rows.append({"review_number":case["review_number"],"ku_id":case["ku_id"],"teaching_sense_id":case["teaching_sense_id"],"source":case["source"],"source_line":case["source_line"],"lemma":original["lemma"],"pos":pos,"definition_en":original.get("gloss_en") or original.get("definition_en"),"answer":answer,"original_options":options,"conflicting_options":competing,"candidate_options":proposed,"candidate_replacement_evidence":candidates,"status":status,"warning":"No semantic certification; proposed distractors must be checked for meaning, POS, usage and plausibility. Do not apply automatically."})
assert len(rows)==64
output=D/"replacement_candidates_high_priority_64.jsonl"
output.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows),encoding="utf8")
summary={"reviewed":len(rows),"candidate_status":dict(flag_counts),"source_ku_modified":False,"runtime_modified":False,"semantic_certified":False}
(D/"replacement_candidates_high_priority_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(summary,ensure_ascii=False))
