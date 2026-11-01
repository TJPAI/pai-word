#!/usr/bin/env python3
"""Source-backed conservative gate for 117 editorial proposals; never apply automatically."""
import pathlib,json,collections
B=pathlib.Path(__file__).resolve().parent;D=B/"teaching_qa/full_recognition_audit"
def read(p):return [json.loads(s) for s in (D/p).read_text(encoding="utf8").splitlines() if s.strip()]
a=read("curated_editorial_rewrites_28.jsonl");b=read("curated_editorial_rewrites_36.jsonl");c=read("curated_remaining_53.jsonl")
assert (len(a),len(b),len(c))==(28,36,53)
all_rows=[];cnt=collections.Counter();cache={}
for item in a+b+c:
 p=B/item["source"]
 if p not in cache:cache[p]=[json.loads(s) for s in p.read_text(encoding="utf8").splitlines() if s.strip()]
 original=cache[p][item["source_line"]-1]
 if original["ku_id"]!=item["ku_id"]:raise ValueError("Source KU mismatch")
 original_opts=original["options"];answer=original["response"];definition=original.get("gloss_en")
 opts=item.get("editorially_proposed_options",item.get("proposed_options"))
 if opts is not None:
  if item.get("original_options")!=original_opts or item.get("correct_answer",item.get("answer"))!=answer:raise ValueError("Proposal original mismatch")
  if len(opts)!=4 or len(set(x.casefold() for x in opts))!=4 or opts.index(answer)!=original_opts.index(answer):raise ValueError("Option contract mismatch")
  # A single unqualified definition may still permit alternate answers; do not approve any semantics automatically.
  if answer in {"get","likely","precisely","infinitely","intentionally","purposely","hereinafter"}:
   status="REVISE_BEFORE_RELEASE";reason="Register/polysemy/answer ambiguity or weak contrast in manually proposed distractors"
  elif answer in {"morass","limousine","limo","sledge","pacify","clank","trite","everlasting","unending","mender"}:
   status="REVISE_BEFORE_RELEASE";reason="One or more distractors remain overly close, overly obvious, or require grammatical review"
  else:
   status="SEMANTIC_REVIEW_PENDING";reason="Four-option structure valid, but meaning and distractor difficulty not certified"
 else:
  status="LEXICAL_SOURCE_CHECK_REQUIRED" if item["action_type"]=="VERIFY_LEXICAL_SENSE_FIRST" else "CONTEXT_CLUE_REVIEW_PENDING"
  reason="Verify source Sense mapping before editing" if item["action_type"]=="VERIFY_LEXICAL_SENSE_FIRST" else "New definition may still admit other options; requires all-options comparison"
 cnt[status]+=1
 all_rows.append({"review_number":item["review_number"],"ku_id":item["ku_id"],"lemma":original["lemma"],"source":item["source"],"source_line":item["source_line"],"original_options":original_opts,"original_definition":definition,"proposed_options":opts,"proposed_definition":item.get("proposed_definition"),"decision":status,"reason":reason,"original_source_verified":True,"approved_for_application":False})
assert len(all_rows)==117 and len({x["ku_id"] for x in all_rows})==117
all_rows.sort(key=lambda x:x["review_number"])
(D/"semantic_gate_117.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in all_rows),encoding="utf8")
summary={"source_verified_records":117,"duplicate_ids":0,"status":dict(cnt),"semantically_approved":0,"source_files_modified":False,"release_ready":False}
(D/"semantic_gate_117_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(summary))
