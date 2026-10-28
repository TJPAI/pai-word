#!/usr/bin/env python3
"""Cross-source conservative bilingual triage, NOT automatic Sense translation.
OEWN English sense and ECDICT word-level Chinese meanings must stay distinct.
"""
import json,pathlib,collections,re
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
rs=[json.loads(x) for x in (root/"oewn_english_sense_production_candidates.jsonl").open(encoding="utf8")]
assert len(rs)==1000
counts=collections.Counter()
with (root/"sense_zh_alignment_review.jsonl").open("w",encoding="utf8") as output:
 for row in rs:
  senses=row["candidate_senses"];zh=row.get("word_level_zh_evidence","") or ""
  tokens=[s.strip() for s in re.split(r"[；;\\n]",zh) if s.strip()]
  for s in senses:
   # Deliberately no semantic matching by ordering or index.
   status="EN_SENSE_WITH_WORDLEVEL_ZH_UNALIGNED" if tokens else "EN_SENSE_NO_ZH_EVIDENCE"
   record={"rank":row["rank"],"lemma":row["lemma"],
     "oewn_sense_id":s["external_sense_id"],"oewn_pos":s["pos"],
     "gloss_en":s["gloss_en"],"zh_wordlevel_options":tokens,
     "aligned_gloss_zh":None,"canonical_sense_id":None,
     "review_status":status,"translation_source":"ECDICT_WORD_LEVEL_NOT_SENSE_ALIGNED",
     "production_ready":False,"release_eligible":False}
   output.write(json.dumps(record,ensure_ascii=False)+"\n")
   counts[status]+=1
  counts["headwords_seen"]+=1
  if len(senses)==1 and len(tokens)==1:counts["SINGLE_EN_SINGLE_ZH_CANDIDATE_REQUIRES_QA"]+=1
assert counts["headwords_seen"]==1000
assert sum(v for k,v in counts.items() if k.startswith("EN_SENSE_"))==1974
summary={"stats":dict(counts),"certified_sense":0,"production_ku":0,
 "next_required":"sense-specific bilingual editorial alignment, frequency selection, independent QA"}
(root/"sense_zh_alignment_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("OEWN_ECDICT_ALIGNMENT_TRIAGE_PASS",json.dumps(summary,ensure_ascii=False))
