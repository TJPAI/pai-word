#!/usr/bin/env python3
"""V35+ incremental Chinese gloss merge; exact V34 sense SHA required.
Inputs are JSON arrays of sense objects and JSONL editorial deltas.
No canonical IDs may be added, removed, or rewritten.
"""
import argparse, hashlib, json, pathlib, sys

V34_SENSE_SHA = "2c6fbd78e7a937f794b267fe59afbcc4a7cc224c7c0a8736a3f21dfb9fec3efc"
VALID_ID_FIELDS = ("teaching_sense_id",)
GLOSS_FIELDS = ("gloss_zh", "core_definition_zh", "zh_gloss", "zh_gloss_editorial_draft")

def digest(b):
    return hashlib.sha256(b).hexdigest()

def parse_rows(path):
    data = json.loads(path.read_text(encoding="utf8"))
    if not isinstance(data, list):
        raise ValueError("SENSE_JSON_MUST_BE_ARRAY")
    return data

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--sense", required=True, help="V34 full sense JSON array; preserve original bytes")
    p.add_argument("--delta", required=True, help="V35 JSONL with teaching_sense_id + gloss_zh_editorial_draft")
    p.add_argument("--expected-sense-sha256", default=V34_SENSE_SHA)
    p.add_argument("--output", required=True)
    p.add_argument("--report", required=True)
    a = p.parse_args()
    src = pathlib.Path(a.sense)
    raw = src.read_bytes()
    if digest(raw) != a.expected_sense_sha256:
        raise ValueError("SOURCE_SENSE_SHA256_MISMATCH: no merge performed")
    rows = parse_rows(src)
    if len(rows) != 27471:
        raise ValueError("V34_SENSE_COUNT_MISMATCH")
    index = {}
    for r in rows:
        sid = r.get("teaching_sense_id")
        if not sid or sid in index:
            raise ValueError("MISSING_OR_DUPLICATE_TEACHING_SENSE_ID")
        index[sid] = r
    pending, seen = [], set()
    for number, line in enumerate(pathlib.Path(a.delta).read_text(encoding="utf8").splitlines(), 1):
        if not line.strip():
            continue
        d = json.loads(line)
        sid = d.get("teaching_sense_id")
        gloss = str(d.get("gloss_zh_editorial_draft", "")).strip()
        if not sid or sid not in index or sid in seen or not gloss:
            raise ValueError("INVALID_OR_DUPLICATE_DELTA_LINE:"+str(number))
        seen.add(sid)
        base = index[sid]
        if any(str(base.get(k) or "").strip() for k in (*GLOSS_FIELDS,"gloss_zh_editorial_draft")):
            raise ValueError("WOULD_OVERWRITE_EXISTING_GLOSS:"+str(sid))
        if not str(base.get("definition_en") or base.get("core_definition_en") or base.get("gloss_en") or "").strip():
            raise ValueError("SOURCE_ENGLISH_DEFINITION_MISSING:"+str(sid))
        if d.get("definition_en") and d["definition_en"] != (base.get("definition_en") or base.get("core_definition_en") or base.get("gloss_en")):
            raise ValueError("ENGLISH_DEFINITION_MISMATCH:"+str(sid))
        if d.get("rank") is not None and d["rank"] != base.get("rank", base.get("core20k_rank")):
            raise ValueError("RANK_MISMATCH:"+str(sid))
        pending.append((sid, gloss))
    for sid, gloss in pending:
        index[sid]["gloss_zh_editorial_draft"] = gloss
    output = pathlib.Path(a.output)
    report = pathlib.Path(a.report)
    output.parent.mkdir(parents=True, exist_ok=True)
    report.parent.mkdir(parents=True, exist_ok=True)
    out = (json.dumps(rows,ensure_ascii=False,indent=2)+"\n").encode()
    output.write_bytes(out)
    report.write_text(json.dumps({
        "source_sha256":digest(raw),"source_sense_count":len(rows),
        "added_zh_editorial_drafts":len(pending),"output_sha256":digest(out),
        "stable_sense_ids":True,"production_ready":False,
        "semantic_certification":"PENDING_INDEPENDENT_REVIEW",
        "note":"Only full V34 bytes with expected hash are accepted; JSON array format required."
    },ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V35_EDITORIAL_DELTA_MERGED:",len(pending),"output_sha256:",digest(out))

if __name__ == "__main__":
    try:main()
    except Exception as exc:
        print("V35_MERGE_REFUSED:",str(exc),file=sys.stderr)
        sys.exit(2)
