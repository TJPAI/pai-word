#!/usr/bin/env python3
"""Read-only validation of a 23-KU dual-AI gloss preactivation package."""
import gzip
import hashlib
import json
from pathlib import Path

RUNTIME_SHA = "e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"
PATH = Path("tools/core20k_lexicon/qa/ENLEX_23_DUAL_AI_PASS_GLOSS_PREACTIVATION.v1.json")
RUNTIME = Path("data/core20k-runtime.json.gz")

def walk(node):
    if isinstance(node, list):
        if len(node) >= 5 and isinstance(node[0], int) and isinstance(node[1], str) and isinstance(node[4], list):
            yield node
        else:
            for value in node:
                if isinstance(value, (list, dict)):
                    yield from walk(value)
    elif isinstance(node, dict):
        for value in node.values():
            if isinstance(value, (list, dict)):
                yield from walk(value)

def check():
    raw = RUNTIME.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    assert digest == RUNTIME_SHA, "wrong frozen Runtime SHA"
    base = json.loads(gzip.decompress(raw))
    records = list(walk(base))
    assert len(records) == 20000, "headword count mismatch"
    rows = {}
    for rank, lemma, pos, ipa, kus, *extra in records:
        for ku in kus:
            assert ku[0] not in rows, "duplicate Runtime ku_id"
            rows[ku[0]] = (rank, lemma, ku)
    assert len(rows) == 16617, "KU count mismatch"
    batch = json.loads(PATH.read_text(encoding="utf-8"))
    assert batch["frozen_runtime_sha256"] == digest
    assert batch["record_count"] == len(batch["records"]) == 23
    assert batch["release_gates"]["activation_allowed"] is False
    assert batch["release_gates"]["production_ready"] is False
    seen = set()
    for entry in batch["records"]:
        ident = entry["ku_id"]
        assert ident not in seen and ident in rows, "unknown/duplicate KU ID"
        seen.add(ident)
        rank, lemma, ku = rows[ident]
        assert (rank, lemma) == (entry["rank"], entry["lemma"])
        assert (ku[1], ku[2], ku[3]) == (entry["ku_kind"], entry["old_gloss_zh"], entry["old_gloss_en"])
        assert entry["semantic_verdict"] == "DUAL_AI_PASS_CONTENT_ONLY"
        assert entry["new_gloss_en"] and "core modern learner use" not in entry["new_gloss_en"].lower()
    print(json.dumps({"ok": True, "headwords": len(records), "runtime_ku": len(rows), "dual_ai_candidates": len(seen), "runtime_sha256": digest, "activated": False}))

if __name__ == "__main__":
    check()
