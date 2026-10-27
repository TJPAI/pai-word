#!/usr/bin/env python3
"""Create provisional Sense candidates and exact/near-duplicate review clusters.
Do not treat output as semantic certification or canonical ID assignment.
"""
import gzip,json,pathlib,re,collections,unicodedata,hashlib
base=pathlib.Path("tools/core20k_sense_v1/reports")
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f:root=json.load(f)
rows=root["headwords"];assert len(rows)==20000
def norm(s):
 s=unicodedata.normalize("NFKC",str(s)).lower().strip()
 return re.sub(r"\\s+"," ",s)
stats=collections.Counter()
with (base/"provisional_sense_candidates.jsonl").open("w",encoding="utf-8") as out, (base/"duplicate_review_clusters.jsonl").open("w",encoding="utf-8") as dup, (base/"missing_content_headwords.jsonl").open("w",encoding="utf-8") as missing:
 for w in rows:
  rank,lemma,pos,ipa,kus=w[:5]
  items=[];groups=collections.defaultdict(list)
  for ku in kus:
   if not isinstance(ku,list) or len(ku)<4 or str(ku[1]).lower()!="sense":continue
   kid,typ,zh,en=ku[:4]
   candidate={"source_ku_id":kid,"gloss_zh":zh,"gloss_en":en,"provisional_id":f"candidate:{rank}:{len(items)+1}","review_status":"SOURCE_EXTRACTED_UNVERIFIED"}
   groups[(norm(zh),norm(en))].append(candidate["provisional_id"])
   items.append(candidate)
  for k,v in groups.items():
   if len(v)>1:
    stats["duplicate_groups"]+=1
    dup.write(json.dumps({"rank":rank,"lemma":lemma,"candidate_ids":v,"dup_kind":"identical_bilingual_gloss","action":"SEMANTIC_MERGE_REVIEW_REQUIRED"},ensure_ascii=False)+"\n")
  if not items:
   stats["without_sense_ku"]+=1
   missing.write(json.dumps({"rank":rank,"lemma":lemma,"pos":pos,"total_other_ku":len(kus),"need":"SOURCE_SENSE_DISCOVERY_OR_STRUCTURAL_EXCEPTION","state":"NOT_YET_AUDITED"},ensure_ascii=False)+"\n")
  stats["headwords"]+=1;stats["candidate_senses"]+=len(items)
  out.write(json.dumps({"rank":rank,"lemma":lemma,"pos":pos,"source":"data/core20k-runtime.json.gz","canonical_sense_ids_assigned":False,"candidates":items},ensure_ascii=False)+"\n")
assert stats["headwords"]==20000
summary={"stats":dict(stats),"classification":"provisional source-extracted Sense-KU candidates","independent_semantic_certification":0,"canonical_sense_ids_assigned":0,"notes":["Source KU is not canonical Sense","All identity changes require old/new migration map","No generated meaning or dictionary verification is asserted"]}
(base/"candidate_build_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("CANDIDATE_BUILD",json.dumps(summary,ensure_ascii=False))
