#!/usr/bin/env python3
"""Audit recognition KU sorted indices [19000:19500] in 10x50 groups.
A deterministic *screening* pass; not an AI semantic certification.
"""
import collections,json,pathlib,re
B=pathlib.Path(__file__).resolve().parent
OUT=B/"teaching_qa/batch039"
OUT.mkdir(parents=True,exist_ok=True)
def read(path):
 return [json.loads(s) for s in path.read_text(encoding="utf8").splitlines() if s.strip()]
idx=[x for x in read(B/"ku_selected_draft_index.jsonl") if ":recognition:" in x["ku_id"]]
idx.sort(key=lambda x:(int(re.search(r"rank:(\d+)",x["teaching_sense_id"]).group(1)),x["teaching_sense_id"],x["ku_id"]))
chosen=idx[19000:19500]
if len(chosen)!=500 or len({x["ku_id"] for x in chosen})!=500:raise ValueError("Unexpected batch population")
cache={}
issues=collections.Counter()
# Index definitions from both 500-entry QA batches to flag distractors
# with an *identical* definition. This is a conservative ambiguity screen.
definitions=collections.defaultdict(set)
for ix in idx[:19500]:
 file=B/ix["selected_file"]
 if str(file) not in cache:cache[str(file)]=read(file)
 r=cache[str(file)][ix["selected_line"]-1]
 definitions[str(r.get("gloss_en") or r.get("definition_en") or "").strip().casefold()].add(str(r.get("lemma") or "").strip().casefold())
for group in range(10):
 rows=[]
 for ix in chosen[group*50:(group+1)*50]:
  file=B/ix["selected_file"]
  if str(file) not in cache:cache[str(file)]=read(file)
  ku=cache[str(file)][ix["selected_line"]-1]
  if ku["ku_id"]!=ix["ku_id"] or ku.get("teaching_sense_id")!=ix["teaching_sense_id"]:raise ValueError("Index source mismatch: "+str(file))
  options=ku.get("options",[])
  flags=[]
  if ku.get("render_kind")!="sense_recognition":flags.append("render_contract_mismatch")
  if not isinstance(options,list) or len(options)!=4 or len(set(options))!=4:flags.append("bad_options")
  if ku.get("response")!=ku.get("lemma") or ku.get("response") not in options:flags.append("bad_answer")
  if not (ku.get("gloss_en") or ku.get("definition_en")):flags.append("missing_en")
  if not ku.get("gloss_zh"):flags.append("missing_zh")
  if not ku.get("question","").startswith("Choose the word matching this meaning: "):flags.append("question_contract")
  if ix.get("requires_gloss_review"):flags.append("gloss_variant_review")
  if ix.get("requires_pos_review"):flags.append("pos_variant_review")
  if len([v for v in options if str(v).lower()==str(ku.get("response","")).lower()])!=1:flags.append("case_insensitive_answer_collision")
  if ku.get("production_ready") is not False or ku.get("release_eligible") is not False:flags.append("unsafe_release_status")
  meaning=str(ku.get("gloss_en") or ku.get("definition_en") or "").strip().casefold()
  competing=[word for word in options if str(word).casefold()!=str(ku.get("response","")).casefold() and str(word).casefold() in definitions.get(meaning,set())]
  if competing:flags.append("same_definition_alternative_answer")
  for flag in flags:issues[flag]+=1
  rows.append({"ku_id":ix["ku_id"],"teaching_sense_id":ix["teaching_sense_id"],"rank":ku.get("rank"),"lemma":ku.get("lemma"),"definition_en":ku.get("gloss_en") or ku.get("definition_en"),"gloss_zh":ku.get("gloss_zh"),"options":options,"answer":ku.get("response"),"source":ix["selected_file"],"source_line":ix["selected_line"],"screening_flags":flags,"same_definition_competing_options":competing,"semantic_answer_uniqueness":"NOT_CERTIFIED","distractor_semantic_qa":"PENDING","release_eligible":False})
 path=OUT/f"qa_recognition_039_{group+1:02d}.jsonl"
 path.write_text("".join(json.dumps(x,ensure_ascii=False,separators=(",",":"))+"\n" for x in rows),encoding="utf8")
 print("GROUP",group+1,"ROWS",len(rows),"FLAGS",sum(len(x["screening_flags"]) for x in rows),flush=True)
conflicts=[]
for grp in range(1,11):
 for entry in read(OUT/f"qa_recognition_039_{grp:02d}.jsonl"):
  if entry["same_definition_competing_options"]:
   conflicts.append({"ku_id":entry["ku_id"],"teaching_sense_id":entry["teaching_sense_id"],"lemma":entry["lemma"],"definition_en":entry["definition_en"],"correct_answer":entry["answer"],"conflicting_options":entry["same_definition_competing_options"],"source":entry["source"],"source_line":entry["source_line"],"suggestion":"Review competing answer and revise distractors in a later source-edit pass"})
(OUT/"semantic_conflict_review_028.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+chr(10) for x in conflicts),encoding="utf8")
summary={"phase":"high_frequency_recognition_screening_batch039","rows":500,"groups":10,"unique_ku_ids":len({x["ku_id"] for x in chosen}),"flags":dict(issues),"semantic_review_certified":False,"release_eligible":False}
(OUT/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(summary,ensure_ascii=False),flush=True)
