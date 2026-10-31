#!/usr/bin/env python3
"""Classify OMW-cmn Chinese lexical evidence; NOT semantic approval."""
import collections,hashlib,json,pathlib,re
ROOT=pathlib.Path("tools/core20k_lexicon/production_v3/coverage/omw_zh_gap_persistence")
OUT=pathlib.Path("tools/core20k_lexicon/production_v3/coverage/omw_tier_output")
BAD=re.compile(r"[+*/\\=<>|{}\[\]@]|[A-Za-z0-9]")
def main():
 OUT.mkdir(parents=True,exist_ok=True)
 files=sorted(ROOT.glob("candidates_*.jsonl"));assert len(files)==15,len(files)
 seen=set();count=collections.Counter()
 dst=OUT/"tiered_candidates.jsonl"
 with dst.open("w",encoding="utf-8") as target:
  for p in files:
   for line in p.open(encoding="utf-8"):
    x=json.loads(line);sid=x["teaching_sense_id"]
    assert sid not in seen;seen.add(sid)
    zh=x["chinese_lexicalizations"]
    assert zh and x["source_join_unique"]
    bad=[v for v in zh if BAD.search(v) or len(v)>12 or not re.search("[\\u3400-\\u9fff]",v)]
    tier="SINGLE_LEXEME_CLEAN_FOR_EDITORIAL" if len(zh)==1 and not bad else ("MULTI_LEXEME_FOR_SELECTION" if len(zh)>1 and not bad else "LEXEME_FORMAT_REVIEW")
    count[tier]+=1
    target.write(json.dumps({"teaching_sense_id":sid,"rank":x["rank"],"lemma":x["lemma"],"synset_id":x["synset_id"],"definition_en":x["definition_en"],"chinese_lexicalizations":zh,"tier":tier,"format_warnings":bad,"origin":"OMW-cmn via CILI/OEWN exact synset","semantic_reviewed":False,"certified":False,"production_ready":False},ensure_ascii=False)+"\n")
 assert len(seen)==7302,len(seen)
 sha=hashlib.sha256(dst.read_bytes()).hexdigest()
 report={"total":len(seen),"source_shards":len(files),"tier_counts":dict(count),"semantic_reviewed":0,"production_ready":0,"sha256":sha}
 (OUT/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
