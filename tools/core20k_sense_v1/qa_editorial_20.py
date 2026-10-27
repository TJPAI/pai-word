#!/usr/bin/env python3
import json,pathlib,collections,re
root=pathlib.Path("tools/core20k_sense_v1")
files=[root/"editorial_pilot_8_headwords.jsonl",root/"editorial_pilot_12_more_headwords.jsonl"]
seen=set();count=0; problems=[]; types=collections.Counter()
for path in files:
 for line_no,line in enumerate(path.read_text(encoding="utf-8").splitlines(),1):
  r=json.loads(line);lemma=r["lemma"];assert lemma not in seen,lemma;seen.add(lemma)
  proposals=r["sense_proposals"];assert proposals,lemma
  glosses=set()
  for s in proposals:
   count+=1
   zh=s["gloss_zh"];en=s["gloss_en"]
   assert isinstance(zh,str) and zh.strip() and isinstance(en,str) and en.strip()
   normalized=(re.sub(r"\s+","",zh).casefold(),re.sub(r"\s+"," ",en).casefold())
   if normalized in glosses:problems.append({"lemma":lemma,"kind":"EXACT_DUPLICATE_GLOSS"})
   glosses.add(normalized)
   assert s.get("independent_verified",False) is False
  types[path.name]+=len(proposals)
assert len(seen)==20
report={"headwords":len(seen),"draft_sense_proposals":count,"by_file":dict(types),"exact_duplicate_risks":problems,"independently_verified":0,"canonical_ids_assigned":0,"quality_gate":"STRUCTURE_ONLY_PASS; SEMANTIC_SOURCE_CHECK_PENDING"}
out=root/"reports/editorial_pilot_20_qa.json"
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("EDITORIAL_20_QA",json.dumps(report,ensure_ascii=False))
