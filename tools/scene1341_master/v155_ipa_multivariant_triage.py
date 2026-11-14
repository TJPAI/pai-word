#!/usr/bin/env python3
"""Conservative Scene1341 multi-IPA region triage. No automatic Ready state."""
import json, sys, collections
from pathlib import Path

def run(source, destination):
    d=json.loads(Path(source).read_text(encoding="utf-8"))
    records=[]
    for r in d["records"]:
        if r["status"]!="MULTIVARIANT_UNSELECTED":
            continue
        variants=set(r["phonemic_variants"])
        by_tag=collections.defaultdict(set)
        for e in r["source_evidence"]:
            for tag in e.get("tags",[]):
                if e["ipa"] in variants: by_tag[tag].add(e["ipa"])
        ga=by_tag.get("General-American",set())
        us=by_tag.get("US",set())
        rp=by_tag.get("Received-Pronunciation",set())
        selected=None
        reason="NO_UNAMBIGUOUS_AMERICAN_REGION_EVIDENCE"
        if len(ga)==1 and (not us or ga==us):
            selected=next(iter(ga))
            reason="GENERAL_AMERICAN_UNIQUE_REGION_EVIDENCE"
        elif not ga and len(us)==1:
            selected=next(iter(us))
            reason="US_UNIQUE_REGION_EVIDENCE"
        elif len(ga)>1 or len(us)>1:
            reason="MULTIPLE_US_PRONUNCIATIONS_REQUIRE_POS_SENSE_REVIEW"
        elif ga and us and ga!=us:
            reason="GA_US_REGION_CONFLICT"
        selected_evidence=[e for e in r["source_evidence"]
            if selected and e["ipa"]==selected
            and ("General-American" in e.get("tags",[]) or "US" in e.get("tags",[]))]
        if selected: assert selected_evidence
        records.append({
            "scene_id":r["scene_id"],"record_id":r["record_id"],
            "source_final_row":r["source_final_row"],
            "expression":r["expression"],
            "meaning_zh_source":r.get("meaning_zh_source"),
            "status":"AMERICAN_ACCENT_TEST_CANDIDATE_NOT_READY" if selected else "HOLD_MULTI_IPA",
            "selection_reason":reason,"ipa_candidate":selected,
            "phonemic_variants":r["phonemic_variants"],
            "us_variants":sorted(us),"general_american_variants":sorted(ga),
            "received_pronunciation_variants":sorted(rp),
            "selected_source_evidence":selected_evidence,
            "source_evidence":r["source_evidence"],
            "source_sha256":d["raw_source_sha256"],
            "canonical_sense_id":r["canonical_sense_id"],
            "qa_approved":False,"release_allowed":False})
    assert len(records)==243
    assert len(set(x["record_id"] for x in records))==243
    assert all(x["ipa_candidate"] in x["phonemic_variants"] for x in records if x["ipa_candidate"])
    counts=collections.Counter(x["status"] for x in records)
    reasons=collections.Counter(x["selection_reason"] for x in records)
    report={"version":"V155","source_version":d["version"],"source_sha256":d["raw_source_sha256"],
       "policy":"Unique General-American, or unique US when GA absent; no arbitrary accent, phrase synthesis, or Ready without Sense/POS and QA.",
       "counts":{"multivariant_rows":len(records),**dict(counts)},"reasons":dict(reasons),
       "records":records,"release_allowed":False}
    Path(destination).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"counts":report["counts"],"reasons":report["reasons"]},ensure_ascii=False,indent=2))

if __name__=="__main__":
    if len(sys.argv)!=3: raise SystemExit("Usage: python v155_ipa_multivariant_triage.py v154_crosswalk.json v155_triage.json")
    run(sys.argv[1],sys.argv[2])
