#!/usr/bin/env python3
"""Recover 27 existing collocation KUs from authoritative runtime; quarantine ambiguous prompts.
Strictly a staging review pack, never production.
"""
import json,gzip,re,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/editorial");p.mkdir(parents=True,exist_ok=True)
src=pathlib.Path("tools/core20k_lexicon/runtime/v1/batch69_collocation_cloze_27.jsonl")
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f: data=json.load(f)
words=data["headwords"];assert len(words)==20000
ku_lookup={};lemmas={}
for rank,lemma,pos,ipa,kus,*_ in words:
 lemmas[rank]=lemma
 for ku in kus:
  if len(ku)>=1:ku_lookup.setdefault(str(ku[0]),[]).append((rank,lemma,pos))
issues=collections.Counter();output=[]
for line in src.open(encoding="utf8"):
 r=json.loads(line)
 id=r["ku_id"];match=re.fullmatch(r"w_\d+_([a-z]+)_ku\d+",id)
 expected=match.group(1) if match else None
 candidates=[x for x in ku_lookup.get(id,[]) if x[1].casefold()==expected]
 # Some legacy IDs may not exist in the runtime. Never manufacture Rank or Sense ID.
 prompt=r["prompt_draft"];answer=r["correct_answer_draft"]
 # Most raw fragments have multiple valid completions; flag for contextual revision.
 needs_context= not any(ch in prompt for ch in ".?!")
 if not candidates: issues["unresolved_authority"]+=1
 if needs_context:issues["fragments_requiring_context"]+=1
 record={"legacy_ku_id":id,"lemma":expected,"verified_rank":candidates[0][0] if len(candidates)==1 else None,
 "headword_id":f"core20k:rank:{candidates[0][0]}" if len(candidates)==1 else None,
 "legacy_sense_id":None,"ku_type":"collocation","raw_prompt":prompt,"raw_answer":answer,
 "source":"tools/core20k_lexicon/runtime/v1/batch69_collocation_cloze_27.jsonl",
 "review_status":"STAGING_CONTEXT_AND_SENSE_BINDING_REQUIRED",
 "required_reviews":["meaning_and_sense_binding","unique_answer_with_context","independent_editorial_signoff"],
 "release_eligible":False,"production_ready":False}
 output.append(record)
assert len(output)==27
assert len({q["legacy_ku_id"] for q in output})==27
(p/"v21_batch27_collocation_authority_triage.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in output),encoding="utf8")
report={"records":len(output),"counts":dict(issues),"production_ready":0,"certified":0,
"note":"Existing KU ids retained; unresolved ranks intentionally null; cloze fragments require contextual repair."}
(p/"v21_batch27_collocation_authority_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("COLLOCATION27_TRIAGE",json.dumps(report))
