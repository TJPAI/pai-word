#!/usr/bin/env python3
"""Import V140 snapshot from an uploaded ZIP after full integrity validation."""
import argparse, json, pathlib, sys, zipfile
from validate_v141_snapshot import validate

FILES=("full_688_drafts.jsonl","remaining_988_source.jsonl","current_1676_joint_state.jsonl","priority_135.csv","manifest.json")

def main():
    p=argparse.ArgumentParser()
    p.add_argument("archive",type=pathlib.Path)
    p.add_argument("--output-dir",type=pathlib.Path,required=True)
    args=p.parse_args()
    report=validate(args.archive)
    args.output_dir.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(args.archive) as z:
        for name in FILES:
            dest=args.output_dir/name
            dest.write_bytes(z.read(name))
    print(json.dumps({"imported":list(FILES),"validation":report,"source":str(args.archive)},ensure_ascii=False))
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("IMPORT_FAILED:",e,file=sys.stderr)
        raise
