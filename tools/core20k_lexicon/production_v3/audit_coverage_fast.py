#!/usr/bin/env python3
"""Fast deterministic coverage audit. No third-party packages, no runtime writes."""
import collections, json, pathlib, sys
BASE=pathlib.Path(__file__).resolve().parent
def load(glob):
    for path in sorted(BASE.glob(glob)):
        for line_no,line in enumerate(path.read_text(encoding="utf-8").splitlines(),1):
            if not line.strip(): continue
            try: yield path.name,line_no,json.loads(line)
            except Exception as e: raise ValueError(f"{path}:{line_no}: {e}")
def main():
    sources=list(load("v4_ai_gloss_batch_*.jsonl"))
    ku=list(load("ku_drafts/v*/ku_*.jsonl"))
    ids=collections.Counter(str(x.get("ku_id","")) for _,_,x in ku)
    senses=collections.Counter(str(x.get("teaching_sense_id","")) for _,_,x in ku)
    src_ids={x["teaching_sense_id"] for _,_,x in sources if x.get("teaching_sense_id")}
    covered=set(senses)&src_ids
    missing=sorted(src_ids-covered)
    invalid=[{"file":p,"line":n,"ku_id":x.get("ku_id")} for p,n,x in ku if not x.get("ku_id") or not x.get("teaching_sense_id") or (x.get("render_kind")=="sense_recognition" and (not isinstance(x.get("options"),list) or len(x["options"])!=4 or len(set(x["options"]))!=4 or x.get("response") not in x["options"]))]
    existing_batches={int(p.name.split("_")[-1].split(".")[0]) for p in BASE.glob("v4_ai_gloss_batch_*.jsonl")}
    report={
      "source_files":len({p for p,_,_ in sources}),"source_rows":len(sources),
      "unique_source_sense_ids":len(src_ids),"duplicate_source_sense_ids":len(sources)-len(src_ids),
      "missing_source_batches":[n for n in range(1,max(existing_batches,default=0)+1) if n not in existing_batches],
      "ku_files":len({p for p,_,_ in ku}),"ku_records":len(ku),
      "unique_ku_ids":len(ids),"duplicate_ku_id_records":sum(n-1 for n in ids.values() if n>1),
      "unique_ku_sense_ids":len(senses),"unique_ku_rank_lemma":len({(x.get("rank"),x.get("lemma")) for _,_,x in ku}),
      "source_sense_covered":len(covered),"source_sense_missing":len(missing),
      "orphan_ku_sense_ids":len(set(senses)-src_ids),"invalid_structure":len(invalid),
      "draft_ku_records":sum(x.get("draft") is True for _,_,x in ku),
      "production_ready":sum(x.get("production_ready") is True for _,_,x in ku),
      "source_gap_first_500":missing[:500],
      "invalid_structure_sample":invalid[:30],
      "duplicate_ku_id_sample":[k for k,n in ids.items() if n>1][:30],
    }
    # Recovered V93 source is the authoritative full teaching_sense_id register.
    # Produce an uncovered candidate list, not KU and not a semantic certification.
    recovered=list(load("recovery/v93_register_20261030/shards/senses_*.jsonl"))
    recovered_map={}
    for _,_,x in recovered:
      sid=x.get("teaching_sense_id")
      if sid:
        if sid in recovered_map: raise ValueError("duplicate recovered teaching_sense_id: "+sid)
        recovered_map[sid]=x
    missing_v93=[x for sid,x in recovered_map.items() if sid not in senses]
    missing_v93.sort(key=lambda x:(int(x.get("rank",999999)),str(x.get("teaching_sense_id"))))
    def candidate(x):
      zh=x.get("zh_candidates") or []
      zh_list=[v.strip() for z in zh if isinstance(z,dict) for v in [z.get("value","")] if isinstance(v,str) and v.strip()]
      return {"teaching_sense_id":x.get("teaching_sense_id"),"rank":x.get("rank"),"lemma":x.get("lemma"),"pos":x.get("pos"),"definition_en":x.get("definition_en"),"synset_id":x.get("synset_id"),"chinese_lexicalizations":list(dict.fromkeys(zh_list)),"gloss_zh_status":"SOURCE_CANDIDATE_NOT_EDITORIALLY_SELECTED","source_pack":"v93_recovered_register"}
    eligible=[candidate(x) for x in missing_v93 if x.get("teaching_sense_id") and x.get("lemma") and x.get("definition_en") and x.get("zh_candidates")]
    report["recovered_v93_sense_rows"]=len(recovered)
    report["recovered_v93_unique_sense_ids"]=len(recovered_map)
    report["recovered_v93_uncovered_sense_count"]=len(missing_v93)
    report["recovered_v93_uncovered_eligible_count"]=len(eligible)
    report["batch091_first_500_uncovered_candidates"]=eligible[:500]
    report["batch092_first_500_uncovered_candidates"]=eligible[:500]
    report["batch093_first_500_uncovered_candidates"]=eligible[:500]
    report["batch094_first_500_uncovered_candidates"]=eligible[:500]
    report["batch095_first_500_uncovered_candidates"]=eligible[:500]
    report["batch096_first_500_uncovered_candidates"]=eligible[:500]
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if len(sys.argv)>1: pathlib.Path(sys.argv[1]).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__":main()
