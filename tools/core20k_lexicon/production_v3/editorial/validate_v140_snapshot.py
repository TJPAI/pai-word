#!/usr/bin/env python3
"""Verify V140 CG-ENLEX snapshot; strictly structural, not semantic certification."""
import argparse
import hashlib
import json
import pathlib
import sys
import zipfile


def load_jsonl(z, path):
    return [json.loads(line) for line in z.read(path).splitlines() if line.strip()]


def validate(archive):
    with zipfile.ZipFile(archive) as z:
        manifest = json.loads(z.read("manifest.json"))
        for filename, expected in manifest["files_sha256"].items():
            actual = hashlib.sha256(z.read(filename)).hexdigest()
            if actual != expected:
                raise ValueError(f"SHA256 mismatch {filename}: {actual} != {expected}")
        drafts = load_jsonl(z, "full_688_drafts.jsonl")
        pending = load_jsonl(z, "remaining_988_source.jsonl")
        joint = load_jsonl(z, "current_1676_joint_state.jsonl")
    k = lambda r: r["sense_key"]
    ds = {k(x) for x in drafts}
    ps = {k(x) for x in pending}
    js = {k(x) for x in joint}
    if len(ds) != len(drafts) or len(ps) != len(pending) or len(js) != len(joint):
        raise ValueError("Duplicate Sense Key")
    if ds & ps or js != ds | ps:
        raise ValueError("Incomplete or overlapping snapshot")
    if (len(drafts), len(pending), len(joint)) != (688, 988, 1676):
        raise ValueError("Unexpected record counts")
    if any(r.get("semantically_certified") or r.get("semantic_certified") or r.get("production_ready") for r in drafts):
        raise ValueError("Uncertified record marked as production ready")
    print("PASS: SHA256, keys, nonoverlap, counts, not-certified gates")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=pathlib.Path)
    args = parser.parse_args()
    try:
        validate(args.archive)
    except (ValueError, OSError, KeyError, zipfile.BadZipFile) as e:
        print("FAIL:", e, file=sys.stderr)
        sys.exit(1)
