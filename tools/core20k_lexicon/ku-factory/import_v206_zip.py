#!/usr/bin/env python3
"""Safely import the Core20K V2.0.6 200-shard ZIP into a checkout.

Does not derive/approve canonical Sense or KU IDs.
Run from repository root:
 python3 tools/core20k_lexicon/ku-factory/import_v206_zip.py --zip /path/core20k-ku-github-import-v206.zip
"""
import argparse, hashlib, json, pathlib, zipfile

SRC_SHA = "e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca"
ROLE_SHA = "00c5f24325b69044dd90289d68087165ad45ee3162359d2b721487cee6586ebc"
ROOT = pathlib.Path("tools/core20k_lexicon/ku-factory/input/v206")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True, type=pathlib.Path)
    parser.add_argument("--output", type=pathlib.Path, default=ROOT)
    a=parser.parse_args()
    with zipfile.ZipFile(a.zip) as archive:
        manifest=json.loads(archive.read("manifest.json"))
        if manifest.get("source_sha256") != {"frozen":SRC_SHA,"roles":ROLE_SHA}:
            raise SystemExit("SOURCE_SHA_MISMATCH")
        if manifest.get("records") != 20000 or len(manifest.get("batches",{}))!=40:
            raise SystemExit("EXPECTED_40_BATCHES_20000_ROWS")
        seen=set()
        contents={}
        for number in range(1,41):
            bid=f"{number:03d}"
            shards=manifest["batches"].get(bid,[])
            if len(shards)!=5: raise SystemExit(f"BAD_SHARD_COUNT_{bid}")
            batch_rows=[]
            for sh, item in enumerate(shards):
                path=item["path"]
                start=(number-1)*500+sh*100+1
                expected=f"{bid}/ranks-{start:04d}-{start+99:04d}.jsonl"
                if path!=expected:raise SystemExit(f"BAD_SHARD_NAME_{path}")
                data=archive.read(path)
                if hashlib.sha256(data).hexdigest()!=item["sha256"]:
                    raise SystemExit(f"BAD_SHARD_SHA_{path}")
                rows=[json.loads(line) for line in data.decode("utf8").splitlines()]
                if len(rows)!=100 or item.get("rows")!=100:
                    raise SystemExit(f"BAD_ROW_COUNT_{path}")
                for offset,row in enumerate(rows):
                    if row.get("rank")!=start+offset or row.get("source_version")!="Core20K_LongTerm_V2.0.6":
                        raise SystemExit(f"BAD_RANK_VERSION_{path}")
                    if row.get("sense_status")!="NOT_INCLUDED_IN_SOURCE" or "sense_id" in row or "ku_id" in row:
                        raise SystemExit(f"UNAPPROVED_ID_{path}")
                    lemma=row.get("lemma","").casefold()
                    if not lemma or lemma in seen:raise SystemExit(f"DUPLICATE_LEMMA_{path}")
                    seen.add(lemma)
                batch_rows.extend(rows)
                contents[path]=data
            if len(batch_rows)!=500:raise SystemExit(f"BAD_BATCH_{bid}")
        if len(seen)!=20000 or len(contents)!=200:
            raise SystemExit("GLOBAL_COVERAGE_FAIL")
        # Do not overwrite different existing bytes.
        for rel,data in contents.items():
            target=a.output/rel
            if target.exists() and target.read_bytes()!=data:
                raise SystemExit(f"EXISTING_FILE_CONFLICT_{rel}")
        for rel,data in contents.items():
            target=a.output/rel
            target.parent.mkdir(parents=True,exist_ok=True)
            if not target.exists():target.write_bytes(data)
        (a.output/"import-manifest.json").write_text(
            json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
        print(json.dumps({"status":"PASS","shards":200,"headwords":20000,"batches":40}))
if __name__=="__main__":main()
