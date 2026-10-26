#!/usr/bin/env python3
"""Read-only Core20K English gloss census. Never edits the frozen Runtime."""
import argparse
import collections
import gzip
import hashlib
import json
import re
from pathlib import Path

EXPECTED_SHA = "e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"
PLACEHOLDER = re.compile(r"^\s*core modern learner use of\s*[\"“']?.+?[\"”']?\s*$", re.I)
OTHER_TEMPLATE = re.compile(r"^\s*(?:a\s+)?(?:common|general|modern)\s+(?:learner\s+)?(?:use|sense|meaning)\s+of\b", re.I)
TARGETS = {"reservation", "cancellation", "availability", "confirmation", "guest", "hotel", "cancel"}

def headword_rows(node):
    if isinstance(node, list):
        if len(node) >= 5 and isinstance(node[0], int) and isinstance(node[1], str) and isinstance(node[4], list) and all(isinstance(ku, list) for ku in node[4]):
            yield node
            return
        for x in node:
            if isinstance(x, (list, dict)):
                yield from headword_rows(x)
    elif isinstance(node, dict):
        for x in node.values():
            if isinstance(x, (list, dict)):
                yield from headword_rows(x)

def run(runtime, output_dir, allow_unpinned=False):
    b = Path(runtime).read_bytes()
    checksum = hashlib.sha256(b).hexdigest()
    if checksum != EXPECTED_SHA and not allow_unpinned:
        raise ValueError(f"Runtime mismatch: expected {EXPECTED_SHA}, got {checksum}")
    data = json.loads(gzip.decompress(b))
    rows = list(headword_rows(data))
    if len(rows) != 20000 and not allow_unpinned:
        raise ValueError(f"Expected 20000 headword rows, found {len(rows)}")
    issues = []
    all_ku_ids = []
    detailed_targets = {}
    type_counts = collections.Counter()
    for row in rows:
        rank, lemma, pos, ipa, kus = row[:5]
        if lemma in TARGETS:
            detailed_targets[lemma] = row
        for ku in kus:
            if len(ku) < 5:
                raise ValueError(f"Malformed KU for {lemma}: {ku!r}")
            ku_id, kind, zh, en, playable = ku[:5]
            if ku_id in all_ku_ids[-0:]:  # no-op; uniqueness checked below
                pass
            all_ku_ids.append(ku_id)
            reasons = []
            if not isinstance(en, str) or not en.strip():
                reasons.append("MISSING_EN")
            elif PLACEHOLDER.search(en):
                reasons.append("CORE_MODERN_LEARNER_TEMPLATE")
            elif OTHER_TEMPLATE.search(en):
                reasons.append("OTHER_GENERIC_TEMPLATE")
            elif en.strip().lower() in {lemma.lower(), "meaning of " + lemma.lower()}:
                reasons.append("TAUTOLOGY")
            if not isinstance(zh, str) or not zh.strip():
                reasons.append("MISSING_ZH")
            if reasons:
                for reason in reasons:
                    type_counts[reason] += 1
                issues.append({"rank": rank, "lemma": lemma, "ku_id": ku_id, "ku_kind": kind,
                               "gloss_zh": zh, "gloss_en": en, "playable": playable, "reasons": reasons})
    if len(all_ku_ids) != len(set(all_ku_ids)):
        raise ValueError("Duplicate KU IDs")
    if not allow_unpinned and not {"reservation", "cancellation", "availability", "confirmation"}.issubset(detailed_targets):
        raise ValueError("S113 target headwords missing")
    summary = {
        "schema": "pai-core20k-enlex-gloss-census-v1",
        "status": "MECHANICAL_CENSUS_NOT_SEMANTIC_CERTIFICATION",
        "runtime_sha256": checksum,
        "headword_count": len(rows),
        "ku_count": len(all_ku_ids),
        "affected_ku_count": len(issues),
        "counts_by_reason": dict(sorted(type_counts.items())),
        "targets": detailed_targets,
        "top_100_affected_by_rank": sorted(issues, key=lambda r: (r["rank"], r["ku_id"]))[:100],
        "rule": "Regex is high-precision detection of formulaic placeholders, not proof of every sense quality defect."
    }
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    (out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (out / "all-flagged-kus.jsonl").open("w", encoding="utf-8") as f:
        for issue in sorted(issues, key=lambda r: (r["rank"], r["ku_id"])):
            f.write(json.dumps(issue, ensure_ascii=False) + "\n")
    print(json.dumps({k: v for k, v in summary.items() if k not in ("targets", "top_100_affected_by_rank")}, ensure_ascii=False))
    return summary

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--runtime", default="data/core20k-runtime.json.gz")
    ap.add_argument("--out", default="tools/core20k_lexicon/qa/gloss-census-out")
    ap.add_argument("--fixture", action="store_true", help="Allow nonproduction fixtures for testing")
    args = ap.parse_args()
    run(args.runtime, args.out, args.fixture)
