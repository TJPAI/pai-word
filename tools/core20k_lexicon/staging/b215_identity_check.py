#!/usr/bin/env python3
"""B215 independent identity check (QA evidence script, not a CI test).

Usage:
  python3 b215_identity_check.py <runtime.json> <batch93_pack.json>

Reads the pinned formal Runtime (decompressed JSON) and the Batch93
teaching pack, and reports, per record, without any wordform guessing:
  - rank -> lemma match against the Runtime headword list
  - POS match
  - exact ku_id presence in the Runtime KU index
  - gloss_zh / gloss_en comparison against the matched Runtime KU tuple
  - whether the pack's headword_id and sense_id literals occur anywhere
    in the Runtime text (expected: never, because the Runtime has neither
    a headword_id field nor any sense_id field)

Exit code 0 always (this is a reporting tool); verdicts live in the
accompanying QA report and evidence JSON. The Runtime file itself lives
on the core20k-lexicon-production-v1 branch, so this script is run by
hand against a pinned checkout, not in CI.
"""
import json
import sys


def main() -> None:
    runtime_path, pack_path = sys.argv[1], sys.argv[2]
    with open(runtime_path, encoding="utf-8") as f:
        raw = f.read()
    rt = json.loads(raw)
    with open(pack_path, encoding="utf-8") as f:
        pack = json.load(f)
    by_rank = {}
    all_kus = {}
    for hw in rt["headwords"]:
        rank, lemma, pos, _ipa, kus = hw
        by_rank[rank] = hw
        for ku in kus:
            all_kus[ku[0]] = (lemma, rank, ku)
    print(f"runtime: {rt['schema']} {rt['release']} | headwords: "
          f"{len(rt['headwords'])} | total KUs: {len(all_kus)} | "
          f"sense_id occurrences: {raw.count('sense_id')}")
    print()
    for rec in pack["records"]:
        rank, lemma, pos, ipa, kus = by_rank[rec["rank"]]
        hit = all_kus.get(rec["ku_id"])
        print(f"--- {rec['headword']} rank={rec['rank']} "
              f"pack_ku={rec['ku_id']} pack_sense={rec['sense_id']}")
        print(f"    rank->lemma={lemma} pos={pos} runtime_ipa={ipa} | "
              f"rank-lemma match: {lemma == rec['headword']} | "
              f"pos match: {pos == rec['pos']}")
        print(f"    runtime KUs under this headword ({len(kus)}):")
        for ku in kus:
            print(f"      {ku}")
        if hit:
            print(f"    EXACT ku_id HIT: lemma={hit[0]} rank={hit[1]} "
                  f"tuple={hit[2]}")
            print(f"    gloss_zh equal: {hit[2][2] == rec['gloss_zh']} "
                  f"(runtime={hit[2][2]!r} pack={rec['gloss_zh']!r})")
            print(f"    gloss_en: runtime={hit[2][3]!r} "
                  f"pack={rec['gloss_en']!r}")
        else:
            print("    EXACT ku_id HIT: NONE")
        print(f"    headword_id literal in runtime: "
              f"{rec['headword_id'] in raw} | sense_id literal in "
              f"runtime: {rec['sense_id'] in raw}")
        print()


if __name__ == "__main__":
    main()
