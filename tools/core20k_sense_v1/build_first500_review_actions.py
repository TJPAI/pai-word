#!/usr/bin/env python3
"""Triage pilot into actionable queues; preserve all evidence and no auto-certification."""
import json, pathlib, collections
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
rows=[json.loads(x) for x in (p/"first500_meaning_triage.jsonl").open(encoding="utf8")]
assert len(rows)==500
counts=collections.Counter()
with (p/"first500_review_actions.jsonl").open("w",encoding="utf8") as out:
 for r in rows:
  issues=set(r["issues"])
  if "NO_ENGLISH_GLOSS_CANDIDATE" in issues: action="RESEARCH_MISSING_ENGLISH_SENSE"
  elif "SUSPECT_SPELLING_OR_NONCANONICAL_LEMMA" in issues: action="CHECK_LEMMA_NORMALIZATION_NO_MUTATION"
  elif "HIGH_POLYSEMY_OR_NOISY_SOURCE" in issues:action="MANUAL_POLYSEMY_SPLIT_MERGE"
  elif "LOW_SOURCE_COVERAGE" in issues:action="FIND_INDEPENDENT_SECOND_SOURCE"
  elif "NO_ECDICT_CHINESE_TRANSLATION" in issues:action="TRANSLATE_AND_BILINGUAL_CROSSCHECK"
  else:action="BATCH_AI_SEMANTIC_COMPARE_NOT_CERTIFY"
  counts[action]+=1
  out.write(json.dumps({"rank":r["rank"],"lemma":r["lemma"],"action":action,"issues":r["issues"],"candidate_count":len(r["candidate_glosses"]),"semantic_signoff":False},ensure_ascii=False)+"\n")
assert sum(counts.values())==500
summary={"action_counts":dict(counts),"queue_records":500,"certified":0,"frozen_rank_changed":0}
(p/"first500_review_actions_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("FIRST500_ACTION_QUEUE",json.dumps(summary,ensure_ascii=False))
