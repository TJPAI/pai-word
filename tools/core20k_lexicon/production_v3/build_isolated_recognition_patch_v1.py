#!/usr/bin/env python3
"""Integrate 117 editorial proposals as source-verified, non-applicable sandbox patch."""
import pathlib,json,collections
B=pathlib.Path(__file__).resolve().parent;D=B/"teaching_qa/full_recognition_audit";O=D/"isolated_patch_v1";O.mkdir(exist_ok=True)
def read(n):return [json.loads(s) for s in (D/n).read_text(encoding="utf8").splitlines() if s.strip()]
a=read("curated_editorial_rewrites_28.jsonl");b=read("curated_editorial_rewrites_36.jsonl");c=read("curated_remaining_53.jsonl");lex={x["ku_id"]:x for x in read("lexical_15_source_review.jsonl")}
items=a+b+c;assert len(items)==117
cache={};out=[];stats=collections.Counter()
for x in items:
 src=B/x["source"]
 if src not in cache:cache[src]=[json.loads(s) for s in src.read_text(encoding="utf8").splitlines() if s.strip()]
 original=cache[src][x["source_line"]-1]
 assert original["ku_id"]==x["ku_id"]
 opts=x.get("editorially_proposed_options",x.get("proposed_options"))
 definition=x.get("proposed_definition")
 hold=None
 if x["ku_id"] in lex:
  le=lex[x["ku_id"]]
  if le["status"]=="HOLD_SOURCE_SENSE_REVIEW":
   hold="SENSE_IDENTITY_REQUIRES_LEXICAL_REVIEW";opts=None;definition=None
  else:opts=le["proposed_options"]
 if opts is not None:
  assert len(opts)==4 and len(set(z.casefold() for z in opts))==4 and original["response"] in opts
  assert opts.index(original["response"])==original["options"].index(original["response"])
 if opts is None and definition is None and hold is None:hold="NO_RESOLVED_EDIT"
 status="HOLD" if hold else "CANDIDATE_ONLY"
 stats[status]+=1
 out.append({"review_number":x["review_number"],"ku_id":original["ku_id"],"teaching_sense_id":original["teaching_sense_id"],"source":x["source"],"source_line":x["source_line"],"original":{"lemma":original["lemma"],"pos":original["pos"],"gloss_en":original.get("gloss_en"),"gloss_zh":original.get("gloss_zh"),"options":original["options"],"response":original["response"]},"candidate_changes":{"options":opts,"gloss_en":definition},"status":status,"blocker":hold,"approved_for_application":False,"runtime_eligible":False})
out.sort(key=lambda v:v["review_number"])
assert len(out)==117 and len({z["ku_id"] for z in out})==117
(O/"recognition_patch_candidates_117.jsonl").write_text("".join(json.dumps(z,ensure_ascii=False)+"\n" for z in out),encoding="utf8")
summary={"records":117,"status":dict(stats),"source_ku_modified":False,"sense_modified":False,"runtime_modified":False,"semantic_certified":0,"auto_apply":False}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(summary))
