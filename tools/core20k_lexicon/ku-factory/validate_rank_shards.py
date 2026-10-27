#!/usr/bin/env python3
"""Validate committed KU factory input shards, never certify Sense/KU content."""
import argparse, collections, hashlib, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent / "input" / "v206"
ROLES = {"INHERITED_CORE13K_LEXICAL", "LEXICAL_SEMANTIC", "STRUCTURAL"}

def validate(root, batch):
    folder = root / f"{batch:03d}"
    expected_start = (batch-1)*500+1
    problems, rows = [], []
    files = sorted(folder.glob("ranks-*.jsonl"))
    if len(files) != 5:
        problems.append(f"expected 5 shards, found {len(files)}")
    for file in files:
        for n, line in enumerate(file.read_text(encoding="utf-8").splitlines(), 1):
            try: r = json.loads(line)
            except ValueError:
                problems.append(f"bad JSON {file.name}:{n}"); continue
            if r.get("sense_status") != "NOT_INCLUDED_IN_SOURCE":
                problems.append(f"invalid sense status {file.name}:{n}")
            if "sense_id" in r or "ku_id" in r:
                problems.append(f"unapproved canonical ID {file.name}:{n}")
            if r.get("baseline_role") not in ROLES:
                problems.append(f"unknown role {file.name}:{n}")
            rows.append(r)
    ranks = [r.get("rank") for r in rows]
    if ranks != list(range(expected_start, expected_start+500)):
        problems.append("rank sequence/coverage invalid")
    if len({r.get("lemma", "").casefold() for r in rows}) != len(rows):
        problems.append("duplicate lemmas")
    return dict(batch=f"{batch:03d}", records=len(rows), shards=len(files),
                rank_start=expected_start, rank_end=expected_start+499,
                status="PASS" if not problems else "FAIL", issues=problems)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root",type=pathlib.Path,default=ROOT)
    p.add_argument("--batches",nargs="+",type=int,default=[1,2])
    args=p.parse_args()
    results=[validate(args.root,b) for b in args.batches]
    print(json.dumps({"results":results},ensure_ascii=False,indent=2))
    if any(r["status"]!="PASS" for r in results):sys.exit(1)

if __name__=="__main__":main()
