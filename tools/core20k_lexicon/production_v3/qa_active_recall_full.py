#!/usr/bin/env python3
"""Full-draft structural and heuristic editorial QA; do not rewrite source KUs."""
import collections, json, pathlib, re, hashlib
B=pathlib.Path(__file__).resolve().parent
D=B/"ku_drafts"/"v3_active_recall"
O=B/"qa_reports"/"active_recall_full_v1";O.mkdir(parents=True,exist_ok=True)
files=sorted(D.glob("active_recall_*.jsonl"))
assert len(files)==550, f"expected 550 shards, got {len(files)}"
seen_ku=set();seen_sid=set();flags=[]; gloss_groups=collections.defaultdict(set); rows=0
counts=collections.Counter(); examples=collections.defaultdict(list)
def flag(x,category,detail=""):
 counts[category]+=1
 entry={"ku_id":x.get("ku_id"),"teaching_sense_id":x.get("teaching_sense_id"),"rank":x.get("rank"),"lemma":x.get("lemma"),"pos":x.get("pos"),"gloss_zh":x.get("gloss_zh"),"category":category,"detail":detail}
 flags.append(entry)
 if len(examples[category])<8:examples[category].append(entry)
for p in files:
 lines=p.read_text(encoding="utf-8").splitlines()
 expected=21 if p.name=="active_recall_550.jsonl" else 50
 assert len(lines)==expected,(p.name,len(lines),expected)
 for line in lines:
  x=json.loads(line);rows+=1
  kid=x["ku_id"];sid=x["teaching_sense_id"]
  assert kid not in seen_ku and sid not in seen_sid,(p.name,kid,sid)
  seen_ku.add(kid);seen_sid.add(sid)
  assert x.get("draft") is True and x.get("production_ready") is False and x.get("release_eligible") is False
  assert x.get("response")==x.get("lemma") and x["response"] in x.get("answer_variants",[])
  z=x.get("gloss_zh") or "";en=x.get("gloss_en") or "";lemma=x.get("lemma") or ""
  if not z.strip() or not en.strip() or not lemma.strip():flag(x,"missing_core_field")
  if not x.get("pos"):flag(x,"missing_pos")
  if "+" in z:flag(x,"plus_sign_gloss")
  if re.search(r"词头疑|疑应为|待核查|疑似|错误|需确认|待修订|不匹配|\\bTODO\\b",z,re.I):flag(x,"editorial_note_in_gloss")
  if re.search(r"[_{}<>]|\\uFFFD",z):flag(x,"gloss_artifact")
  if len(z.strip())<=1:flag(x,"very_short_gloss")
  if len(z)>160:flag(x,"very_long_gloss")
  if not isinstance(x.get("question"),str) or z not in x["question"]:flag(x,"question_gloss_mismatch")
  key=(re.sub(r"[\\s，,。；;：:（）()]","",z).casefold(),(x.get("pos") or "").casefold())
  if key[0]:gloss_groups[key].add(lemma.casefold())
assert rows==27471
ambig={k:v for k,v in gloss_groups.items() if len(v)>1}
for k,v in sorted(ambig.items(),key=lambda kv:(-len(kv[1]),kv[0])):
 counts["ambiguous_gloss_pos_groups"]+=1
 if len(examples["ambiguous_gloss_pos_groups"])<35:
  examples["ambiguous_gloss_pos_groups"].append({"gloss_zh_normalized":k[0],"pos":k[1],"distinct_lemmas":len(v),"lemma_sample":sorted(v)[:12]})
manifest={"scope":"draft-only; heuristic flags are not verified lexical errors","total_shards":len(files),"total_rows":rows,"unique_ku_ids":len(seen_ku),"unique_sense_ids":len(seen_sid),"coverage_target":27471,"structural_checks":"passed","flag_counts":dict(sorted(counts.items())),"sample_examples":dict(examples),"flagged_rows":len(flags),"ambiguous_gloss_pos_groups":len(ambig),"runtime_modified":False,"source_kus_modified":False}
(O/"qa_summary.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
with (O/"flags.jsonl").open("w",encoding="utf8") as f:
 for item in flags:f.write(json.dumps(item,ensure_ascii=False)+"\n")
print("QA_COMPLETE",json.dumps({"rows":rows,"flag_counts":manifest["flag_counts"],"flagged_rows":len(flags)},ensure_ascii=False))
