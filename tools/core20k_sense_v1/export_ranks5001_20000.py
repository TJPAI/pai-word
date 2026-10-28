#!/usr/bin/env python3
"""Ranks 5001-20000: reproducible bilingual inherited Sense/KU extraction and semantic-risk triage.
No editorial or independent signoff is implied by existing runtime evidence.
"""
import gzip,json,pathlib,collections,re,unicodedata,hashlib
dest=pathlib.Path("tools/core20k_sense_v1/release/v2.1-ranks5001-20000")
dest.mkdir(parents=True,exist_ok=True)
runtime=pathlib.Path("data/core20k-runtime.json.gz")
raw=runtime.read_bytes()
with gzip.open(runtime,"rt",encoding="utf8") as f:words=json.load(f)["headwords"]
assert len(words)==20000 and [w[0] for w in words]==list(range(1,20001))
scope=words[5000:20000]
assert len(scope)==15000 and scope[0][0]==5001 and scope[-1][0]==20000
def norm(s):return re.sub(r"\\s+"," ",unicodedata.normalize("NFKC",s).casefold()).strip(" .;:,")
counts=collections.Counter();seen=set();gap=[]
with (dest/"sense_ku_bilingual_candidates.jsonl").open("w",encoding="utf8") as out, (dest/"semantic_qa_queue.jsonl").open("w",encoding="utf8") as audit:
 for rank,lemma,pos,ipa,kus,*_ in scope:
  items=[]
  for k in kus:
   if not isinstance(k,list) or len(k)<4 or str(k[1]).casefold()!="sense":continue
   kid,_,zh,en=k[:4];kid=str(kid)
   if not isinstance(zh,str) or not zh.strip() or not isinstance(en,str) or not en.strip():
    counts["incomplete_sense_records"]+=1;continue
   if kid in seen:raise AssertionError("duplicate legacy KU ID "+kid)
   seen.add(kid);items.append((kid,zh,en))
  if not items:
   gap.append({"rank":rank,"lemma":lemma,"pos":pos,"legacy_ku_count":len(kus),"status":"NO_BILINGUAL_SENSE_SOURCE"})
   continue
  counts["covered_headwords"]+=1
  english=collections.Counter(norm(x[2]) for x in items)
  chinese=collections.Counter(norm(x[1]) for x in items)
  for kid,zh,en in items:
   flags=[]
   if english[norm(en)]>1:flags.append("EN_GLOSS_REPEATED_IN_HEADWORD")
   if chinese[norm(zh)]>1:flags.append("ZH_GLOSS_REPEATED_IN_HEADWORD")
   if any(s in zh for s in ("；",";","/")):flags.append("ZH_ANSWER_ALTERNATIVES_REQUIRE_REVIEW")
   if len(en.strip())<5:flags.append("SHORT_EN_GLOSS")
   counts["review_records"]+=1
   for flag in flags:counts["flag:"+flag]+=1
   base={"rank":rank,"lemma":lemma,"headword_id":f"core20k:rank:{rank}","pos":pos,"us_ipa_candidate":ipa,
    "legacy_ku_id":kid,"draft_sense_key":"v21:legacy:"+kid,"canonical_sense_id":None,
    "gloss_zh":zh,"gloss_en":en,"render_kind":"sense_recognition",
    "question":{"word":lemma,"context":None},"response":{"gloss_zh":zh,"gloss_en":en},
    "source_attribution":"Core20K V2.0.6 frozen runtime","release_eligible":False,"production_ready":False}
   out.write(json.dumps(base,ensure_ascii=False)+"\n")
   audit.write(json.dumps({"rank":rank,"lemma":lemma,"legacy_ku_id":kid,"flags":flags,
    "review_status":"SEMANTIC_AND_ASSESSMENT_QA_PENDING","release_eligible":False},ensure_ascii=False)+"\n")
counts["headwords"]=len(scope);counts["gaps"]=len(gap);counts["unique_legacy_ku_ids"]=len(seen)
assert counts["covered_headwords"]+counts["gaps"]==15000
assert counts["review_records"]==len(seen)
(dest/"no_bilingual_sense_gaps.json").write_text(json.dumps(gap,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
manifest={"scope":"rank5001-20000","frozen_runtime_sha256":hashlib.sha256(raw).hexdigest(),
"metrics":dict(counts),"newly_authored_ku":0,"independently_certified_senses":0,"production_ready_ku":0,
"status":"STAGING_REVIEW_ONLY"}
(dest/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
print("V21_RANKS5001_20000_PASS",json.dumps(manifest,ensure_ascii=False))
