#!/usr/bin/env python3
"""Export immutable 500-headword KU worker inputs from verified Core20K V2.0.6 CSVs.

This tool does not invent canonical sense_id or ku_id.
"""
import argparse, csv, hashlib, json, pathlib

FROZEN_SHA = "e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca"
ROLES_SHA = "00c5f24325b69044dd90289d68087165ad45ee3162359d2b721487cee6586ebc"
VERSION = "Core20K_LongTerm_V2.0.6"

def checksum(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def load(path):
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--frozen", required=True, type=pathlib.Path)
    p.add_argument("--roles", required=True, type=pathlib.Path)
    p.add_argument("--out", type=pathlib.Path, default=pathlib.Path("tools/core20k_lexicon/ku-factory/input/v206"))
    args = p.parse_args()
    if checksum(args.frozen) != FROZEN_SHA or checksum(args.roles) != ROLES_SHA:
        raise SystemExit("ERROR: frozen/roles SHA256 mismatch; refusing output")
    words, roles = load(args.frozen), load(args.roles)
    if len(words) != 20000 or len(roles) != 20000:
        raise SystemExit("ERROR: expected exactly 20000 rows")
    by_rank = {}
    for row in roles:
        rank = int(row["core20k_rank"])
        if rank in by_rank:
            raise SystemExit("ERROR: duplicate role rank")
        by_rank[rank] = row
    seen = set()
    output = []
    for w in words:
        rank, lemma = int(w["core20k_rank_final"]), w["lemma"].strip()
        r = by_rank.get(rank)
        if not r or r["lemma"] != lemma or not lemma or lemma.casefold() in seen:
            raise SystemExit("ERROR: role/lemma mismatch or duplicate")
        seen.add(lemma.casefold())
        output.append(dict(rank=rank, lemma=lemma, baseline_role=r["baseline_role"],
                           source_version=VERSION, sense_status="NOT_INCLUDED_IN_SOURCE"))
    output.sort(key=lambda x: x["rank"])
    if [r["rank"] for r in output] != list(range(1, 20001)):
        raise SystemExit("ERROR: non-contiguous ranks")
    args.out.mkdir(parents=True, exist_ok=True)
    manifest = dict(schema="pai-word-ku-rank-input-v1", membership_sha256=FROZEN_SHA,
                    role_ledger_sha256=ROLES_SHA, count=20000, batch_size=500,
                    batches=40, sense_status="SOURCE_HAS_NO_SENSE_IDS",
                    notes="Rank/lemma/role only; DO NOT infer canonical Sense or KU IDs.",
                    batch_files={})
    for i in range(40):
        chunk = output[i * 500:(i + 1) * 500]
        number = f"{i+1:03d}"
        name = f"batch-{number}-b500.jsonl"
        payload = "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in chunk).encode("utf-8")
        (args.out / name).write_bytes(payload)
        manifest["batch_files"][number] = dict(path=name, sha256=hashlib.sha256(payload).hexdigest())
    (args.out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(dict(batches=40, headwords=20000, output=str(args.out))))

if __name__ == "__main__":
    main()
