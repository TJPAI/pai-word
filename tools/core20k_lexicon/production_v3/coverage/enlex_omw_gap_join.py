#!/usr/bin/env python3
"""Source-bound OMW Chinese lexicalizations for missing-zh recovered senses.
No auto-translation, no AI semantic review, no certification.
"""
import argparse,collections,hashlib,json,pathlib,zipfile
BASE=pathlib.Path("tools/core20k_lexicon/production_v3/recovery/v93_register_20261030")
def main():
 p=argparse.ArgumentParser();p.add_argument("--omw-zip",required=True);p.add_argument("--out",required=True);args=p.parse_args()
 out=pathlib.Path(args.out);out.mkdir(parents=True,exist_ok=True)
 omw=collections.defaultdict(list)
 with zipfile.ZipFile(args.omw_zip) as z:
  with z.open("mapped_cmn_concepts.jsonl") as f:
   for line in f:
    x=json.loads(line)
    for synset in x.get("oewn2025_synsets",[]):
     omw[synset].append(x)
 all_ids=set();matched=0;missing_zh=0;unique_matched=0;ambiguous=0;rankset=set()
 path=out/"omw_zh_evidence_candidates.jsonl"
 with path.open("w",encoding="utf-8") as f:
  for i in range(1,7):
   source=BASE/f"shards/senses_{i:03}.jsonl"
   for line in source.open(encoding="utf-8"):
    r=json.loads(line); sid=r["teaching_sense_id"];assert sid not in all_ids;all_ids.add(sid)
    if r.get("zh_candidates"):continue
    missing_zh+=1
    syn=r.get("synset_id") or ""
    key=syn.removeprefix("oewn-")
    joins=omw.get(key,[])
    if not joins:continue
    matched+=1
    rankset.add(r["rank"])
    unique=len(joins)==1 and len(joins[0].get("ili",[]))==1
    if unique:unique_matched+=1
    else:ambiguous+=1
    lexical=sorted(set(w for j in joins for w in j.get("chinese",[]) if w))
    item={"teaching_sense_id":sid,"rank":r["rank"],"lemma":r["lemma"],"synset_id":syn,
     "source_sense_id":r.get("source_sense_id"),"definition_en":r.get("definition_en"),
     "chinese_lexicalizations":lexical,"ili_candidates":sorted(set(v for j in joins for v in j.get("ili",[]))),
     "provenance":{"source":"OMW-cmn","bridge":"CILI WN30 to OEWN2025","upstream_workflow_run":40984546148,"artifact_id":12945699845,
      "join_type":"EXACT_OEWN_SYNSET_ID","source_evidence_only":True},
     "source_join_unique":unique,"gloss_zh_status":"SOURCE_LEXEME_CANDIDATE_NOT_EDITORIALLY_SELECTED",
     "semantic_certified":False,"production_ready":False}
    f.write(json.dumps(item,ensure_ascii=False)+"\n")
 assert len(all_ids)==27471,(len(all_ids))
 report={"source":"V93 recovered register + V109 pinned OMW artifact","total_sense_ids":len(all_ids),
  "senses_without_existing_zh":missing_zh,"new_source_lexical_evidence_rows":matched,
  "distinct_headwords_with_new_evidence":len(rankset),"one_to_one_synset_ili_links":unique_matched,
  "ambiguous_links":ambiguous,"manual_semantic_reviews":0,"independently_certified":0,"production_ready":0,
  "output_sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
  "artifact_zip_sha256":hashlib.sha256(pathlib.Path(args.omw_zip).read_bytes()).hexdigest()}
 (out/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__": main()
