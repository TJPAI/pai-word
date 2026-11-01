#!/usr/bin/env python3
"""Choose one draft KU per ID for inspection; never alter inputs or promote to production."""
import collections,json,pathlib
B=pathlib.Path(__file__).resolve().parent
groups=collections.defaultdict(list)
for path in sorted(B.glob("ku_drafts/v*/ku_*.jsonl")):
 for n,line in enumerate(path.read_text(encoding="utf8").splitlines(),1):
  if line.strip():
   row=json.loads(line)
   if not row.get("ku_id"):raise ValueError(f"missing KU ID: {path}:{n}")
   groups[row["ku_id"]].append((str(path.relative_to(B)),n,row))
def score(row):
 opts=row.get("options",[])
 return (
  bool(row.get("gloss_en") or row.get("definition_en")),
  bool(row.get("gloss_zh")),
  bool(row.get("question")),
  isinstance(opts,list) and len(opts)==4 and len(set(opts))==4 and row.get("response") in opts if row.get("render_kind")=="sense_recognition" else bool(row.get("response")),
  -len(row.get("qa_flags",[])),
 )
selected=[];counts=collections.Counter()
for kid,items in sorted(groups.items()):
 identity={(r.get("teaching_sense_id"),r.get("lemma"),r.get("rank"),r.get("response")) for _,_,r in items}
 if len(identity)!=1: raise ValueError(f"IDENTITY CONFLICT {kid}")
 coreen={r.get("gloss_en") or r.get("definition_en") for _,_,r in items}
 corezh={r.get("gloss_zh") for _,_,r in items}
 poseq={str(r.get("pos") or "").lower().replace("adj","a").replace("adjective","a").replace("noun","n").replace("verb","v").replace("adverb","r") for _,_,r in items}
 review_gloss=len(coreen)>1 or len(corezh)>1
 # Prefer completed source fields, then stable alphabetic file/line order
 path,n,row=sorted(items,key=lambda t:(tuple(-int(x) for x in score(t[2])),t[0],t[1]))[0]
 selected.append({"ku_id":kid,"teaching_sense_id":row.get("teaching_sense_id"),"selected_file":path,"selected_line":n,"candidate_count":len(items),"requires_gloss_review":review_gloss,"requires_pos_review":len(poseq)>1,"draft":True,"release_eligible":False})
 counts["unique_ids"]+=1
 counts["total_records"]+=len(items)
 counts["unselected_records"]+=len(items)-1
 counts["gloss_review_ids"]+=int(review_gloss)
 counts["pos_review_ids"]+=int(len(poseq)>1)
 counts["selected_missing_english"]+=int(not (row.get("gloss_en") or row.get("definition_en")))
 counts["selected_missing_chinese"]+=int(not row.get("gloss_zh"))
p=B/"ku_selected_draft_index.jsonl"
p.write_text("".join(json.dumps(r,ensure_ascii=False,separators=(",",":"))+"\n" for r in selected),encoding="utf8")
(B/"ku_selected_draft_summary.json").write_text(json.dumps(dict(counts),indent=2,ensure_ascii=False)+"\n",encoding="utf8")
print(json.dumps(dict(counts),ensure_ascii=False))
