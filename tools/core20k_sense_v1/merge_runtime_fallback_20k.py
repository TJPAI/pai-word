#!/usr/bin/env python3
"""Attach pre-existing runtime Sense source records for OEWN-unmatched words, without certification."""
import json,pathlib,collections
base=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
gaps=[json.loads(x) for x in (base/"oewn_no_match_637_with_runtime_fallback.jsonl").open(encoding="utf8")]
fallback={x["rank"]:x for x in gaps if x["native_sense_candidate_count"]>0}
assert len(fallback)==150
stats=collections.Counter();found=set()
for b in range(1,41):
 p=base/f"batch{b:03d}.jsonl";rows=[json.loads(x) for x in p.open(encoding="utf8")]
 for r in rows:
  x=fallback.get(r["rank"])
  if not x:continue
  found.add(r["rank"]);assert not r["senses"]
  for i,k in enumerate(x["native_sense_candidates"]):
   sid=f"runtime-native:{r['rank']}:{k['source_ku_id']}"
   en=k["gloss_en_source"]
   if not en:continue
   r["senses"].append({"external_sense_id":sid,"external_synset_id":None,"pos":None,
      "definition_en_source":en,"gloss_zh_sense_aligned":k["gloss_zh_unverified"],
      "sense_translation_alignment_status":"NATIVE_RUNTIME_EXISTING_UNVERIFIED","semantic_certified":False,
      "source":"Frozen Core20K runtime KU"})
   r["ku_drafts"].append({"draft_ku_id":f"staging:native-runtime:definition-review:{r['rank']}:{i:03d}",
      "linked_external_sense_id":sid,"render_kind":"definition_review",
      "question":f"Review this existing source definition of '{r['lemma']}': {en}",
      "response_candidate":r["lemma"],"question_origin":"EXISTING_RUNTIME_SOURCE_REVIEW",
      "original_contextual_cloze":False,"release_eligible":False,"production_ready":False})
   stats["sense_records"]+=1
  if r["senses"]:r["state"]="NATIVE_RUNTIME_SOURCE_SENSE_KU_DRAFT";stats["headwords"]+=1
 p.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf8")
assert found==set(fallback)
report={"oewn_no_match_total":637,"runtime_native_headwords_attached":stats["headwords"],
"runtime_native_sense_candidates":stats["sense_records"],"still_without_source":637-stats["headwords"],
"independent_semantic_certified":0,"production_ready":0}
(base/"native_runtime_fallback_merge_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_NATIVE_FALLBACK_MERGE_PASS",json.dumps(report))
