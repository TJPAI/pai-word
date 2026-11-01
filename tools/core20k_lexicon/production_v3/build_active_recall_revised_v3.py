#!/usr/bin/env python3
"""Non-destructive V3 overlay: source-backed POS recovery and ambiguity-aware prompts."""
import pathlib,json,collections,re,hashlib
B=pathlib.Path(__file__).resolve().parent
D=B/"ku_drafts"/"v3_active_recall"
Q=B/"qa_reports"/"active_recall_revised_v2"/"revised_records.jsonl"
O=B/"qa_reports"/"active_recall_revised_v3";O.mkdir(parents=True,exist_ok=True)
v2={x["ku_id"]:x for x in (json.loads(line) for line in Q.open(encoding="utf8"))}
source_pos=collections.defaultdict(set)
for f in sorted((B/"ku_drafts"/"v2").glob("ku_*.jsonl")):
 for line in f.open(encoding="utf8"):
  x=json.loads(line);sid=x.get("teaching_sense_id");pos=x.get("pos")
  if sid and isinstance(pos,str) and pos.strip():source_pos[sid].add(pos.strip())
rows=[]
for f in sorted(D.glob("active_recall_*.jsonl")):
 for line in f.open(encoding="utf8"):
  x=json.loads(line)
  rows.append(v2.get(x["ku_id"],x))
assert len(rows)==27471 and len({x["ku_id"] for x in rows})==27471
groups=collections.defaultdict(set)
def key(x):
 return (re.sub(r"[\s，,。；;：:（）()]","",x["gloss_zh"]).casefold(),(x.get("pos") or "").casefold())
for x in rows:groups[key(x)].add(x["lemma"].casefold())
revisions=[];pos_recovered=0;pos_unresolved=0;ambiguous_items=0;ambiguous_groups=set()
for x in rows:
 y=dict(x);updated=False
 if not x.get("pos"):
  matches=source_pos.get(x["teaching_sense_id"],set())
  if len(matches)==1:
   y["pos"]=next(iter(matches))
   y["pos_review_needed"]=False
   y["question"]=y["question"].replace("词性：待核查","词性："+y["pos"])
   pos_recovered+=1;updated=True
  else:
   pos_unresolved+=1
 if len(groups[key(x)])>1:
  ambiguous_items+=1;ambiguous_groups.add(key(x))
  # Preserve semantic ambiguity as an explicit learning caveat, not a uniqueness claim.
  y["ambiguity_review_needed"]=True
  y["question"]=y["question"]+"（提示：该释义可能对应多个英文词，请结合上下文辨析。）"
  # Single keyed response is NOT validated as unique; defer equivalence decisions.
  updated=True
 if updated:
  assert y["ku_id"]==x["ku_id"] and y["response"]==x["response"] and y["answer_variants"]==x["answer_variants"]
  assert y["production_ready"] is False and y["release_eligible"] is False
  revisions.append(y)
with (O/"revised_records.jsonl").open("w",encoding="utf8") as f:
 for x in revisions:f.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"base_total":27471,"v2_format_overlay":862,"v3_changed_records":len(revisions),"missing_pos_before":203,"pos_recovered_exact_sense_source":pos_recovered,"missing_pos_remaining":pos_unresolved,"ambiguous_groups":len(ambiguous_groups),"ambiguous_ku_records":ambiguous_items,"question_policy":"ambiguity warning only, not a uniqueness guarantee; lexical rewriting pending","source_modified":False,"runtime_modified":False,"overlay_sha256":hashlib.sha256((O/"revised_records.jsonl").read_bytes()).hexdigest()}
assert pos_recovered+pos_unresolved==203
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("V3_AUDIT",json.dumps(summary,ensure_ascii=False))
