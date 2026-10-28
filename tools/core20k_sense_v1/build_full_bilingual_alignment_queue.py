#!/usr/bin/env python3
"""Deterministic bilingual Sense review production queue.
Never assert word-level/native KU Chinese is aligned to an OEWN sense without evidence.
"""
import pathlib,json,collections,re
root=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
stats=collections.Counter();total=0
for batch in range(1,41):
 path=root/f"batch{batch:03d}.jsonl";words=[json.loads(x) for x in path.open(encoding="utf8")]
 rows=[]
 for word in words:
  native=[x for x in word["ku_drafts"] if x.get("question_origin")=="FROZEN_RUNTIME_EXISTING_KU" and x.get("native_ku_type","").casefold()=="sense"]
  pairs=[]
  for x in native:
   p=x["native_payload"]
   if len(p)>=4 and str(p[2]).strip() and str(p[3]).strip():
    pairs.append({"native_ku_id":x["native_original_ku_id"],"gloss_zh":p[2],"gloss_en":p[3]})
  # Explicit review statuses prevent copying polysemous word-level gloss into the wrong sense.
  for index,s in enumerate(word["senses"]):
   en=s["definition_en_source"]
   if not pairs:status="SOURCE_SENSE_WITHOUT_ZH_REFERENCE"
   elif len(pairs)==1 and len(word["senses"])==1:status="SINGLE_SOURCE_PAIR_CANDIDATE_NOT_VERIFIED"
   else:status="POLYSEMOUS_BILINGUAL_ALIGNMENT_REQUIRED"
   best=[]
   tokens=lambda t:set(re.findall(r"[a-z]+",str(t).lower()))-{"a","an","the","to","of","or","and","for","someone","something"}
   ta=tokens(en)
   for p in pairs:
    tb=tokens(p["gloss_en"])
    score=round(len(ta&tb)/len(ta|tb),4) if ta and tb else 0
    best.append({**p,"lexical_overlap_hint":score,"verified_sense_alignment":False})
   best.sort(key=lambda x:-x["lexical_overlap_hint"])
   rows.append({"rank":word["rank"],"lemma":word["lemma"],"headword_id":word["headword_id"],
      "external_sense_id":s["external_sense_id"],"gloss_en_source":en,
      "zh_sense_gloss_verified":None,"native_bilingual_candidate_pairs":best[:8],
      "alignment_status":status,"independent_review":False,"release_eligible":False,"production_ready":False})
   stats[status]+=1;total+=1
 (root/f"bilingual_alignment_batch{batch:03d}.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf8")
assert total==60204
report={"source_senses":total,"batches":40,"statuses":dict(stats),"certified_alignment":0,
"note":"Lexical token overlap is ranking evidence only, NOT bilingual semantic equivalence."}
(root/"bilingual_alignment_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_FULL_BILINGUAL_ALIGNMENT_QUEUE_PASS",json.dumps(report,ensure_ascii=False))
