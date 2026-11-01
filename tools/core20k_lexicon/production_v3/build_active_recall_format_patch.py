#!/usr/bin/env python3
"""Create a non-destructive, reviewable patch for indisputable '+' artifacts."""
import pathlib,json,collections,re,hashlib
B=pathlib.Path(__file__).resolve().parent
D=B/"ku_drafts"/"v3_active_recall"
O=B/"qa_reports"/"active_recall_patch_v1";O.mkdir(parents=True,exist_ok=True)
rows=[];changed=[];missing_pos=[];ambiguity=collections.defaultdict(set)
for f in sorted(D.glob("active_recall_*.jsonl")):
 for ln in f.open(encoding="utf8"):
  x=json.loads(ln);rows.append(x)
  z=x["gloss_zh"];key=(re.sub(r"[\s，,。；;：:（）()]","",z).casefold(),(x.get("pos") or "").casefold())
  ambiguity[key].add(x["lemma"].casefold())
  if x.get("pos") is None:missing_pos.append({"ku_id":x["ku_id"],"lemma":x["lemma"],"reason":"missing_pos; authoritative verification required"})
  if "+" in z:
   new=z.replace("+","")
   q=x["question"].replace(z,new)
   assert q!=x["question"] and new in q
   changed.append({"ku_id":x["ku_id"],"teaching_sense_id":x["teaching_sense_id"],"field_updates":{"gloss_zh":new,"question":q},"old_gloss_zh":z,"reason":"remove literal plus sign artifact; no semantic rewriting"})
assert len(rows)==27471 and len(changed)==862 and len(missing_pos)==203
assert len({x["ku_id"] for x in changed})==len(changed)
amb=[{"gloss_zh_normalized":key[0],"pos":key[1],"candidate_lemmas":sorted(ls)} for key,ls in ambiguity.items() if len(ls)>1]
amb.sort(key=lambda x:(-len(x["candidate_lemmas"]),x["gloss_zh_normalized"]))
assert len(amb)==2238
for name,items in (("safe_format_patches.jsonl",changed),("missing_pos_review.jsonl",missing_pos),("ambiguous_gloss_review.jsonl",amb)):
 with (O/name).open("w",encoding="utf8") as f:
  for x in items:f.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"base_ku_count":len(rows),"plus_sign_patch_count":len(changed),"missing_pos_review_count":len(missing_pos),"ambiguous_gloss_pos_groups":len(amb),"source_ku_modified":False,"runtime_modified":False,"patch_applied":False,"patch_sha256":hashlib.sha256((O/"safe_format_patches.jsonl").read_bytes()).hexdigest(),"method":"literal-plus removal only; ambiguous prompts and missing POS require lexical review"}
(O/"patch_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("PATCH_READY",json.dumps(summary,ensure_ascii=False))
