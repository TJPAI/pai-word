#!/usr/bin/env python3
"""CG-MASTER: deterministic bulk author-draft ingestion, identity reconciliation, and QA.

No teaching text, IPA or Sense is fabricated.  Incomplete source rows go into a
production queue rather than being marked ready. Runs locally or in Actions.
"""
import argparse
import gzip
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

def open_text(path):
    return gzip.open(path, "rt", encoding="utf-8") if str(path).endswith(".gz") else open(path, encoding="utf-8")

def load_rows(path):
    with open_text(path) as f:
        first = f.read(1)
        f.seek(0)
        if first == "{":
            s = f.read()
            try:
                data = json.loads(s)
                if isinstance(data, dict):
                    for v in ("records", "rows", "items"):
                        if isinstance(data.get(v), list):
                            return data[v]
                    return [data]
                return data
            except json.JSONDecodeError:
                pass
        return [json.loads(line) for line in f if line.strip()]

def sha(path):
    h=hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda:f.read(1024*1024), b""):
            h.update(chunk)
    return h.hexdigest()

def norm(x):
    import unicodedata
    return " ".join(unicodedata.normalize("NFKC", str(x or "")).casefold().split())

def expression(x):
    return x.get("english_expression") or x.get("expression") or x.get("english") or x.get("headword") or x.get("question_page", {}).get("english_expression")

def cue(x):
    return x.get("chinese_meaning") or x.get("chinese_gloss") or x.get("meaning_zh") or x.get("cue_zh") or x.get("question_page", {}).get("cue_zh")

def ident(x):
    return x.get("record_id") or x.get("source_record_id")

def run(args):
    rows = [r for r in load_rows(args.source) if r.get("scene_id") in args.scenes]
    by_row = {}
    for r in rows:
        key = (r.get("scene_id"), r.get("source_final_row"))
        if key in by_row:
            raise ValueError("Duplicate authoritative source row: "+str(key))
        by_row[key] = r
    drafts, errors, repeats = [], [], set()
    for path in args.drafts:
        for r in load_rows(path):
            key=(r.get("scene_id"),r.get("source_final_row"))
            src=by_row.get(key)
            if src is None:
                errors.append({"issue":"missing_source","key":key,"file":str(path)})
                continue
            if key in repeats:
                errors.append({"issue":"duplicate_draft","key":key,"file":str(path)})
                continue
            repeats.add(key)
            for field,a,b in (("record_id",ident(src),ident(r)),("expression",expression(src),expression(r)),("Chinese cue",cue(src),cue(r))):
                if a is not None and b is not None and norm(a)!=norm(b):
                    errors.append({"issue":"identity_mismatch","field":field,"key":key,"source":a,"draft":b})
            q,ans=r.get("question_page",{}),r.get("answer_page",{})
            if (not q.get("english_expression") or not q.get("cue_zh") or
                not all(ans.get(k) for k in ("meaning_zh","example_en","example_zh","usage_note")) or
                len(ans.get("collocations") or []) < 2):
                errors.append({"issue":"incomplete_author_fields","key":key})
            if r.get("release_allowed") is not False or r.get("canonical_sense_id") is not None:
                errors.append({"issue":"forbidden_promotion","key":key})
            drafts.append(r)
    drafts.sort(key=lambda r:(r["scene_id"],r["source_final_row"]))
    queued=[{"scene_id":r["scene_id"],"source_final_row":r["source_final_row"],"record_id":ident(r),
             "english_expression":expression(r),"cue_zh":cue(r),"source_status":r.get("kaikki_evidence_status"),
             "state":"AUTHOR_NOT_PRODUCED"} for k,r in sorted(by_row.items()) if k not in repeats]
    per_scene=defaultdict(lambda:{"source":0,"author_drafts":0,"pending":0})
    for r in rows: per_scene[r["scene_id"]]["source"]+=1
    for r in drafts: per_scene[r["scene_id"]]["author_drafts"]+=1
    for r in queued: per_scene[r["scene_id"]]["pending"]+=1
    out=Path(args.out)
    out.mkdir(parents=True,exist_ok=True)
    batch_size=args.batch_size
    for i in range(0,len(queued),batch_size):
        p=out/("production_queue_%05d_%05d.jsonl.gz"%(i+1,min(len(queued),i+batch_size)))
        with gzip.open(p,"wt",encoding="utf-8") as f:
            for x in queued[i:i+batch_size]:
                f.write(json.dumps(x,ensure_ascii=False)+"\n")
    report={"type":"CGMASTER_BULK_AUTHOR_INGEST_NOT_CERTIFIED","source_sha256":sha(args.source),
            "draft_source_sha256":{str(p):sha(p) for p in args.drafts},
            "source_rows":len(rows),"unique_drafts":len(drafts),"queued":len(queued),
            "errors":errors,"per_scene":dict(sorted(per_scene.items())),
            "batch_size":batch_size,"release_allowed":False,
            "formal_ipa_approved":0,"formal_sense_approved":0,
            "notes":["Source-exact data only; no automatic teaching content generation","Any mismatched source blocks acceptance","Source and drafts remain unchanged"]}
    (out/"ingest_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    if errors:
        raise SystemExit("Validation failed: %d errors; inspect ingest_report.json"%len(errors))
    (out/"validated_author_drafts.json").write_text(json.dumps({"records":drafts,"release_allowed":False},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:report[k] for k in ("source_rows","unique_drafts","queued","batch_size")},ensure_ascii=False))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--source",type=Path,required=True,help="Authoritative V105 JSONL.gz")
    p.add_argument("--drafts",type=Path,nargs="+",required=True,help="Disjoint author drafts, merged file OR increments")
    p.add_argument("--scenes",nargs="+",required=True,help="First 100 scene IDs")
    p.add_argument("--batch-size",type=int,default=3000)
    p.add_argument("--out",required=True)
    a=p.parse_args()
    if not 1<=a.batch_size<=10000: p.error("--batch-size must be 1..10000")
    run(a)
