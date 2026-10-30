#!/usr/bin/env python3
"""Verify V179 JSONL shard bundle. Strictly read-only; never modify Runtime."""
import hashlib, json, pathlib, sys, zipfile
HERE = pathlib.Path(__file__).resolve().parent
m = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))
src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE
keys = set()
count = 0
for name, expected in m["shards"].items():
    if src.is_file() and zipfile.is_zipfile(src):
        with zipfile.ZipFile(src) as z:
            content = z.read(name)
    else:
        content = (src / name).read_bytes()
    assert len(content) == expected["bytes"], (name, "size")
    assert hashlib.sha256(content).hexdigest() == expected["sha256"], (name, "sha256")
    for line in content.decode("utf-8").splitlines():
        if not line.strip(): continue
        row = json.loads(line)
        key = row.get("source_sense_key") or row.get("sense_key")
        assert key and key not in keys, (name, "duplicate or missing Sense Key", key)
        keys.add(key)
        count += 1
assert count == m["expected_records"], (count, m["expected_records"])
assert len(keys) == m["expected_unique_sense_keys"]
print(json.dumps({"status":"PASS","records":count,"unique_keys":len(keys),"shards":len(m["shards"]),"certified":0}))
