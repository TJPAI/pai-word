#!/usr/bin/env python3
"""Crosswalk available existing source evidence to frozen runtime headwords.
Does NOT claim source verification based on an imported URL alone.
"""
import json,gzip,pathlib,collections
b=pathlib.Path("tools/core20k_sense_v1/reports");b.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f:root=json.load(f)
wordmap={str(w[1]).casefold():w for w in root["headwords"]}
sources=[
"tools/core20k_lexicon/runtime/v1/batch90_six_complete_source_checked_sense.jsonl",
"tools/core20k_lexicon/runtime/v1/batch91_six_source_alignment_verified.jsonl",
"tools/core20k_lexicon/runtime/v1/batch92_l2_ai_certified_six_senses.jsonl",
"tools/core20k_lexicon/data/batch58_five_source_checked_overlays.jsonl",
"tools/core20k_lexicon/data/batch59_seven_external_source_overlays.jsonl",
"tools/core20k_lexicon/data/batch60_seven_external_evidence.jsonl"]
stats=collections.Counter();links=[]
for path in sources:
 f=pathlib.Path(path)
 if not f.exists():continue
 for num,line in enumerate(f.read_text(encoding="utf-8").splitlines(),1):
  if not line.strip():continue
  try:rec=json.loads(line)
  except json.JSONDecodeError:
   stats["unparseable"]+=1;continue
  stats["source_records"]+=1
  name=next((rec[k] for k in ("headword","lemma","word") if isinstance(rec.get(k),str)),None)
  if not name:
   stats["unknown_schema"]+=1;continue
  match=wordmap.get(name.casefold())
  if not match:
   stats["no_frozen_lemma_match"]+=1;continue
  stats["matched_records"]+=1
  links.append({"rank":match[0],"lemma":match[1],"source_file":path,"source_line":num,"source_identity":rec.get("sense_id",rec.get("ku_id")),"prior_quality_status":rec.get("quality_status",rec.get("review_status")),"audit_status":"SOURCE_LINKED_REQUIRES_INDEPENDENT_REVIEW"})
with (b/"source_evidence_links.jsonl").open("w",encoding="utf-8") as f:
 for r in links:f.write(json.dumps(r,ensure_ascii=False)+"\n")
report={"source_files":sources,"stats":dict(stats),"unique_frozen_headwords_linked":len(set(x["rank"] for x in links)),"new_semantically_certified":0,"warning":"Historical source files are not automatically independent second-source verification."}
(b/"source_evidence_alignment_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("SOURCE_ALIGNMENT",json.dumps(report,ensure_ascii=False))
