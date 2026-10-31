#!/usr/bin/env python3
"""Offline audit: real coverage, duplicate KU IDs, and important teaching gaps.
Run: python tools/core20k_lexicon/production_v3/audit_coverage_priority.py
Read-only. Does not release or delete any KU.
"""
import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
def records(path):
    with path.open(encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            if line.strip():
                try:
                    yield json.loads(line)
                except json.JSONDecodeError as ex:
                    raise ValueError(f"{path}:{i}: {ex}") from ex

sense_files = sorted(ROOT.glob("v4_ai_gloss_batch_*.jsonl"))
ku_files = sorted((ROOT / "ku_drafts").rglob("*.jsonl"))
senses = {}
for path in sense_files:
    for item in records(path):
        sid = item.get("teaching_sense_id")
        if sid:
            senses.setdefault(sid, item)
by_sense = collections.defaultdict(list)
by_ku = collections.defaultdict(list)
by_objective = collections.defaultdict(list)

def canonical_type(value):
    k = str(value or "unknown").strip().lower()
    aliases = {
        "sense_recognition": "recognition",
        "recognition": "recognition",
        "context_cloze": "context",
        "context_disambiguation": "context",
        "collocation": "collocation",
        "grammar": "grammar",
        "usage": "usage",
        "production": "production",
    }
    return aliases.get(k, k)

kind_counts = collections.Counter()
for path in ku_files:
    for item in records(path):
        sid = item.get("teaching_sense_id")
        kid = item.get("ku_id")
        if sid and kid:
            kind = canonical_type(item.get("ku_type") or item.get("render_kind"))
            by_sense[sid].append((kind, str(path.relative_to(ROOT)), kid))
            by_ku[kid].append(str(path.relative_to(ROOT)))
            objective = item.get("teaching_objective")
            if kind == "recognition":
                objective = "recognize_sense_meaning"
            elif not objective:
                objective = "unspecified:" + str(kid)
            by_objective[(sid, kind, str(objective))].append((kid, str(path.relative_to(ROOT))))
            kind_counts[kind] += 1
duplicates = {k: v for k, v in by_ku.items() if len(v) > 1}
objective_duplicates = {k: v for k, v in by_objective.items() if len(v) > 1}
missing = []
priority = []
for sid, item in senses.items():
    types = {x[0] for x in by_sense.get(sid, [])}
    rank = item.get("rank")
    if not types or not ({"recognition"} & types):
        missing.append({"sense_id": sid, "rank": rank, "lemma": item.get("lemma"), "pos": item.get("pos"), "current_types": sorted(types)})
    if isinstance(rank, int) and rank <= 5000 and types and not ({"context", "collocation", "grammar", "usage", "production"} & types):
        priority.append({"sense_id": sid, "rank": rank, "lemma": item.get("lemma"), "current_types": sorted(types), "gap": "review_extra_teaching_ku"})
missing.sort(key=lambda x: (x["rank"] if isinstance(x["rank"], int) else 999999, x["sense_id"]))
priority.sort(key=lambda x: (x["rank"], x["sense_id"]))
report = {
    "scope_warning": "V4 Sense batch files and JSONL under ku_drafts only; not a full V93 27471-Sense audit. Existing KU type names may require normalization.",
    "sense_files": len(sense_files),
    "ku_files": len(ku_files),
    "v4_unique_senses": len(senses),
    "ku_records": sum(kind_counts.values()),
    "ku_unique_ids": len(by_ku),
    "ku_unique_senses": len(by_sense),
    "duplicate_ku_ids": len(duplicates),
    "duplicate_teaching_objectives": len(objective_duplicates),
    "duplicate_recognition_examples": [
        {"sense_id": key[0], "ku_type": key[1], "teaching_objective": key[2],
         "occurrences": entries}
        for key, entries in list(objective_duplicates.items())[:100]
        if key[1] == "recognition"
    ],
    "duplicate_ku_examples": [{"ku_id": k, "files": v} for k, v in list(duplicates.items())[:100]],
    "kind_counts": dict(kind_counts),
    "v4_missing_recognition_count": len(missing),
    "v4_missing_recognition": missing,
    "high_frequency_extra_ku_review_count": len(priority),
    "high_frequency_extra_ku_review": priority,
}
target = ROOT / "coverage_audit_v4.json"
target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Audit saved to {target}; {len(senses)} V4 senses, {len(duplicates)} duplicate KU IDs, {len(missing)} missing recognition, {len(priority)} candidates for extra teaching KU")
