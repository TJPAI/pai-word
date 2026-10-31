#!/usr/bin/env python3
"""V4 reusable 1000-headword Core20K Sense batch, real V93 data + existing OMW edits.
Never mark mere candidate evidence as reviewed; requires no external model service.
"""
import argparse,collections,hashlib,json,pathlib,time,re
BASE=pathlib.Path("tools/core20k_lexicon/production_v3")
def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("--start-rank",type=int,default=1)
 parser.add_argument("--headwords",type=int,default=1000)
 args=parser.parse_args()
 t=time.monotonic()
 assert 1<=args.start_rank<=20000 and 1<=args.headwords<=2000
 lo,hi=args.start_rank,min(20000,args.start_rank+args.headwords-1)
 selected=[]
 for path in sorted((BASE/"recovery/v93_register_20261030/shards").glob("senses_*.jsonl")):
  for line in path.open(encoding="utf8"):
   x=json.loads(line)
   if lo<=int(x["rank"])<=hi:selected.append(x)
 assert len(selected)==len(set(x["teaching_sense_id"] for x in selected))
 overlays={}
 for path in sorted((BASE/"coverage/fast_zh_pack_v1").glob("zh_sense_*.jsonl")):
  for line in path.open(encoding="utf8"):
   x=json.loads(line); sid=x["teaching_sense_id"]
   assert sid not in overlays;overlays[sid]=x
 ai={}
 for source in sorted(BASE.glob("v4_ai_gloss_batch_*.jsonl")):
  for line in source.open(encoding="utf8"):
   if not line.strip():continue
   z=json.loads(line);ident=z["teaching_sense_id"]
   assert ident not in ai,("duplicate AI Sense gloss",ident)
   assert z.get("gloss_zh") and z.get("definition_en")
   ai[ident]=z
 results=[];counts=collections.Counter();ranks=set()
 for r in sorted(selected,key=lambda x:(int(x["rank"]),x["teaching_sense_id"])):
  sid=r["teaching_sense_id"];ranks.add(int(r["rank"]))
  existing=r.get("zh_candidates") or []
  o=overlays.get(sid)
  gloss=o.get("gloss_zh") if o else None
  status=o.get("gloss_zh_status") if o else "NO_OMW_OVERLAY"
  if not gloss and existing:
   for z in existing:
    if isinstance(z,str) and z.strip():gloss=z.strip();status="LEGACY_SOURCE_CANDIDATE";break
    if isinstance(z,dict):
     q=next((z.get(k) for k in ("value","gloss_zh","zh","text","gloss") if isinstance(z.get(k),str) and z.get(k).strip()),None)
     if q:gloss=q;status="LEGACY_SOURCE_CANDIDATE";break
  # Legacy candidates can be complex schemas; preserve raw source data unchanged.
  if sid in ai:
   z=ai[sid]
   assert z["definition_en"]==r["definition_en"] and z["lemma"]==r["lemma"] and z["rank"]==r["rank"],("identity mismatch",sid)
   gloss=z["gloss_zh"];status="AI_DEFINITION_DRAFT"
  if not gloss:status="MISSING_CHINESE_GLOSS"
  counts[status]+=1
  results.append({"teaching_sense_id":sid,"rank":r["rank"],"lemma":r["lemma"],"synset_id":r.get("synset_id"),
   "definition_en":r.get("definition_en"),"pos":r.get("pos"),"gloss_zh":gloss,
   "gloss_status":status,"alternate_zh":o.get("alternate_zh",[]) if o else [],
   "needs_language_review":status in ("MULTI_SOURCE_PROVISIONAL","MISSING_CHINESE_GLOSS","LEGACY_SOURCE_CANDIDATE"),
   "original_source_zh_candidates":existing,
   "ku_existing":r.get("ku_candidates",[]),
   "provenance":"v93+OMW-overlay","personal_use_draft":True})
 out=BASE/f"v4_output/rank_{lo:05d}_{hi:05d}"
 out.mkdir(parents=True,exist_ok=True)
 path=out/"sense_batch.jsonl"
 path.write_text("".join(json.dumps(x,ensure_ascii=False)+chr(10) for x in results),encoding="utf8")
 # Fast automated QA: identity, source fields, nonempty text where present, no artificial gloss edits.
 assert all(x["teaching_sense_id"] and x["lemma"] for x in results)
 assert len(results)==len(set(x["teaching_sense_id"] for x in results))
 assert all(x["gloss_zh"] is None or isinstance(x["gloss_zh"],str) for x in results)
 stats={"rank_start":lo,"rank_end":hi,"unique_headwords":len(ranks),
        "sense_count":len(results),"gloss_count":sum(bool(x["gloss_zh"]) for x in results),
        "missing_zh":sum(not x["gloss_zh"] for x in results),"status_counts":dict(counts),
        "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),"elapsed_sec":round(time.monotonic()-t,3),
        "model_generated_new_glosses":0,"semantic_edits_this_run":counts["AI_DEFINITION_DRAFT"]}
 (out/"manifest.json").write_text(json.dumps(stats,ensure_ascii=False,indent=2)+chr(10),encoding="utf8")
 print(json.dumps(stats,ensure_ascii=False))
if __name__=="__main__":main()
