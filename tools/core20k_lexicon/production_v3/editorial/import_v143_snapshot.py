#!/usr/bin/env python3
"""Import corrected V143 snapshot, fail closed on missing Chinese glosses."""
import argparse,json,pathlib,zipfile
from validate_v143_snapshot import validate
FILES=("full_688_drafts.jsonl","remaining_988_source.jsonl","current_1676_joint_state.jsonl","priority_135.csv","manifest.json")
def main():
    p=argparse.ArgumentParser()
    p.add_argument("archive",type=pathlib.Path)
    p.add_argument("--output-dir",type=pathlib.Path,required=True)
    a=p.parse_args()
    result=validate(a.archive)
    a.output_dir.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(a.archive) as z:
        for n in FILES:(a.output_dir/n).write_bytes(z.read(n))
    print(json.dumps(result))
if __name__=="__main__": main()
