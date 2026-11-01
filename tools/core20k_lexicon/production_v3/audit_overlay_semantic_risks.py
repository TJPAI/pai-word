#!/usr/bin/env python3
"""Non-destructive semantic-risk triage of 539 grounded editorial proposals."""
import json, pathlib, re, collections
B=pathlib.Path(__file__).resolve().parent
def load(p):
 return [json.loads(s) for s in p.read_text(encoding="utf8").splitlines() if s.strip()]
rows=load(B/"lexical_review_overlay_v1.jsonl")
source={}
for f in sorted(B.glob("recovery/v93_register_20261030/shards/senses_*.jsonl")):
 for r in load(f):source[r["teaching_sense_id"]]=r
by_lemma=collections.defaultdict(list)
for r in rows:by_lemma[r["lemma"].casefold()].append(r)
issues=[];cat=collections.Counter()
def flag(r,reason,detail):
 issues.append({"teaching_sense_id":r["teaching_sense_id"],"lemma":r["lemma"],"reason":reason,"detail":detail,"definition_en":r["definition_en"],"recommended_gloss_zh":r["recommended_gloss_zh"]})
 cat[reason]+=1
for r in rows:
 s=source[r["teaching_sense_id"]]
 if s["definition_en"]!=r["definition_en"] or s["lemma"]!=r["lemma"]:raise ValueError("Mismatch")
 gloss=r["recommended_gloss_zh"].strip()
 if re.search(r"(?:待审核|TODO|不确定|旧定义|需更新英文定义)",gloss):flag(r,"editorial_note_embedded_in_gloss","Review for non-teaching prose")
 if len(gloss)>90:flag(r,"long_gloss",str(len(gloss)))
 if len(gloss)<2:flag(r,"short_gloss",gloss)
 if re.search(r"\b(?:nine large celestial bodies|Pluto|former monetary unit|formerly|obsolete)\b",r["definition_en"],re.I):flag(r,"source_definition_currency_review","Source definition may be obsolete or historical, verify domain")
 candidate_values=[v.get("value") for v in s.get("zh_candidates",[]) if isinstance(v,dict)]
 if gloss not in candidate_values and not any(v and v in gloss for v in candidate_values):
  flag(r,"no_source_gloss_phrase_overlap","Proposed zh is different from source candidate; semantic editorial check")
for lemma,rr in by_lemma.items():
 for gloss,eq in ((g,[r for r in rr if r["recommended_gloss_zh"]==g]) for g in {r["recommended_gloss_zh"] for r in rr}):
  if len(eq)>1 and len({r["definition_en"] for r in eq})>1:
   for r in eq:flag(r,"same_lemma_same_gloss_different_senses","Different source definitions share identical proposed gloss")
summary={"overlay_rows":len(rows),"unique_ids":len({r["teaching_sense_id"] for r in rows}),"flagged_records":len({x["teaching_sense_id"] for x in issues}),"issue_flags":len(issues),"issue_type_counts":dict(cat),"manual_semantic_review_pending":True,"release_eligible":False}
(B/"lexical_overlay_semantic_risk_report.json").write_text(json.dumps({"summary":summary,"issues":issues},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(summary,ensure_ascii=False))
if len(rows)!=539 or len({r["teaching_sense_id"] for r in rows})!=539:raise ValueError("Not 539")
