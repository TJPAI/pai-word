#!/usr/bin/env python3
"""Retain all frozen-runtime native Sense/KU source content in full20k staging, without automatic OEWN equivalence."""
import gzip,json,pathlib,collections
root=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:words=json.load(f)["headwords"]
stats=collections.Counter();ids=set();sample=[]
for batch in range(1,41):
 path=root/f"batch{batch:03d}.jsonl";rows=[json.loads(x) for x in path.open(encoding="utf8")]
 for r in rows:
  w=words[r["rank"]-1];assert w[1].casefold()==r["lemma"].casefold()
  for i,k in enumerate(w[4]):
   if not isinstance(k,list) or len(k)<4:continue
   native_kind=str(k[1]);kid=str(k[0])
   if not kid:continue
   uid=f"staging:core20k:native:{r['rank']}:{i:03d}"
   assert uid not in ids;ids.add(uid)
   r["ku_drafts"].append({"draft_ku_id":uid,"native_original_ku_id":kid,
      "native_ku_type":native_kind,"native_payload":k,
      "linked_external_sense_id":None,"sense_equivalence":"NOT_AUTOMATICALLY_MAPPED_TO_OEWN",
      "question_origin":"FROZEN_RUNTIME_EXISTING_KU","original_contextual_cloze":False,
      "release_eligible":False,"production_ready":False})
   stats["native_ku_records"]+=1;stats["type:"+native_kind]+=1
   if native_kind.casefold()=="sense":stats["native_sense_ku_records"]+=1
   if len(sample)<5:sample.append({"rank":r["rank"],"lemma":r["lemma"],"native_kind":native_kind})
  if w[4]:stats["headwords_with_native_ku"]+=1
 path.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows),encoding="utf8")
assert stats["native_ku_records"]>0
report={"native_ku_records_appended":stats["native_ku_records"],"native_sense_ku_records":stats["native_sense_ku_records"],
"headwords_with_native_ku":stats["headwords_with_native_ku"],"type_counts":{k[5:]:v for k,v in stats.items() if k.startswith("type:")},
"sample":sample,"external_sense_mapping_certified":0,"production_ready":0,
"warning":"Existing runtime KU preserved exactly as source records; not equivalent to newly authored KU or verified OEWN Sense alignments."}
(root/"native_runtime_full20k_merge_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_NATIVE_KU_FULL_MERGE_PASS",json.dumps(report,ensure_ascii=False))
