#!/usr/bin/env python3
"""V186: batch Scene1341 production by 3000 DISTINCT verified Global Sense identities.
Read source-row-sorted JSONL/JSONL.GZ overlays; never equate candidate groups with verified IDs.
No write to source Master and no implicit SRS/Ready.
"""
import argparse,collections,gzip,json,pathlib

def read_rows(paths):
    for path in paths:
        op=gzip.open if str(path).endswith(".gz") else open
        with op(path,"rt",encoding="utf-8") as f:
            for ln in f:
                if ln.strip():
                    yield json.loads(ln)

def is_verified_identity(record):
    sid=record.get("global_sense_id")
    if not isinstance(sid,str) or not sid.strip():
        return None
    if record.get("semantic_status") in (
        "HOLD_GLOBAL_SENSE_ID_NOT_YET_VERIFIED",
        "HOLD_UNRESOLVED","CANDIDATE_ONLY","PROVISIONAL_ONLY"
    ):
        return None
    proof=record.get("global_sense_identity_evidence") or {}
    if proof.get("identity_verified") is not True:
        return None
    if not proof.get("source_locator") or not proof.get("semantic_alignment_evidence"):
        return None
    return sid

def make_batches(rows,batch_size=3000):
    seen_records=set();globally_assigned=set();batched=[]
    pending_ids=set();associated=0;held=0;rows_since=0
    last_row=0
    for row in rows:
        n=row.get("source_final_row")
        rid=row.get("record_id")
        if not isinstance(n,int) or n<=last_row:
            raise ValueError("source_final_row must be strictly increasing and unique")
        if not rid or rid in seen_records:
            raise ValueError("Missing or duplicate record_id")
        last_row=n;seen_records.add(rid);rows_since+=1
        sid=is_verified_identity(row)
        if sid is None:
            held+=1
            continue
        associated+=1
        if sid not in globally_assigned:
            globally_assigned.add(sid)
            pending_ids.add(sid)
        if len(pending_ids)==batch_size:
            batched.append({
                "batch":len(batched)+1,
                "distinct_global_senses":len(pending_ids),
                "sense_scene_associations_scanned":rows_since,
                "matched_associations":associated,
                "hold_records":held,
                "through_source_final_row":last_row,
                "certification":"STAGING_ONLY_NO_READY_NO_SRS"
            })
            pending_ids=set();associated=held=rows_since=0
    return {
        "target_unique_senses_per_batch":batch_size,
        "complete_batches":batched,
        "partial_unique_senses":len(pending_ids),
        "partial_source_rows":rows_since,
        "partial_hold_records":held,
        "total_global_senses_seen":len(globally_assigned),
        "total_unique_source_records_scanned":len(seen_records),
        "last_source_final_row":last_row,
        "note":"No unverified or provisional sense group counted. Source order and identities preserved."
    }

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("shards",nargs="+",type=pathlib.Path,help="JSONL or .jsonl.gz, already sorted by source_final_row")
    p.add_argument("--size",type=int,default=3000)
    p.add_argument("--output",type=pathlib.Path,required=True)
    args=p.parse_args()
    if args.size<1: p.error("--size must be positive")
    out=make_batches(read_rows(args.shards),args.size)
    args.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in out.items() if k!="complete_batches"},ensure_ascii=False))
