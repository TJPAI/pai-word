#!/usr/bin/env python3
"""Export versioned V2.1 review release candidate: complete frozen base + separate editorial staging.
No unsupported claims of formal Sense/KU certification.
"""
import json,gzip,pathlib,hashlib,collections,datetime
root=pathlib.Path("tools/core20k_sense_v1/editorial")
dest=pathlib.Path("tools/core20k_sense_v1/release/v2.1-rc1");dest.mkdir(parents=True,exist_ok=True)
runtime=pathlib.Path("data/core20k-runtime.json.gz")
raw=runtime.read_bytes()
with gzip.open(runtime,"rt",encoding="utf-8") as f: base=json.load(f)
words=base["headwords"];assert len(words)==20000
assert [w[0] for w in words]==list(range(1,20001))
assert len({str(w[1]).casefold() for w in words})==20000
mapping={int(w[0]):w for w in words}
copy=dest/"core20k-v206-frozen-runtime.json.gz"
copy.write_bytes(raw)
sensefiles=["v21_first6_sense_ku_semantic_edits.jsonl","v21_next4_sense_content.jsonl"]
kufiles=["v21_first6_supplemental_ku.jsonl","v21_next6_ku_content.jsonl"]
def load(paths):
 return [json.loads(line) for name in paths for line in (root/name).open(encoding="utf8") if line.strip()]
senses=load(sensefiles);kus=load(kufiles)
assert len(senses)==10 and len(kus)==12
for r in senses:
 rank=r["rank"];assert mapping[rank][1]==r["lemma"]
 assert r["gloss_en"].strip() and r["gloss_zh"].strip()
 assert r["release_eligible"] is False
for r in kus:
 rank=r["rank"];assert mapping[rank][1]==r["lemma"]
 assert r["question"].count("___")==1
 assert r["correct_answer"] in r["acceptable_answers"]
 assert r["release_eligible"] is False
valid=[];quarantine=[]
for r in kus:
 if r.get("review_status","").startswith("BLOCKED"):
  quarantine.append(r);continue
 valid.append(r)
assert len(valid)==11 and len(quarantine)==1
for name,data in [("v21-sense-editorial-staging.jsonl",senses),("v21-ku-teaching-staging.jsonl",valid),("v21-quarantined-ku.jsonl",quarantine)]:
 with (dest/name).open("w",encoding="utf8") as f:
  for r in data:f.write(json.dumps(r,ensure_ascii=False)+"\n")
legacy=collections.Counter()
for rank,lemma,pos,ipa,kus0,*_ in words:
 legacy["headwords"]+=1
 legacy["legacy_ku_records"]+=len(kus0)
 legacy["legacy_sense_ku_records"]+=sum(isinstance(k,list) and len(k)>1 and str(k[1]).lower()=="sense" for k in kus0)
manifest={"release_id":"Core20K-V2.1-Content-RC1","status":"STAGING_REVIEW_ONLY","membership_baseline":"Core20K_LongTerm_V2.0.6_FINAL_FROZEN",
 "frozen_runtime_sha256":hashlib.sha256(raw).hexdigest(),"frozen_runtime_bytes":len(raw),
 "headwords":20000,"baseline_counts":dict(legacy),
 "editorial_sense_staging":len(senses),"teaching_ku_staging":len(valid),"quarantined_ku":len(quarantine),
 "production_ready_new_sense":0,"production_ready_new_ku":0,
 "policy":"Base runtime copied byte-for-byte. Never infer certified Sense/KU from embedding candidate.",
 "files":["core20k-v206-frozen-runtime.json.gz","v21-sense-editorial-staging.jsonl","v21-ku-teaching-staging.jsonl","v21-quarantined-ku.jsonl"]}
(dest/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_V21_EXPORT_PASS",json.dumps(manifest,ensure_ascii=False))
