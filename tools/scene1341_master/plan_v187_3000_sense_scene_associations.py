#!/usr/bin/env python3
"""V187 user-corrected: every 3000 Sense–Scene source associations form one batch.
HOLD/provisional/duplicate Global Sense identities still count as associations.
Inputs are ordered JSONL or JSONL.GZ Master overlays.
"""
import argparse, gzip, json, pathlib, collections

def scan(paths, batch_size=3000):
    if batch_size < 1: raise ValueError("batch_size must be positive")
    seen=set(); previous=0; batch=[]; batches=[]
    def report(chunk,index):
        ids=[r.get("global_sense_id") for r in chunk]
        verified=set(x for x in ids if isinstance(x,str) and x)
        statuses=collections.Counter(str(r.get("semantic_status") or "UNKNOWN") for r in chunk)
        return {"batch":index,"source_final_row_start":chunk[0]["source_final_row"],
                "source_final_row_end":chunk[-1]["source_final_row"],
                "sense_scene_associations":len(chunk),
                "distinct_nonempty_global_sense_id_values_unverified":len(verified),
                "semantic_status_counts":dict(statuses),
                "counting_policy":"HOLD and repeated global senses still count once per source association"}
    for path in paths:
        op=gzip.open if str(path).endswith(".gz") else open
        with op(path,"rt",encoding="utf-8") as f:
            for line in f:
                if not line.strip(): continue
                r=json.loads(line);n=r.get("source_final_row");rid=r.get("record_id")
                if not isinstance(n,int) or n != previous+1: raise ValueError("source_final_row discontinuity")
                if not rid or rid in seen: raise ValueError("duplicate/missing source record ID")
                seen.add(rid); previous=n; batch.append(r)
                if len(batch)==batch_size:
                    batches.append(report(batch,len(batches)+1));batch=[]
    return {"batch_size":batch_size,"unit":"SENSE_SCENE_ASSOCIATION_RECORD",
            "total_associations_scanned":len(seen),"completed_batches":batches,
            "partial_batch":report(batch,len(batches)+1) if batch else None,
            "global_sense_dedup_is_separate":True}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("shards",nargs="+",type=pathlib.Path)
    p.add_argument("--size",type=int,default=3000)
    p.add_argument("--output",type=pathlib.Path,required=True)
    a=p.parse_args();result=scan(a.shards,a.size)
    a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"total":result["total_associations_scanned"],"batches":len(result["completed_batches"])},ensure_ascii=False))
