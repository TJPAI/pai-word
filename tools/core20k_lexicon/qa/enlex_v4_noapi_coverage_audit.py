#!/usr/bin/env python3
"""Cost-free source-bound KU coverage audit. Never generates or certifies meanings."""
import argparse, collections, json, pathlib, glob, sys
def read(p):
 with open(p,encoding="utf-8") as f:return json.load(f)
def main():
 a=argparse.ArgumentParser()
 a.add_argument("--source",required=True)
 a.add_argument("--candidates-glob",required=True)
 a.add_argument("--out",required=True)
 opt=a.parse_args()
 src=read(opt.source)["rows"]
 byindex={x["queue_index"]:x for x in src}
 if len(byindex)!=len(src):raise SystemExit("Duplicate source queue index")
 files=sorted(glob.glob(opt.candidates_glob))
 actual={}
 err=[]
 for file in files:
  data=read(file)
  for w in data["words"]:
   idx=w["queue_index"]
   if idx not in byindex:continue
   x=byindex[idx]
   if w.get("lemma")!=x["lemma"] or w.get("rank")!=x["rank"] or w.get("existing_ku_id")!=x["ku_id"]:
    err.append({"index":idx,"issue":"identity_mismatch","file":file});continue
   if idx in actual:
    err.append({"index":idx,"issue":"duplicate_word_candidates","file":file});continue
   actual[idx]=w
 counts=collections.Counter()
 for x in src:
  w=actual.get(x["queue_index"])
  if not w:
   counts["SOURCE_ONLY_NOT_GENERATED"]+=1
  else:
   candidates=w.get("candidates",[])
   if not candidates or any(c.get("activation_allowed") is not False or not c.get("gloss_en") for c in candidates):
    counts["INVALID_CANDIDATE"]+=1
   elif any(c.get("confidence_status")=="NEEDS_SENSE_ALIGNMENT" for c in candidates):
    counts["EN_DRAFT_ZH_UNALIGNED"]+=1
   else:
    counts["PROVISIONAL_NEEDS_REVIEW"]+=1
 result={"schema":"enlex-free-noapi-source-coverage-v1","source_rows":len(src),"candidate_covered":len(actual),"counts":dict(counts),"errors":err[:100],"error_count":len(err),"api_used":False,"model_generated_in_this_step":False,"certified":False}
 pathlib.Path(opt.out).parent.mkdir(parents=True,exist_ok=True)
 pathlib.Path(opt.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(result,ensure_ascii=False))
 return 2 if err else 0
if __name__=="__main__":sys.exit(main())
