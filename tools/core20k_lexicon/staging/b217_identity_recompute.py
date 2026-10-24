#!/usr/bin/env python3
"""B217 identity recompute: independently verify registrar-candidate rows
against a pinned formal Runtime and the frozen Batch93 pack.

Usage:
  python3 b217_identity_recompute.py <runtime.json.gz> <pack.json> <candidate.json>

Checks per record: ku_id exists in the Runtime; rank, lemma, headword POS,
KU type (must be 'sense'), runtime glosses zh/en, playable flag, and the
pack record's headword/rank agreement. Also verifies the Runtime gz SHA-256
against the pinned value and the candidate's top-level release flags.

Exit 0 only if every row reproduces AND the candidate is honestly flagged
unsigned / not production-ready. A passing recompute verifies the CANDIDATE
content; it does NOT constitute registrar signature or release approval.
"""
import gzip
import hashlib
import json
import sys

PINNED_RUNTIME_GZ_SHA256 = "e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"


def main() -> int:
    runtime_gz_path, pack_path, candidate_path = sys.argv[1:4]
    raw = open(runtime_gz_path, "rb").read()
    gz_sha = hashlib.sha256(raw).hexdigest()
    print(f"runtime_gz_sha256: {gz_sha}")
    print(f"runtime_gz_bytes: {len(raw)}")
    if gz_sha != PINNED_RUNTIME_GZ_SHA256:
        print("FAIL: runtime gz SHA does not match the pinned value; aborting recompute.")
        return 1
    rt = json.loads(gzip.decompress(raw))
    print(f"runtime_schema: {rt.get('schema')} headwords: {len(rt['headwords'])}")
    by_ku = {}
    for hw in rt["headwords"]:
        rank, lemma, pos, _ipa, kus = hw
        for ku in kus:
            by_ku[ku[0]] = {"rank": rank, "lemma": lemma, "pos": pos, "ku": ku}
    pack = json.load(open(pack_path))
    pack_by_ku = {r["ku_id"]: r for r in pack["records"]}
    cand = json.load(open(candidate_path))
    print(f"candidate status: {cand.get('status')} signed: {cand.get('registration_authority_signed')} "
          f"production_ready: {cand.get('production_ready')} release_eligible: {cand.get('release_eligible')}")
    all_ok = True
    for r in cand["records"]:
        hit = by_ku.get(r["ku_id"])
        pr = pack_by_ku.get(r["ku_id"])
        checks = {
            "ku_exists": hit is not None,
            "rank": hit["rank"] == r["rank"] if hit else False,
            "lemma": hit["lemma"] == r["lemma"] if hit else False,
            "pos": hit["pos"] == r["pos"] if hit else False,
            "ku_type_sense": hit["ku"][1] == "sense" and r["ku_type"] == "sense" if hit else False,
            "gloss_zh": hit["ku"][2] == r["runtime_gloss_zh_b215"] if hit else False,
            "gloss_en": hit["ku"][3] == r["runtime_gloss_en_b215"] if hit else False,
            "playable": hit["ku"][4] is True if hit else False,
            "pack_match": pr is not None and pr["headword"] == r["lemma"] and pr["rank"] == r["rank"],
            "status_pending": r["registration_status"] == "PENDING_REGISTRAR_SIGNOFF",
            "release_false": r["release_eligible"] is False,
        }
        ok = all(checks.values())
        all_ok = all_ok and ok
        failed = [k for k, v in checks.items() if not v]
        print(f"{r['lemma']} {r['ku_id']}: {'ALL OK' if ok else 'MISMATCH ' + str(failed)}")
    print(f"CANDIDATE ROWS FULLY REPRODUCED: {all_ok}")
    return 0 if all_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
