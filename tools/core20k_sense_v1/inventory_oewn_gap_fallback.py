#!/usr/bin/env python3
"""Production-pass gap inventory for OEWN-unmatched Core20K ranks; no invented sense IDs."""
import json,pathlib,collections,gzip
base=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: words=json.load(f)["headwords"]
missing=[];stats=collections.Counter()
for n in range(1,41):
    path=base/f"batch{n:03d}.jsonl"
    rows=[json.loads(x) for x in path.open(encoding="utf8")]
    assert len(rows)==500
    for r in rows:
        if r["senses"]:continue
        w=words[r["rank"]-1]
        assert w[1].casefold()==r["lemma"].casefold()
        native=[k for k in w[4] if isinstance(k,list) and len(k)>=4 and str(k[1]).casefold()=="sense"]
        status="NATIVE_RUNTIME_SENSE_SOURCE_AVAILABLE" if native else "NO_NATIVE_RUNTIME_SENSE"
        stats[status]+=1
        missing.append({"rank":r["rank"],"lemma":r["lemma"],"source_gap":"OEWN2025_NO_EXACT_LEMMA_MATCH",
           "native_sense_candidate_count":len(native),"native_sense_candidates":[{"source_ku_id":k[0],"gloss_zh_unverified":k[2],"gloss_en_source":k[3]} for k in native],
           "next_action":"NATIVE_SENSE_SOURCE_ADAPT" if native else "ALTERNATIVE_LEXICON_SOURCE_REQUIRED",
           "release_eligible":False,"production_ready":False})
assert len(missing)==637
(base/"oewn_no_match_637_with_runtime_fallback.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in missing),encoding="utf8")
report={"oewn_unmatched":len(missing),"source_classes":dict(stats),"native_candidate_sense_records":sum(x["native_sense_candidate_count"] for x in missing),"independent_semantic_certified":0}
(base/"oewn_no_match_fallback_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("OEWN_GAP_FALLBACK_INVENTORY_PASS",json.dumps(report,ensure_ascii=False))
