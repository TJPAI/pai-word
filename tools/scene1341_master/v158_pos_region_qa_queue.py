#!/usr/bin/env python3
"""V158: fail-closed POS/US-region Kaikki evidence queue from V157 integrity audit."""
import collections,json,sys
from pathlib import Path
d=json.loads(Path(sys.argv[1]).read_text(encoding="utf8")); rows=[]
for r in d["records"]:
    if r["integrity_category"]!="MULTIPLE_FULL_READINGS_NEED_ADJUDICATION":continue
    regions=collections.defaultdict(lambda:collections.defaultdict(set))
    pos=collections.defaultdict(set)
    for e in r["source_evidence"]:
        if e.get("ipa") not in r["complete_phonemic_ipa_variants"]:continue
        for tag in ("General-American","US"):
            if tag in e["tags"]:
                regions[tag][e["pos"]].add(e["ipa"])
                pos[e["pos"]].add(e["ipa"])
    american=sorted({v for vs in pos.values() for v in vs})
    one={p:next(iter(v)) for p,v in pos.items() if len(v)==1}
    status=("NO_EXPLICIT_US_REGION_EVIDENCE" if not american else
        "POS_CONDITIONAL_SINGLE_US_IPA_NEEDS_MASTER_POS_SENSE" if one else
        "MULTIPLE_US_IPA_WITHIN_POS_NEEDS_MANUAL_QA")
    rows.append(dict(scene_id=r["scene_id"],record_id=r["record_id"],
        source_final_row=r["source_final_row"],expression=r["expression"],
        meaning_zh_source=r["meaning_zh_source"],review_status=status,
        pos_conditional_ipa=one,american_variants=american,
        region_pos_variants={t:{p:sorted(v) for p,v in ps.items()} for t,ps in regions.items()},
        original_ipa_variants=r["complete_phonemic_ipa_variants"],
        source_evidence=r["source_evidence"],source_sha256=r["source_sha256"],
        target_pos_from_master=None,canonical_sense_id=None,ipa_candidate=None,
        qa_approved=False,release_allowed=False))
counts=dict(collections.Counter(r["review_status"] for r in rows))
assert len(rows)==86 and counts=={
    "NO_EXPLICIT_US_REGION_EVIDENCE":45,
    "MULTIPLE_US_IPA_WITHIN_POS_NEEDS_MANUAL_QA":34,
    "POS_CONDITIONAL_SINGLE_US_IPA_NEEDS_MASTER_POS_SENSE":7}
assert len(set(r["record_id"] for r in rows))==86
out=dict(version="V158",source_version="V157",source_sha256=d["source_sha256"],
    counts=counts,records=rows,formal_approved=0,release_allowed=False,
    policy="POS-conditioned evidence must be matched to Master target POS/Sense and independent QA; no automatic publication.")
Path(sys.argv[2]).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(counts,ensure_ascii=False))
