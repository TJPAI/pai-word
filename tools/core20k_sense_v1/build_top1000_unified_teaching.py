#!/usr/bin/env python3
"""Consolidate top1000 lexical and structural teaching candidates, keep semantic QA gates."""
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/release/v2.1-top1000")
read=lambda f:[json.loads(line) for line in (p/f).open(encoding="utf8") if line.strip()]
lex=read("top1000_sense_recognition_ku_staging.jsonl")
struct=read("top1000_structural_ku_staging.jsonl")
assert len(lex)==2465 and len(struct)==19
allrows=[];used=set();stats=collections.Counter()
for r in lex:
 ident=r["ku_id"];assert ident not in used;used.add(ident)
 # Existing lexical Sense identifier remains draft-only until reviewed.
 assert r["canonical_sense_id"] is None and r["release_eligible"] is False
 allrows.append({"headword_id":r["headword_id"],"rank":r["rank"],"lemma":r["lemma"],
  "ku_id":ident,"ku_type":"sense","render_kind":r["render_kind"],
  "question":r["question"],"response":r["response"],"draft_sense_key":r["draft_sense_key"],
  "origin":"V206_INHERITED","release_eligible":False,"production_ready":False})
 stats["legacy_sense_review"]+=1
for r in struct:
 ident=r["draft_ku_id"];assert ident not in used;used.add(ident)
 assert r["correct_answer"].casefold()==r["lemma"].casefold()
 allrows.append({"headword_id":r["headword_id"],"rank":r["rank"],"lemma":r["lemma"],
  "ku_id":ident,"ku_type":"grammar","render_kind":"cloze",
  "question":r["question"],"response":{"correct_answer":r["correct_answer"],
  "acceptable_answers":r["acceptable_answers"],"explanation_zh":r["explanation_zh"]},
  "draft_sense_key":None,"origin":"V21_NEW_EDITORIAL_STAGING",
  "release_eligible":False,"production_ready":False})
 stats["new_structural_review"]+=1
assert len(allrows)==2484
assert {x["rank"] for x in allrows}==set(range(1,1001))
with (p/"top1000_unified_teaching_review.jsonl").open("w",encoding="utf8") as f:
 for r in sorted(allrows,key=lambda x:(x["rank"],x["ku_id"])):
  f.write(json.dumps(r,ensure_ascii=False)+"\n")
report={"top1000_headwords":1000,"teaching_candidates":len(allrows),"source_counts":dict(stats),
 "unique_ku_ids":len(used),"certified_new_ku":0,"activation_allowed":False,
 "warning":"Legacy recognition prompts are not verified to be uniquely answerable; this is a staging review pack."}
(p/"top1000_unified_teaching_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("TOP1000_UNIFIED_TEACHING_PASS",json.dumps(report,ensure_ascii=False))
