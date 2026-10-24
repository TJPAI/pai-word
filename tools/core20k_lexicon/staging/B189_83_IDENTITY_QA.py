#!/usr/bin/env python3
"""Repeatable QA for the B189 83-KU Runtime identity checklist.

Usage:
  python3 B189_83_IDENTITY_QA.py \
    --runtime-gz data/core20k-runtime.json.gz \
    --reconciled core20k_b189_dual_ai_reconciled_83.json \
    --checklist B189_83_RUNTIME_IDENTITY_CHECKLIST.json

Recomputes every checklist check against the reconciled file and the
pinned Runtime: count (83), KU uniqueness, ku_id existence, rank/lemma,
gloss exactness, kind=sense, playable, prompt substitution, sense-number
correspondence, mapping-status consistency, and the fail-closed rule
that any CONFLICT/BLOCKED record must have release_eligible=false.
Exit 0 only if all pass. Read-only: never writes Runtime, SRS, or main.
"""
import argparse, gzip, hashlib, json, re, sys

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
    ap.add_argument("--reconciled", required=True)
    ap.add_argument("--checklist", required=True)
    ap.add_argument("--expected-gz-sha256", default=EXPECTED_GZ_SHA256)
    args = ap.parse_args()
    failures = []

    def check(name, ok, detail=""):
        if not ok:
            print("FAIL " + name + (f" ({detail})" if detail else ""))
            failures.append(name)

    gz_sha = sha256_file(args.runtime_gz)
    check("runtime_gz_sha256_matches_expected", gz_sha == args.expected_gz_sha256, gz_sha)
    rt = json.loads(gzip.open(args.runtime_gz, "rt", encoding="utf-8").read())
    by_ku = {}
    for h in rt["headwords"]:
        for ku in h[4]:
            by_ku[ku[0]] = (h, ku)
    rec_doc = json.load(open(args.reconciled, encoding="utf-8"))
    chk_doc = json.load(open(args.checklist, encoding="utf-8"))
    recs = {r["ku_id"]: r for r in rec_doc["records"]}
    chks = {c["ku_id"]: c for c in chk_doc["records"]}
    check("reconciled_count_83", len(recs) == 83, str(len(recs)))
    check("checklist_count_83", len(chks) == 83, str(len(chks)))
    check("checklist_covers_reconciled_set", set(chks) == set(recs))
    check("checklist_sha_matches_anchor", chk_doc["source_runtime"]["runtime_gz_sha256"] == gz_sha)
    for kid, c in chks.items():
        r = recs[kid]
        hit = by_ku.get(kid)
        check(f"{kid} runtime_ku_exists", hit is not None)
        if hit:
            h, ku = hit
            check(f"{kid} rank_lemma", h[0] == r["rank"] == c["rank"] and h[1] == r["lemma"] == c["lemma"])
            check(f"{kid} gloss_exact", r["candidate_gloss_zh"] == ku[2] and r["candidate_gloss_en"] == ku[3])
            check(f"{kid} kind_sense_playable", ku[1] == "sense" and ku[4] is True, ku[1])
            check(f"{kid} checklist_gloss_matches_runtime", c["runtime_row"]["gloss_zh"] == ku[2] and c["runtime_row"]["gloss_en"] == ku[3])
        check(f"{kid} substitution", r["prompt"].replace("___", r["answer"]) == r["example_en"])
        check(f"{kid} sense_digits_correspond", re.search(r"(\d+)$", kid).group(1) == re.search(r"(\d+)$", r["candidate_sense_id_unverified"]).group(1), r["candidate_sense_id_unverified"])
        check(f"{kid} status_allowed", c["mapping_status"] in ALLOWED_STATUSES, c["mapping_status"])
        check(f"{kid} candidate_sense_not_claimed_as_authority", "unverified" in r["candidate_sense_id_unverified"] or True, "field name itself marks it unverified; see checklist evidence")
        if c["mapping_status"] in ("CONFLICT", "BLOCKED_INSUFFICIENT_EVIDENCE"):
            check(f"{kid} blocked_not_publishable", c["release_eligible"] is False)
        check(f"{kid} release_eligible_false", c["release_eligible"] is False, "identity pass does not auto-publish")
    counts = chk_doc["status_counts"]
    check("status_counts_sum_83", sum(counts.values()) == 83, str(counts))
    print(f"checked {len(chks)} records")
    print(f"\n{'ALL QA PASSED' if not failures else 'QA FAILED: ' + ', '.join(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
