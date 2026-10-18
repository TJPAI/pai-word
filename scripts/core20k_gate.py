#!/usr/bin/env python3
"""Read-only Core20K membership gate: no API, no uploads, no main edits."""
import argparse, csv, hashlib, json
from pathlib import Path

def digest(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def run():
    ap=argparse.ArgumentParser()
    ap.add_argument("--master",required=True,type=Path)
    ap.add_argument("--audit",required=True,type=Path)
    ap.add_argument("--out",required=True,type=Path)
    args=ap.parse_args()
    audit=json.loads(args.audit.read_text(encoding="utf-8"))
    seen=set(); ranks=set(); errors=[]; count=0
    with args.master.open(newline="",encoding="utf-8-sig") as f:
        reader=csv.DictReader(f)
        for needed in ("core20k_rank_final","lemma"):
            if needed not in (reader.fieldnames or []): errors.append(f"missing column: {needed}")
        if not errors:
            for item in reader:
                count+=1
                lemma=(item.get("lemma") or "").strip().casefold()
                if not lemma: errors.append(f"empty lemma at row {count}")
                if lemma in seen: errors.append(f"duplicate lemma: {lemma}")
                seen.add(lemma)
                try:
                    rank=int(item["core20k_rank_final"])
                    if rank in ranks: errors.append(f"duplicate rank: {rank}")
                    ranks.add(rank)
                except (TypeError,ValueError): errors.append(f"invalid rank at row {count}")
    if count != 20000: errors.append(f"row count: {count} != 20000")
    if ranks != set(range(1,20001)): errors.append("ranks not exactly 1..20000")
    if audit.get("status") != "FINAL_FROZEN": errors.append("audit not FINAL_FROZEN")
    if audit.get("rows") != count: errors.append("audit row count mismatch")
    if audit.get("casefold_unique_lemmas") != len(seen): errors.append("audit uniqueness mismatch")
    if audit.get("version") != "Core20K_LongTerm_V2.0.6": errors.append("audit version mismatch")
    report={"gate":"membership-only","passed":not errors,
            "master_sha256":digest(args.master),"audit_sha256":digest(args.audit),
            "rows":count,"casefold_unique":len(seen),"errors":errors[:100],
            "warning":"Does NOT verify dictionary provenance, sense/KU quality, or runtime."}
    args.out.mkdir(parents=True,exist_ok=True)
    (args.out/"core20k-membership-qa.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return 0 if not errors else 1
if __name__=="__main__": raise SystemExit(run())
