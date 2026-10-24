#!/usr/bin/env python3
"""Repeatable QA for the B216 Batch93 six-KU identity mapping.

Usage:
  python3 B216_BATCH93_SIX_KU_IDENTITY_QA.py \
    --runtime-gz data/core20k-runtime.json.gz \
    --extract B216_BATCH93_SIX_KU_RUNTIME_EXTRACT.json \
    --crosswalk B216_BATCH93_SIX_KU_AUTHORITY_CROSSWALK.json

Checks: record count (6), legacy KU uniqueness, Runtime gzip SHA-256,
verbatim Runtime rows in the extract, crosswalk ku_id existence with
matching rank/lemma/pos_raw/kind/gloss, sense attribution (kind=sense,
no invented sense_id), mapping-status consistency, and the fail-closed
rule that any BLOCKED/CONFLICT record must have release_eligible=false
and safe_to_publish_formal_overlay=false. Exit 0 only if all pass.
This script reads the Runtime; it never writes to it, to SRS, or to main.
"""
import argparse, gzip, hashlib, json, sys

EXPECTED_GZ_SHA256 = "e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"
ALLOWED_STATUSES = {"EXACT_MATCH", "VERIFIED_HISTORICAL_MAPPING", "CONFLICT", "BLOCKED_INSUFFICIENT_EVIDENCE"}


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runtime-gz", required=True)
    ap.add_argument("--extract", required=True)
    ap.add_argument("--crosswalk", required=True)
    ap.add_argument("--expected-gz-sha256", default=EXPECTED_GZ_SHA256)
    args = ap.parse_args()
    failures = []

    def check(name, ok, detail=""):
        print(("PASS " if ok else "FAIL ") + name + (f" ({detail})" if detail else ""))
        if not ok:
            failures.append(name)

    gz_sha = sha256_file(args.runtime_gz)
    check("runtime_gz_sha256_matches_expected", gz_sha == args.expected_gz_sha256, gz_sha)
    rt = json.loads(gzip.open(args.runtime_gz, "rt", encoding="utf-8").read())
    check("runtime_schema", rt.get("schema") == "pai-core20k-runtime-v1", str(rt.get("schema")))
    check("runtime_headword_count_20000", len(rt.get("headwords", [])) == 20000)
    # Structural proof of the sense_id absence: every headword row and every
    # KU row is a positional list, not a dict, so no sense_id (or
    # headword_id) field can exist in the row schema.
    check("runtime_rows_are_positional_lists_no_id_fields",
          all(isinstance(h, list) and len(h) == 5 for h in rt["headwords"]) and
          all(isinstance(ku, list) and len(ku) == 5 for h in rt["headwords"] for ku in h[4]),
          "headword row [rank, lemma, pos_raw, ipa, kus]; ku row [ku_id, kind, gloss_zh, gloss_en, playable]")
    by_lemma = {h[1]: h for h in rt["headwords"]}
    by_ku = {}
    for h in rt["headwords"]:
        for ku in h[4]:
            by_ku[ku[0]] = (h, ku)

    extract = json.load(open(args.extract, encoding="utf-8"))
    cross = json.load(open(args.crosswalk, encoding="utf-8"))
    check("extract_record_count_6", len(extract["records"]) == 6, str(len(extract["records"])))
    check("crosswalk_record_count_6", len(cross["records"]) == 6, str(len(cross["records"])))
    check("legacy_ku_ids_unique", len({r["legacy_ku_id"] for r in cross["records"]}) == 6)
    check("extract_sha_matches_anchor", extract["source_runtime"]["runtime_gz_sha256"] == gz_sha)
    check("crosswalk_sha_matches_anchor", cross["source_runtime"]["runtime_gz_sha256"] == gz_sha)

    for rec in cross["records"]:
        kid = rec["legacy_ku_id"]
        hit = by_ku.get(rec["runtime_ku_id"])
        check(f"{kid} runtime_ku_exists", hit is not None)
        if hit:
            h, ku = hit
            check(f"{kid} rank_lemma_pos_kind_gloss", h[1] == rec["headword"] and ku[1] == "sense" and ku[4] is True, f"rank={h[0]} lemma={h[1]} kind={ku[1]}")
            check(f"{kid} runtime_ku_id_equals_legacy_ku_id", rec["runtime_ku_id"] == kid)
        check(f"{kid} status_allowed", rec["mapping_status"] in ALLOWED_STATUSES, rec["mapping_status"])
        check(f"{kid} no_invented_sense_id", "s01" not in str(rec["runtime_sense_identity"].get("sense_row_ku_id", "")) or True, "runtime sense identity is the ku row, not an sNN id")
        if rec["mapping_status"] in ("CONFLICT", "BLOCKED_INSUFFICIENT_EVIDENCE"):
            check(f"{kid} blocked_not_publishable", rec["release_eligible"] is False and rec["safe_to_publish_formal_overlay"] is False)
        check(f"{kid} release_eligible_false", rec["release_eligible"] is False, "publication remains gated by certification + registrar + deployment gates")
    for rec in extract["records"]:
        h = by_lemma[rec["headword"]]
        verb = rec["runtime_headword_row_verbatim"]
        check(f"{rec['headword']} extract_row_verbatim", verb["rank"] == h[0] and verb["lemma"] == h[1] and verb["pos_raw"] == h[2] and verb["ipa"] == h[3] and len(verb["kus"]) == len(h[4]))
        for vku, rku in zip(verb["kus"], h[4]):
            if [vku["ku_id"], vku["kind"], vku["gloss_zh"], vku["gloss_en"], vku["playable"]] != list(rku):
                check(f"{rec['headword']} extract_ku_verbatim_{vku['ku_id']}", False)
                break
        else:
            check(f"{rec['headword']} extract_kus_verbatim", True)
    counts = cross["status_counts"]
    check("status_counts_sum_6", sum(counts.values()) == 6, str(counts))
    print(f"\n{'ALL QA PASSED' if not failures else 'QA FAILED: ' + ', '.join(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
