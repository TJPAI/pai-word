#!/usr/bin/env python3
"""Selection V1: auditable *provisional* teaching-sense prioritization, no semantic deletions.
No unsupported sense-frequency claims, no auto-merging merely by similar definitions.
"""
import json,pathlib,collections,re,hashlib
root=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
counts=collections.Counter();kept=0;total=0;heads=0
for batch in range(1,41):
 p=root/f"batch{batch:03d}.jsonl";words=[json.loads(x) for x in p.open(encoding="utf8")];output=[]
 for w in words:
  heads+=1;senses=w["senses"];rank=w["rank"]
  # Source-duplicate fingerprints are review hints, never automatically identical meanings.
  group=collections.defaultdict(list)
  for s in senses:
   definition=" ".join(str(s["definition_en_source"]).casefold().split())
   key=(s.get("pos"),definition)
   group[key].append(s["external_sense_id"])
  for i,s in enumerate(senses):
   sid=s["external_sense_id"];definition=str(s["definition_en_source"]).strip();pos=s.get("pos")
   equivalent=group[(pos," ".join(definition.casefold().split()))]
   linked_editorial=any(x.get("linked_external_sense_id")==sid and x.get("original_contextual_cloze") for x in w["ku_drafts"])
   has_native=any(x.get("question_origin")=="FROZEN_RUNTIME_EXISTING_KU" and x.get("native_ku_type","").casefold()=="sense" for x in w["ku_drafts"])
   short=len(definition)<15
   flags=(["IDENTICAL_DEFINITION_SOURCE_DUPLICATE_REVIEW"] if len(equivalent)>1 else [])+ (["SHORT_DEFINITION_REVIEW"] if short else [])
   # Never rank an unobserved individual sense by headword rank as though it were sense frequency.
   if linked_editorial:decision="KEEP_CORE_CANDIDATE"
   elif short or len(equivalent)>1:decision="REVIEW_REQUIRED"
   elif rank<=3000 and has_native:decision="KEEP_CORE_CANDIDATE"
   elif rank<=10000:decision="KEEP_EXTENDED_CANDIDATE"
   else:decision="REVIEW_REQUIRED"
   counts[decision]+=1;total+=1
   output.append({"rank":rank,"lemma":w["lemma"],"external_sense_id":sid,
      "source_definition":definition,"pos":pos,"decision_v1":decision,
      "reason_codes":flags+ (["EXISTING_ORIGINAL_KU_EVIDENCE"] if linked_editorial else [])+
          (["HIGH_FREQUENCY_HEADWORD_NOT_SENSE_FREQUENCY"] if rank<=3000 else []),
      "exact_definition_group_members":equivalent if len(equivalent)>1 else [],
      "sense_frequency_evidence":None,"pedagogical_value_verified":False,
      "automatic_reject":False,"auto_merge":False,"review_required_before_freeze":True,
      "source_ku_action":"RETAIN_STAGING_NOT_RELEASED","production_ready":False})
 (root/f"sense_selection_v1_batch{batch:03d}.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in output),encoding="utf8")
assert total==60204 and heads==20000
summary={"total_source_senses":total,"total_headwords":heads,"provisional_decisions":dict(counts),
"automatically_rejected":0,"automatically_merged":0,"certified":0,
"disclaimer":"Evidence-constrained prioritization, NOT a completed high-quality Sense selection. Headword rank is not Sense frequency."}
(root/"sense_selection_v1_manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SENSE_SELECTION_V1_CANDIDATES_PASS",json.dumps(summary,ensure_ascii=False))
