#!/usr/bin/env python3
"""Read-only audit of reservation/cancellation in frozen Core20K gzip Runtime."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

TARGETS = {"reservation", "cancellation"}

def find_rows(node, path="$", depth=0):
    if depth > 18:
        return
    if isinstance(node, dict):
        exact = [k for k, v in node.items() if isinstance(v, str) and v.lower() in TARGETS]
        if exact:
            yield {"path": path, "matched_fields": exact, "row": node}
            return
        for key, value in node.items():
            if isinstance(value, (dict, list)):
                yield from find_rows(value, path + "." + str(key), depth + 1)
    elif isinstance(node, list):
        if any(isinstance(v, str) and v.lower() in TARGETS for v in node):
            yield {"path": path, "row": node}
            return
        for index, value in enumerate(node):
            if isinstance(value, (dict, list)):
                yield from find_rows(value, path + "[" + str(index) + "]", depth + 1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--runtime", default="data/core20k-runtime.json.gz")
    parser.add_argument("--output", default="tools/core20k_lexicon/staging/S113_RUNTIME_RAW_ROWS.json")
    args = parser.parse_args()
    raw = Path(args.runtime).read_bytes()
    root = json.loads(gzip.decompress(raw))
    rows = list(find_rows(root))
    report = {
        "schema": "pai-core20k-s113-raw-rows-v1",
        "status": "RAW_EXTRACTION_ONLY_NOT_CERTIFICATION",
        "runtime_sha256": hashlib.sha256(raw).hexdigest(),
        "runtime_path": args.runtime,
        "root_type": type(root).__name__,
        "root_keys": list(root.keys())[:25] if isinstance(root, dict) else None,
        "matches": rows,
        "matched_row_count": len(rows),
        "warning": "Do not change stable headword/KU IDs based only on this extraction."
    }
    dest = Path(args.output)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if not rows:
        raise SystemExit("No exact lemma rows found. Inspect compact tuple schema before changing anything.")

if __name__ == "__main__":
    main()
