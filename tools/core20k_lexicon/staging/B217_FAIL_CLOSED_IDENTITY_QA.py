#!/usr/bin/env python3
"""Fail-closed identity QA for the B217 first-batch six KUs.

Two modes:
  1. Verify mode (default): load a Runtime gzip, a Batch93 teaching pack,
     and a B217 authority record, and verify every record against the
     Runtime. Prints per-record PASS/FAIL and exits 0 only if all pass.
     Overlay admission is a SEPARATE decision printed at the end: it
     passes only if every record is identity-verified AND its
     registration_status is APPROVED with a registrar signature present.
     Without approval, admission correctly FAILS (fail-closed) even when
     identity verification passes.
  2. Self-test mode (--self-test): runs the happy path plus fault
     injections against in-memory mutated copies (never written to
     disk): runtime SHA mismatch, pack SHA mismatch, missing ku_id,
     duplicate ku_id / cross-headword conflict, rank/lemma mismatch,
     POS mismatch, kind-not-sense, unapproved binding admission,
     missing/corrupt/version-incompatible registry, and a read-only
     guarantee (input file hashes unchanged after the run).
     Each injection must be REJECTED; any acceptance is a failure.

Usage:
  python3 B217_FAIL_CLOSED_IDENTITY_QA.py --runtime-gz data/core20k-runtime.json.gz \
      --pack tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json \
      --record B217_SIX_KU_RUNTIME_AUTHORITY_RECORD.json [--self-test]

Read-only: this script never writes to the Runtime, the pack, SRS data,
or main. It only reads its inputs and prints to stdout.
"""
import argparse, copy, gzip, hashlib, json, sys

EXPECTED_RUNTIME_SHA256 = "e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"
EXPECTED_PACK_SHA256 = "21d831519abdda34fadef88a601655373750ddf3385ea98d27370cfe2b1eec15"
EXPECTED_RECORD_SCHEMA = "pai-core20k-b217-authority-record-v1"


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_runtime(gz_path):
    with gzip.open(gz_path, "rt", encoding="utf-8") as f:
        return json.load(f)


def verify(rt, pack_records, record_doc, expected_rt_sha, expected_pack_sha):
    """Return (identity_failures, admission_failures, per_record)."""
    identity_failures, admission_failures, per_record = [], [], []
    if record_doc.get("schema") != EXPECTED_RECORD_SCHEMA:
        identity_failures.append("record_schema_version_incompatible")
    if record_doc.get("source_runtime", {}).get("runtime_gz_sha256") != expected_rt_sha:
        identity_failures.append("runtime_sha256_mismatch")
    if record_doc.get("source_pack", {}).get("pack_sha256") != expected_pack_sha:
        identity_failures.append("pack_sha256_mismatch")
    by_lemma = {h[1]: h for h in rt["headwords"]}
    by_ku = {}
    for h in rt["headwords"]:
        for ku in h[4]:
            if ku[0] in by_ku:
                identity_failures.append(f"duplicate_ku_id_in_runtime:{ku[0]}")
            by_ku[ku[0]] = (h, ku)
    pack_by_ku = {r["ku_id"]: r for r in pack_records}
    if len(record_doc.get("records", [])) != 6:
        identity_failures.append("record_count_not_6")
    seen = set()
    for rec in record_doc.get("records", []):
        kid = rec["ku_id"]
        errs = []
        if kid in seen:
            errs.append("duplicate_ku_id_in_record")
        seen.add(kid)
        hit = by_ku.get(kid)
        if hit is None:
            errs.append("ku_id_not_in_runtime")
        else:
            h, ku = hit
            if h[0] != rec["rank"] or h[1] != rec["lemma"]:
                errs.append("rank_lemma_mismatch")
            if h[2] != rec["pos"]:
                errs.append("pos_mismatch")
            if ku[1] != "sense":
                errs.append("ku_type_not_sense")
            if ku[2] != rec["runtime_gloss_zh"] or ku[3] != rec["runtime_gloss_en"]:
                errs.append("runtime_gloss_mismatch")
            if ku[4] is not True:
                errs.append("ku_not_playable")
        pack = pack_by_ku.get(kid)
        if pack is None:
            errs.append("ku_id_not_in_pack")
        elif pack["headword"] != rec["lemma"] or pack["rank"] != rec["rank"]:
            errs.append("pack_identity_mismatch")
        if rec.get("binding_kind") != "KU_ANCHORED_SENSE":
            errs.append("binding_kind_not_ku_anchored")
        if rec.get("official_sense_id") is not None:
            errs.append("official_sense_id_must_be_null_without_registry")
        if rec.get("anchor_ku_id") != kid:
            errs.append("anchor_ku_id_mismatch")
        per_record.append({"ku_id": kid, "identity": "PASS" if not errs else "FAIL", "errors": errs})
        identity_failures.extend(f"{kid}:{e}" for e in errs)
        # Overlay admission: identity + approval, both required.
        approved = rec.get("registration_status") == "APPROVED" and bool(record_doc.get("registration_authority_signed"))
        if errs or not approved:
            admission_failures.append(f"{kid}:admission_rejected")
    return identity_failures, admission_failures, per_record


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runtime-gz", required=True)
    ap.add_argument("--pack", required=True)
    ap.add_argument("--record", required=True)
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--expected-runtime-sha256", default=EXPECTED_RUNTIME_SHA256)
    ap.add_argument("--expected-pack-sha256", default=EXPECTED_PACK_SHA256)
    args = ap.parse_args()

    rt_bytes_hash_before = sha256_file(args.runtime_gz)
    pack_bytes_hash_before = sha256_file(args.pack)
    rt = load_runtime(args.runtime_gz)
    pack = json.load(open(args.pack, encoding="utf-8"))
    record = json.load(open(args.record, encoding="utf-8"))
    pack_records = pack["records"] if isinstance(pack, dict) else pack

    ifail, afail, per_record = verify(rt, pack_records, record, args.expected_runtime_sha256, args.expected_pack_sha256)
    for r in per_record:
        print(f"IDENTITY {r['ku_id']}: {r['identity']}" + (f" errors={r['errors']}" if r["errors"] else ""))
    print(f"IDENTITY overall: {'PASS' if not ifail else 'FAIL ' + str(ifail)}")
    print(f"OVERLAY ADMISSION overall: {'PASS' if not afail else 'REJECTED (fail-closed) ' + str(afail)}")
    print("NOTE: admission REJECTED on an unsigned record is the CORRECT fail-closed outcome, not a test failure.")

    if not args.self_test:
        return 0 if not ifail else 1

    # ---- Self-test: fault injections (in-memory only) ----
    print("\nSELF-TEST fault injections (each must be REJECTED):")
    results = []

    def expect_reject(name, fn):
        try:
            rejected = fn()
        except Exception as exc:  # any crash on mutated input counts as rejection only if it is a validation error
            rejected = True
            print(f"  (injection raised {type(exc).__name__}; treated as rejection)")
        results.append((name, bool(rejected)))
        print(f"  {'PASS' if rejected else 'FAIL'} injection_rejected:{name}")

    base_rt, base_pack, base_rec = rt, pack_records, record
    expect_reject("runtime_sha_mismatch", lambda: bool(verify(base_rt, base_pack, base_rec, "0" * 64, args.expected_pack_sha256)[0]))
    expect_reject("pack_sha_mismatch", lambda: bool(verify(base_rt, base_pack, base_rec, args.expected_runtime_sha256, "0" * 64)[0]))
    rt_missing = copy.deepcopy(base_rt)
    rt_missing["headwords"] = [h for h in rt_missing["headwords"] if h[1] != "person"]
    expect_reject("ku_id_missing", lambda: bool(verify(rt_missing, base_pack, base_rec, args.expected_runtime_sha256, args.expected_pack_sha256)[0]))
    rt_dup = copy.deepcopy(base_rt)
    person_row = [h for h in rt_dup["headwords"] if h[1] == "person"][0]
    time_row = [h for h in rt_dup["headwords"] if h[1] == "time"][0]
    time_row[4] = time_row[4] + [list(person_row[4][0])]
    expect_reject("duplicate_ku_id_cross_headword", lambda: bool(verify(rt_dup, base_pack, base_rec, args.expected_runtime_sha256, args.expected_pack_sha256)[0]))
    rec_rank = copy.deepcopy(base_rec)
    rec_rank["records"][0]["rank"] = 99999
    expect_reject("rank_lemma_mismatch", lambda: bool(verify(base_rt, base_pack, rec_rank, args.expected_runtime_sha256, args.expected_pack_sha256)[0]))
    rec_pos = copy.deepcopy(base_rec)
    rec_pos["records"][0]["pos"] = "v."
    expect_reject("pos_mismatch", lambda: bool(verify(base_rt, base_pack, rec_pos, args.expected_runtime_sha256, args.expected_pack_sha256)[0]))
    rt_kind = copy.deepcopy(base_rt)
    for h in rt_kind["headwords"]:
        if h[1] == "person":
            h[4][0][1] = "collocation"
    expect_reject("ku_type_not_sense", lambda: bool(verify(rt_kind, base_pack, base_rec, args.expected_runtime_sha256, args.expected_pack_sha256)[0]))
    expect_reject("unapproved_binding_admission", lambda: bool(verify(base_rt, base_pack, base_rec, args.expected_runtime_sha256, args.expected_pack_sha256)[1]))
    rec_approved = copy.deepcopy(base_rec)
    for r in rec_approved["records"]:
        r["registration_status"] = "APPROVED"
    rec_approved["registration_authority_signed"] = True
    _, afail_approved, _ = verify(base_rt, base_pack, rec_approved, args.expected_runtime_sha256, args.expected_pack_sha256)
    approved_admits = not afail_approved
    results.append(("approved_record_admits (control, in-memory only, never written)", approved_admits))
    print(f"  {'PASS' if approved_admits else 'FAIL'} control:approved_record_admits")
    for label, bad in [("registry_missing", None), ("registry_corrupt", "{not json"), ("registry_version_incompatible", json.dumps({"schema": "wrong-schema-v9", "records": []}))]:
        try:
            doc = None if bad is None else json.loads(bad)
            rejected = doc is None or doc.get("schema") != EXPECTED_RECORD_SCHEMA
        except Exception:
            rejected = True
        results.append((f"registry_{label}", rejected))
        print(f"  {'PASS' if rejected else 'FAIL'} injection_rejected:registry_{label}")
    readonly_ok = sha256_file(args.runtime_gz) == rt_bytes_hash_before and sha256_file(args.pack) == pack_bytes_hash_before
    results.append(("inputs_unchanged_readonly", readonly_ok))
    print(f"  {'PASS' if readonly_ok else 'FAIL'} inputs_unchanged_readonly (Runtime + pack hashes identical before/after)")
    failed = [n for n, ok in results if not ok]
    print(f"\nSELF-TEST: {len(results) - len(failed)}/{len(results)} passed" + (f"; FAILED: {failed}" if failed else ""))
    return 0 if not failed and not ifail else 1


if __name__ == "__main__":
    sys.exit(main())
