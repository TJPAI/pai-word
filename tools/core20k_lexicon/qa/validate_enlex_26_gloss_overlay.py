#!/usr/bin/env python3
"""Validate ENLEX candidate gloss overlay against frozen Core20K rows.

Strictly read-only. An accepted candidate is not a publication approval.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

EXPECTED_SHA = "e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"

def rows(node):
    if isinstance(node, list):
        if len(node) >= 5 and isinstance(node[0], int) and isinstance(node[1], str) and isinstance(node[4], list) and all(isinstance(v, list) for v in node[4]):
            yield node
        else:
            for v in node:
                if isinstance(v, (list, dict)):
                    yield from rows(v)
    elif isinstance(node, dict):
        for v in node.values():
            if isinstance(v, (dict, list)):
                yield from rows(v)

def validate(source_path, overlay_path):
    source = Path(source_path).read_bytes()
    digest = hashlib.sha256(source).hexdigest()
    if digest != EXPECTED_SHA:
        raise ValueError(f"Unexpected frozen Runtime sha256: {digest}")
    runtime = json.loads(gzip.decompress(source))
    data = list(rows(runtime))
    if len(data) != 20000:
        raise ValueError(f"Expected 20000 headwords, found {len(data)}")
    by_ku = {}
    for rank, lemma, pos, ipa, kus, *rest in data:
        for ku in kus:
            if len(ku) < 5:
                raise ValueError(f"Malformed KU in {lemma}")
            ku_id = ku[0]
            if ku_id in by_ku:
                raise ValueError(f"Duplicate original KU ID {ku_id}")
            by_ku[ku_id] = (rank, lemma, pos, ku)
    overlay = json.loads(Path(overlay_path).read_text(encoding="utf-8"))
    if overlay["source"]["runtime_sha256"] != digest:
        raise ValueError("Overlay pins a different Runtime")
    if overlay.get("guardrails", {}).get("allow_automatic_activation") is not False or overlay["guardrails"]["production_ready"] is not False:
        raise ValueError("Overlay activation or production flag must stay false")
    records = overlay["records"]
    if overlay["candidate_count"] != len(records) or len(records) != 26:
        raise ValueError("Wrong candidate count")
    seen = set()
    for candidate in records:
        ku_id = candidate["ku_id"]
        if ku_id in seen:
            raise ValueError(f"Duplicate overlay KU ID {ku_id}")
        seen.add(ku_id)
        if ku_id not in by_ku:
            raise ValueError(f"Unknown KU ID {ku_id}")
        rank, lemma, pos, ku = by_ku[ku_id]
        if (candidate["rank"], candidate["lemma"]) != (rank, lemma):
            raise ValueError(f"Wrong rank/lemma for {ku_id}")
        if candidate["ku_kind"] != ku[1]:
            raise ValueError(f"KU kind mismatch {ku_id}")
        if (candidate["source_gloss_zh"], candidate["source_gloss_en"]) != (ku[2], ku[3]):
            raise ValueError(f"Precondition: original gloss mismatch for {ku_id}")
        if not candidate["proposed_gloss_en"].strip() or candidate["proposed_gloss_en"].startswith("core modern learner use of"):
            raise ValueError(f"No real proposed English gloss for {ku_id}")
        if candidate["automatic_activation"] is not False:
            raise ValueError(f"Candidate activated without certification {ku_id}")
        if candidate["review"]["muse"] != "PENDING":
            raise ValueError(f"Review status must not be overstated {ku_id}")
    return {"ok": True, "headwords": len(data), "runtime_ku": len(by_ku), "overlay_ku": len(seen), "runtime_sha256": digest, "production_ready": False}

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--runtime", default="data/core20k-runtime.json.gz")
    p.add_argument("--overlay", default="tools/core20k_lexicon/qa/ENLEX_26_KU_GLOSS_CANDIDATE_OVERLAY.v1.json")
    args = p.parse_args()
    print(json.dumps(validate(args.runtime, args.overlay), ensure_ascii=False))
