#!/usr/bin/env python3
"""Fail-closed dry-run builder for 23 certified gloss overrides. Never mutates Runtime."""
import gzip
import hashlib
import json
from pathlib import Path

EXPECTED_SHA = "e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"
RUNTIME = Path("data/core20k-runtime.json.gz")
PACKAGE = Path("tools/core20k_lexicon/qa/ENLEX_23_DUAL_AI_PASS_GLOSS_PREACTIVATION.v1.json")

def walk(node):
    if isinstance(node, list):
        if len(node) >= 5 and isinstance(node[0], int) and isinstance(node[1], str) and isinstance(node[4], list):
            yield node
        else:
            for child in node:
                if isinstance(child, (list, dict)):
                    yield from walk(child)
    elif isinstance(node, dict):
        for child in node.values():
            if isinstance(child, (list, dict)):
                yield from walk(child)

def prepare():
    raw = RUNTIME.read_bytes()
    actual_sha = hashlib.sha256(raw).hexdigest()
    if actual_sha != EXPECTED_SHA:
        raise ValueError("Runtime digest changed: fail closed")
    batch = json.loads(PACKAGE.read_text(encoding="utf-8"))
    if batch["frozen_runtime_sha256"] != actual_sha or batch["record_count"] != 23 or len(batch["records"]) != 23:
        raise ValueError("Package version or count mismatch")
    if batch["release_gates"]["activation_allowed"] is not False or batch["release_gates"]["production_ready"] is not False:
        raise ValueError("Preactivation gate must remain closed")
    base = json.loads(gzip.decompress(raw))
    headwords = list(walk(base))
    if len(headwords) != 20000:
        raise ValueError("Headword count mismatch")
    lookup = {}
    for hw in headwords:
        rank, lemma, pos, ipa, kus, *rest = hw
        for ku in kus:
            if ku[0] in lookup:
                raise ValueError("Duplicate KU identity")
            lookup[ku[0]] = (rank, lemma, ku)
    if len(lookup) != 16617:
        raise ValueError("Runtime KU count mismatch")
    patches = []
    ids = set()
    for item in batch["records"]:
        ident = item["ku_id"]
        if ident in ids or ident not in lookup:
            raise ValueError("Duplicate or unknown target ID: " + ident)
        ids.add(ident)
        rank, lemma, ku = lookup[ident]
        if (rank, lemma, ku[1], ku[2], ku[3]) != (item["rank"], item["lemma"], item["ku_kind"], item["old_gloss_zh"], item["old_gloss_en"]):
            raise ValueError("Stale original gloss or target identity: " + ident)
        if item["semantic_verdict"] != "DUAL_AI_PASS_CONTENT_ONLY":
            raise ValueError("Missing exact-content dual AI approval: " + ident)
        new_en = item["new_gloss_en"]
        new_zh = item["new_gloss_zh"]
        if not isinstance(new_en, str) or not new_en.strip() or "core modern learner use" in new_en.lower() or not isinstance(new_zh, str) or not new_zh.strip():
            raise ValueError("Invalid replacement: " + ident)
        patches.append({"ku_id": ident, "rank": rank, "lemma": lemma, "expected_old_gloss_zh": ku[2], "expected_old_gloss_en": ku[3], "replacement_gloss_zh": new_zh, "replacement_gloss_en": new_en})
    patches.sort(key=lambda x: (x["rank"], x["ku_id"]))
    return {"schema": "pai-enlex-23-exact-ku-overlay-dry-run-v1", "runtime_sha256": actual_sha, "activation_allowed": False, "production_ready": False, "target_count": len(patches), "changes": patches}

if __name__ == "__main__":
    result = prepare()
    print(json.dumps({"ok": True, "runtime_sha256": result["runtime_sha256"], "exact_targets": result["target_count"], "activation_allowed": False, "production_ready": False}, ensure_ascii=False))
