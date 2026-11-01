#!/usr/bin/env python3
"""Non-destructive deterministic KU dedupe manifest; originals untouched."""
import collections,json,pathlib
B=pathlib.Path(__file__).resolve().parent
groups=collections.defaultdict(list)
for p in sorted(B.glob("ku_drafts/v*/ku_*.jsonl")):
 for n,line in enumerate(p.read_text(encoding="utf8").splitlines(),1):
  if not line.strip():continue
  x=json.loads(line)
  groups[x.get("ku_id")].append((str(p.relative_to(B)),n,x))
conflicts=[];duplicates=0;missing_en=[]
for kid,rows in groups.items():
 if len(rows)>1:
  duplicates+=len(rows)-1
  sigs={(r[2].get("teaching_sense_id"),r[2].get("lemma"),r[2].get("gloss_en"),r[2].get("gloss_zh"),r[2].get("response"),tuple(r[2].get("options",[]))) for r in rows}
  if len(sigs)>1:conflicts.append({"ku_id":kid,"locations":[[p,n] for p,n,_ in rows],"variants":len(sigs)})
 for p,n,x in rows:
  if not x.get("gloss_en"):missing_en.append([p,n,kid,x.get("teaching_sense_id")])
variant_only=0;semantic_conflict=0;structural_conflict=0
for kid,rows in groups.items():
 if len(rows)<2:continue
 core={(x.get("teaching_sense_id"),x.get("lemma"),x.get("rank"),x.get("gloss_en") or x.get("definition_en"),x.get("gloss_zh"),x.get("response")) for _,_,x in rows}
 if len(core)>1:semantic_conflict+=1
 elif len({(x.get("question"),tuple(x.get("options",[]))) for _,_,x in rows})>1:variant_only+=1
 else:structural_conflict+=1
report={"same_sense_different_question_or_options_groups":variant_only,"semantic_or_gloss_conflict_groups":semantic_conflict,"same_content_duplicate_groups":structural_conflict,"unique_ku_ids":len(groups),"duplicate_extra_records":duplicates,"duplicate_id_conflict_count":len(conflicts),"conflict_sample":conflicts[:100],"missing_english_gloss_records":len(missing_en),"missing_english_gloss_locations":missing_en}
pathlib.Path("enlex_dedupe_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({k:v for k,v in report.items() if k not in ("conflict_sample","missing_english_gloss_locations")},ensure_ascii=False))
