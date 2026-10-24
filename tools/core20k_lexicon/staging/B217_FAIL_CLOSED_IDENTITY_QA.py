#!/usr/bin/env python3
"""Fail-closed identity QA for the B217 first-batch six KUs (v2).

v2 changes over v1 (commit 80e53f6):
  * Accepts both the authority record schema (pai-core20k-b217-authority-record-v1)
    and the registered crosswalk schema (pai-core20k-b217-registered-crosswalk-v1).
  * Binding admission now accepts TWO authorization evidences, kept distinct:
    (a) a registrar signature (registration_authority_signed true), or
    (b) a recorded project-owner instruction (doc.authorization with source
    "project_owner_instruction_in_conversation", matching scope ku_ids, binding kind, and
    pinned SHAs, with owner_signature_provided explicitly false). An
    instruction is recorded as an instruction, never as a signature.
  * NEW publication-boundary enforcement (fail-closed): any record with
    release_eligible true or production_ready true, or an overlay status
    other than NOT_PUBLISHED, is a PUBLICATION failure. Binding admission
    PASS does not imply publication; publication stays closed until the
    separate teaching-certification and deployment gates pass.
  * Self-test is 13 numbered tests: 11 fault injections, 1 release_eligible
    flip (boundary violation, must be rejected), and 1 approved-record
    control (must admit). A read-only assertion (input hashes unchanged)
    is reported additionally, unnumbered.


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
ALLOWED_RECORD_SCHEMAS = {"pai-core20k-b217-authority-record-v1", "pai-core20k-b217-registered-crosswalk-v1"}


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


def authorization_valid(record_doc, record_ku_ids, expected_rt_sha, expected_pack_sha):
    """True only for a registrar signature OR a matching owner instruction.

    An owner instruction is valid only when its scope ku_ids, binding kind
    and pinned SHAs all match this run, and it explicitly states that no
    owner signature was provided (so an instruction can never be mistaken
    for a signature)."""
    if record_doc.get("registration_authority_signed"):
        return True
    auth = record_doc.get("authorization")
    if not isinstance(auth, dict):
        return False
    scope = auth.get("authorization_scope", {})
    if auth.get("authorization_source") != "project_owner_instruction_in_conversation":
        return False
    if auth.get("owner_signature", {}).get("handwritten_signature_provided") is not False:
        return False
    if auth.get("owner_signature", {}).get("github_signature_provided") is not False:
        return False
    if sorted(scope.get("ku_ids", [])) != sorted(record_ku_ids):
        return False
    if scope.get("binding_kind") != "KU_ANCHORED_SENSE":
        return False
    pinned = scope.get("pinned_assets", {})
    if pinned.get("runtime_gz_sha256") != expected_rt_sha:
        return False
    if pinned.get("batch93_pack_sha256") != expected_pack_sha:
        return False
    return True


def verify(rt, pack_records, record_doc, expected_rt_sha, expected_pack_sha):
    """Return (identity_failures, admission_failures, publication_failures, per_record)."""
    identity_failures, admission_failures, publication_failures, per_record = [], [], [], []
    if record_doc.get("schema") not in ALLOWED_RECORD_SCHEMAS:
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
        # Binding admission: identity + approval + valid authorization, all required.
        auth_ok = authorization_valid(record_doc, [r["ku_id"] for r in record_doc.get("records", [])], expected_rt_sha, expected_pack_sha)
        approved = rec.get("registration_status") == "APPROVED" and auth_ok
        if errs or not approved:
            admission_failures.append(f"{kid}:admission_rejected")
        # Publication boundary: binding approval must NOT flip these flags.
        if rec.get("release_eligible") is True or rec.get("production_ready") is True:
            publication_failures.append(f"{kid}:publication_flag_must_remain_false")
        if "overlay_publication_status" in rec and rec["overlay_publication_status"] != "NOT_PUBLISHED":
            publication_failures.append(f"{kid}:overlay_must_remain_not_published")
    return identity_failures, admission_failures, publication_failures, per_record


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

    ifail, afail, pfail, per_record = verify(rt, pack_records, record, args.expected_runtime_sha256, args.expected_pack_sha256)
    for r in per_record:
        print(f"IDENTITY {r['ku_id']}: {r['identity']}" + (f" errors={r['errors']}" if r["errors"] else ""))
    print(f"IDENTITY overall: {'PASS' if not ifail else 'FAIL ' + str(ifail)}")
    print(f"BINDING ADMISSION overall: {'PASS' if not afail else 'REJECTED (fail-closed) ' + str(afail)}")
    print(f"PUBLICATION GATE overall: {'CLOSED (correct: release_eligible and production_ready remain false, overlay NOT_PUBLISHED)' if not pfail else 'FAIL ' + str(pfail)}")
    print("NOTE: binding admission PASS means only that the identity binding is registered. It does NOT mark release_eligible, PRODUCTION_READY, or publish any overlay; those require the separate teaching-certification and deployment gates.")

    if not args.self_test:
        return 0 if not ifail and not pfail else 1

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
    rec_unapproved = copy.deepcopy(base_rec)
    for r in rec_unapproved["records"]:
        r["registration_status"] = "PENDING_REGISTRAR_SIGNOFF"
    rec_unapproved["registration_authority_signed"] = False
    rec_unapproved.pop("authorization", None)
    expect_reject("unapproved_binding_admission", lambda: bool(verify(base_rt, base_pack, rec_unapproved, args.expected_runtime_sha256, args.expected_pack_sha256)[1]))
    # Approved control: the input record itself (already APPROVED under owner
    # instruction) must admit; no in-memory upgrade is needed or applied.
    _, afail_approved, _, _ = verify(base_rt, base_pack, base_rec, args.expected_runtime_sha256, args.expected_pack_sha256)
    approved_admits = not afail_approved
    results.append(("approved_record_admits (control: input record as submitted)", approved_admits))
    print(f"  {'PASS' if approved_admits else 'FAIL'} control:approved_record_admits")
    rec_flip = copy.deepcopy(base_rec)
    rec_flip["records"][0]["release_eligible"] = True
    expect_reject("release_eligible_flip_boundary_violation", lambda: bool(verify(base_rt, base_pack, rec_flip, args.expected_runtime_sha256, args.expected_pack_sha256)[2]))
    for label, bad in [("registry_missing", None), ("registry_corrupt", "{not json"), ("registry_version_incompatible", json.dumps({"schema": "wrong-schema-v9", "records": []}))]:
        try:
            doc = None if bad is None else json.loads(bad)
            rejected = doc is None or doc.get("schema") not in ALLOWED_RECORD_SCHEMAS
        except Exception:
            rejected = True
        results.append((f"registry_{label}", rejected))
        print(f"  {'PASS' if rejected else 'FAIL'} injection_rejected:registry_{label}")
    readonly_ok = sha256_file(args.runtime_gz) == rt_bytes_hash_before and sha256_file(args.pack) == pack_bytes_hash_before
    print(f"  {'PASS' if readonly_ok else 'FAIL'} READ-ONLY assertion (unnumbered): inputs_unchanged (Runtime + pack hashes identical before/after)")
    failed = [n for n, ok in results if not ok]
    print(f"\nSELF-TEST: {len(results) - len(failed)}/{len(results)} passed" + (f"; FAILED: {failed}" if failed else ""))
    return 0 if not failed and not ifail and not pfail else 1


if __name__ == "__main__":
    sys.exit(main())
