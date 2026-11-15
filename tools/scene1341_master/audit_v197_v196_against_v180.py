#!/usr/bin/env python3
"""Independent V196 regression: verifies REAL V180/V147/V196 packages by decoded rows.
Does not alter original Master or promote TEST_ONLY/HOLD.
Usage:
 python tools/scene1341_master/audit_v197_v196_against_v180.py \
   --base-v180-zip path/to/V180.zip --author-v147-json path/to/V147.json \
   --merged-v196-zip path/to/V196.zip
"""
import argparse, collections, gzip, hashlib, json, pathlib, zipfile

EXPECTED_V196 = (
("6277960ad62e25a8890779197462022001cce67433bc2f717f775248d89a18eb","b669c2e1f7c3b4ee5cc810ff9d4a659e90c37e4f"),
("bcb75751a23ecaf047b61643ea55d0efddde772b8e8798ad78bf5421b5f8b2a1","0ee0e9e91252bf714f2ceffe40e1b0f79c06375c"),
("d454b019f3f2b44fbfacc37c285fd632adb78ad0750c020c3e4c414e7145858e","fe1b8ca09cc6a9bf28e0bc9aa4d27832c8e65ba9"),
("bcd59b218a9da6850d6aaec89474bf837dc4b8cd2e52e6ca8314cdee8fbf02ea","6247fefa053358290c57205a332da594574882b0"))
EXPECTED_V180 = (
"739dfe385e2da4215c7a5096c5afa09873161ab683c45819d898c6e903448169",
"12a638cbfa6ec88b89f07c8e10c200be7a54763f8fb1f5dcd861e3b122b3e7ca",
"5f87c64238814e4ab155530b4549424609a1c3950cb602cb179c11510662888a",
"4fb8eb26d9c9aa023ce92c7273605553ce76d6fa27628516f5d18b08ee30e44e")
def read_shards(path,digests,git=False):
 out=[]
 with zipfile.ZipFile(path) as z:
  names=sorted(n for n in z.namelist() if n.endswith(".jsonl.gz"))
  assert len(names)==4,("SHARD_COUNT",names)
  for i,name in enumerate(names):
   raw=z.read(name)
   assert hashlib.sha256(raw).hexdigest()==(digests[i][0] if git else digests[i]),("SHA256",name)
   if git:
    blobhash=hashlib.sha1(("blob %d\0"%len(raw)).encode()+raw).hexdigest()
    assert blobhash==digests[i][1],("GIT_BLOB",name)
   part=[json.loads(t) for t in gzip.decompress(raw).splitlines()]
   assert len(part)==750,("ROWS",name)
   out.extend(part)
 return out

def main():
 p=argparse.ArgumentParser()
 p.add_argument("--base-v180-zip",type=pathlib.Path,required=True)
 p.add_argument("--author-v147-json",type=pathlib.Path,required=True)
 p.add_argument("--merged-v196-zip",type=pathlib.Path,required=True)
 args=p.parse_args()
 base=read_shards(args.base_v180_zip,EXPECTED_V180)
 final=read_shards(args.merged_v196_zip,EXPECTED_V196,True)
 author=json.loads(args.author_v147_json.read_text(encoding="utf-8"))["records"]
 index={r["source_final_row"]:r for r in author}
 assert len(author)==len(index)==243
 assert set(index)==set(range(3133,3376))
 assert len(base)==len(final)==3000
 assert [r["source_final_row"] for r in final]==list(range(3001,6001))
 assert len({r["record_id"] for r in final})==3000
 changed=[]; per_scene=collections.defaultdict(lambda:[0,0,0])
 for old,new in zip(base,final):
  sr=new["source_final_row"]
  assert old["record_id"]==new["record_id"] and old["source_final_row"]==sr
  assert old["scene_id"]==new["scene_id"] and old["expression"]==new["expression"] and old["meaning_zh"]==new["meaning_zh"]
  for key in ("question_page","pronunciation","sense_evidence","canonical_sense_id","candidate_group_not_sense_id"):
   assert old[key]==new[key],("SOURCE_FIELD_CLOBBER",sr,key)
  assert new["release_allowed"] is False and new.get("srs_eligible") is not True
  if sr not in index:
   assert old==new,("UNEXPECTED_CHANGE_OUTSIDE_SC0014",sr)
  else:
   a=index[sr]
   assert new["record_id"]==a["record_id"] and new["scene_id"]==a["scene_id"]
   assert new["expression"]==a["question_page"]["english_expression"]
   assert new["question_page"]["cue_zh"]==a["question_page"]["cue_zh"]
   assert new["meaning_zh"]==a["answer_page"]["meaning_zh"]
   for key in ("example_en","example_zh","collocations","usage_note"):
    assert not old["answer_page"].get(key),("AUTHOR_CLOBBER",sr,key)
    assert new["answer_page"][key]==a["answer_page"][key],("AUTHOR_MISMATCH",sr,key)
   assert new["qa_status"]=="PENDING_INDEPENDENT_QA"
   assert new["srs_eligible"] is False
   changed.append(sr)
  st=per_scene[new["scene_id"]]
  st[0]+=1; st[1]+=bool(new["pronunciation"].get("selected_ipa_test_only"))
  st[2]+=bool(new["answer_page"].get("example_en"))
 assert changed==list(range(3133,3376))
 assert sum(r[0] for r in per_scene.values())==3000
 assert sum(r[1] for r in per_scene.values())==1162
 assert sum(r[2] for r in per_scene.values())==243
 print(json.dumps({"status":"PASS_V196_NONCERTIFYING_SOURCE_DIFF","rows":3000,"author_merged":243,"other_rows_bitwise_json_unchanged":2757,
  "source_question_pronunciation_sense_evidence_changed":0,"test_ipa":1162,"bilingual_examples":243,
  "sc0014_v180_test_ipa":per_scene["SC50-0014"][1],
  "sc0014_v171_test_ipa_reported":237,"sc0014_ipa_candidate_difference_requires_source_adjudication":143,
  "formal_ready":0,"srs_eligible":False,"by_scene":dict(sorted(per_scene.items()))},ensure_ascii=False,indent=2))
if __name__=="__main__":main()
