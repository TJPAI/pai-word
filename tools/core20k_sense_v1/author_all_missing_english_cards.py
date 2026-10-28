#!/usr/bin/env python3
"""Turn all 15 source-evidence review shards into English definition study-card drafts, pending semantic QA."""
import pathlib,json,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
index=json.loads((root/"index.json").read_text())
metrics=collections.Counter();ids=set()
for info in index["batches"]:
 d=root/("batch%03d"%info["batch"])
 records=[json.loads(l) for l in (d/"review.jsonl").open(encoding="utf8")]
 counts=collections.Counter(r["rank"] for r in records)
 eligible=[]
 for r in records:
  if r["review_state"]!="SINGLE_SENSE_BILINGUAL_REVIEW":continue
  en=r["gloss_en"].strip();lemma=r["lemma"]
  if counts[r["rank"]]!=1 or len(en)<16 or len(en)>350 or any(t in lemma for t in (" ","/")):
   metrics["excluded_poor_source"]+=1;continue
  uid=f"staging:v21:missing:{r['rank']}:engdef01"
  assert uid not in ids;ids.add(uid)
  eligible.append({"draft_ku_id":uid,"rank":r["rank"],"lemma":lemma,
   "external_sense_id":r["oewn_sense_id"],"canonical_sense_id":None,
   "render_kind":"source_definition_recognition","question":f"Study the OEWN definition of '{lemma}'.",
   "gloss_en":en,"gloss_zh":None,"unverified_chinese_reference":r["ecdict_wordlevel_zh_unaligned"],
   "source_attribution":"OEWN 2025","review_status":"ENGLISH_SENSE_DRAFT_NEEDS_ZH_AND_PEDAGOGICAL_QA",
   "release_eligible":False,"production_ready":False})
 with (d/"english_learning_drafts.jsonl").open("w",encoding="utf8") as out:
  for r in eligible:out.write(json.dumps(r,ensure_ascii=False)+"\n")
 metrics["shards"]+=1;metrics["english_draft_cards"]+=len(eligible)
assert metrics["shards"]==15
(root/"draft_index.json").write_text(json.dumps({"counts":dict(metrics),"formal_ku":0,"independent_certified":0},ensure_ascii=False,indent=2)+"\n")
print("MISSING_ALL_BATCH_ENGLISH_DRAFTS_PASS",json.dumps(dict(metrics)))
