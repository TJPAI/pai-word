#!/usr/bin/env python3
"""Fail-closed quality gate for 1,000/2,000 Core20K candidate batches.
Reads the authoritative frozen CSV and candidate JSONL. Never releases content.
"""
import argparse, csv, hashlib, json, pathlib, re, sys
BASELINE_SHA = "e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca"

def check(args):
    if args.size not in (1000, 2000):
        raise ValueError("batch size must be 1000 or 2000")
    if args.start < 1 or (args.start - 1) % args.size or args.start + args.size - 1 > 20000:
        raise ValueError("start must align to a complete Core20K 1000/2000 batch")
    raw = pathlib.Path(args.frozen).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != args.expected_sha256:
        raise ValueError("FROZEN_SHA_MISMATCH")
    rows = list(csv.DictReader(raw.decode("utf-8-sig").splitlines()))
    if len(rows) != 20000: raise ValueError("FROZEN_COUNT_MISMATCH")
    mapping = {}
    for row in rows:
        rank = int(row["core20k_rank_final"])
        lemma = row["lemma"].strip()
        if not lemma or rank in mapping: raise ValueError("FROZEN_RANK_DUPLICATE")
        mapping[rank] = lemma
    if set(mapping) != set(range(1, 20001)): raise ValueError("FROZEN_RANK_GAP")
    start, end = args.start, args.start + args.size - 1
    seen, accepted, rejected = set(), [], []
    path = pathlib.Path(args.drafts)
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip(): continue
        reason = []
        try:
            item = json.loads(line)
            rank = item.get("core20k_rank", item.get("rank"))
            if type(rank) is not int or not start <= rank <= end:
                reason.append("rank_outside_batch_or_missing")
            elif str(item.get("lemma", "")).strip() != mapping[rank]:
                reason.append("rank_lemma_mismatch")
            pos = str(item.get("part_of_speech", item.get("pos", ""))).strip()
            key = str(item.get("sense_key", "")).strip()
            zh = str(item.get("core_definition_zh", item.get("gloss_zh", ""))).strip()
            en = str(item.get("core_definition_en", item.get("gloss_en", ""))).strip()
            if not pos or not key or not zh or not en: reason.append("missing_sense_fields")
            if key and rank and pos:
                identity = (rank, pos.casefold(), key.casefold())
                if identity in seen: reason.append("duplicate_sense_candidate")
                seen.add(identity)
            if item.get("production_ready") or item.get("dictionary_verified") or item.get("release_eligible"):
                reason.append("premature_release_claim")
            for field in ("sense_examples", "sense_collocations"):
                for sub in item.get(field, []):
                    if not isinstance(sub, dict) or sub.get("sense_key") != key:
                        reason.append("sense_binding_missing_or_mismatch")
                        break
            if not item.get("model_id") or not item.get("generation_prompt_version"):
                reason.append("generation_provenance_missing")
            if not item.get("evidence"): reason.append("independent_evidence_pending")
            if reason: rejected.append({"line": line_number, "reasons": sorted(set(reason))})
            else: accepted.append(item)
        except Exception as exc:
            rejected.append({"line": line_number, "reasons": ["invalid_candidate_or_json"], "detail": str(exc)[:120]})
    represented = {x.get("core20k_rank", x.get("rank")) for x in accepted}
    report = {
        "batch_start": start, "batch_end": end, "batch_size": args.size,
        "baseline_sha256": digest, "raw_candidates": len(accepted) + len(rejected),
        "qa_pass_candidates": len(accepted), "rejected_candidates": len(rejected),
        "qa_pass_headwords": len(represented),
        "uncovered_headwords": [r for r in range(start, end + 1) if r not in represented],
        "rejections": rejected,
        "quality_scope": "structural_candidate_gate_only",
        "semantic_independent_review": "NOT_PERFORMED",
        "production_ready": False
    }
    output = pathlib.Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k not in ("rejections", "uncovered_headwords")}, ensure_ascii=False))
    return 0 if not rejected and len(represented) == args.size else 2

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--frozen", required=True)
    p.add_argument("--drafts", required=True)
    p.add_argument("--start", type=int, required=True)
    p.add_argument("--size", type=int, required=True, choices=[1000, 2000])
    p.add_argument("--expected-sha256", default=BASELINE_SHA)
    p.add_argument("--out", required=True)
    a = p.parse_args()
    try: sys.exit(check(a))
    except (ValueError, OSError, KeyError) as e:
        print("BULK_QA_FAIL:", str(e), file=sys.stderr)
        sys.exit(2)
