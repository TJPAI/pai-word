#!/usr/bin/env python3
"""Package existing 27 contextual collocations + 7 grammar KUs with actual QA evidence.
Preserve source identities and require independent semantic review before activation.
"""
import json,gzip,pathlib,collections,re
base=pathlib.Path("tools/core20k_sense_v1/release/v2.1-top1000");base.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as fh: runtime=json.load(fh)
entries=runtime["headwords"]
assert len(entries)==20000
by_ku=collections.defaultdict(list)
for row in entries:
 for ku in row[4]:
  if isinstance(ku,list) and ku:by_ku[str(ku[0])].append((row[0],row[1]))
files=[("collocation","tools/core20k_lexicon/runtime/v1/batch72_27_revised_staging.jsonl"),
       ("grammar","tools/core20k_lexicon/runtime/v1/batch79_seven_grammar_complete_staging.jsonl")]
approved=[];blocked=[];count=collections.Counter()
for kind,file in files:
 for line in pathlib.Path(file).open(encoding="utf8"):
  r=json.loads(line);key=r["ku_id"];matches=by_ku.get(key,[])
  parsed=re.match(r"w_\d+_([^_]+)_ku\d+$",key)
  expected=r.get("headword") or (parsed.group(1) if parsed else "")
  matches=[m for m in matches if m[1].casefold()==expected.casefold()]
  prompt=r.get("prompt","");answer=r.get("correct_answer","")
  reasons=[]
  if len(matches)!=1: reasons.append("LEGACY_ID_NOT_UNIQUELY_IN_FROZEN_RUNTIME")
  if prompt.count("___")!=1 or not answer:reasons.append("BAD_QUESTION")
  choices=r.get("choices")
  if choices is not None and (len(choices)!=len(set(choices)) or choices.count(answer)!=1):reasons.append("BAD_CHOICES")
  if kind=="collocation" and not r.get("linguistic_distractor_review_complete"):reasons.append("DISTRACTOR_REVIEW_PENDING")
  if kind=="grammar" and r.get("missing_approvals"):reasons.append("INDEPENDENT_APPROVAL_PENDING")
  record={"ku_id":key,"lemma":expected,"rank":matches[0][0] if len(matches)==1 else None,
   "headword_id":f"core20k:rank:{matches[0][0]}" if len(matches)==1 else None,
   "sense_id_candidate":r.get("sense_id"),"ku_type":kind,
   "render_kind":"multiple_choice" if choices is not None else "cloze",
   "question":prompt,"response":{"correct_answer":answer,"choices":choices},
   "explanation_zh":r.get("explanation_zh"),"source_file":file,
   "review_blockers":reasons,"release_eligible":False,"production_ready":False}
  (blocked if reasons else approved).append(record);count[kind]+=1
assert count["collocation"]==27 and count["grammar"]==7
assert len(approved)+len(blocked)==34
with (base/"top1000_contextual_collocation_grammar_34_staging.jsonl").open("w",encoding="utf8") as out:
 for rec in approved+blocked:out.write(json.dumps(rec,ensure_ascii=False)+"\n")
stats={"imported_contextual_ku":34,"by_type":dict(count),"unblocked_structural_candidates":len(approved),
 "awaiting_review":len(blocked),"certified":0,"production_ready":0,
 "note":"All contextual exercises imported from existing source work, not newly authored; review blockers are transparent."}
(base/"top1000_contextual_collocation_grammar_34_summary.json").write_text(json.dumps(stats,ensure_ascii=False,indent=2)+"\n")
print("TOP1000_CONTEXTUAL_34_PASS",json.dumps(stats))
