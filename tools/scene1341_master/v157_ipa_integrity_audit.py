#!/usr/bin/env python3
"""CG-MASTER V157: audit V155 Kaikki multi-reading IPA integrity without changing release."""
import collections,json,re,sys
from pathlib import Path
d=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
rows=[]
for q in d["records"]:
    v=q["phonemic_variants"]; ev=q["source_evidence"]
    fragment=sorted(x for x in v if re.search(r"^/[-‐‑–]|[-‐‑–]/$",x))
    complete=[x for x in v if x not in fragment and x.startswith("/") and x.endswith("/") and len(x)>2]
    by=collections.defaultdict(set)
    for e in ev:
        if e.get("ipa") in complete: by[e["pos"]].add(e["ipa"])
    unambiguous={p:next(iter(readings)) for p,readings in by.items() if len(readings)==1}
    divergent=len(set(unambiguous.values()))>1
    kind=("NO_PHONEMIC_IPA_ONLY_PHONETIC_OR_MISSING" if not v else
          "FRAGMENTS_ONLY_NO_VALID_FULL_IPA" if fragment and not complete else
          "CONTAINS_FRAGMENT_KEEP_FULL_VARIANTS_ONLY" if fragment else
          "POS_DIFFERENT_READINGS_NEED_TARGET_SENSE" if divergent else
          "MULTIPLE_FULL_READINGS_NEED_ADJUDICATION" if q["status"]=="HOLD_MULTI_IPA" else
          "REGION_UNIQUE_TEST_CANDIDATE_REQUIRES_SENSE_QA")
    assert not q["ipa_candidate"] or q["ipa_candidate"] in complete
    rows.append(dict(scene_id=q["scene_id"],record_id=q["record_id"],source_final_row=q["source_final_row"],
       expression=q["expression"],meaning_zh_source=q.get("meaning_zh_source"),v155_status=q["status"],
       v155_ipa_candidate=q["ipa_candidate"],integrity_category=kind,fragment_ipa=fragment,
       complete_phonemic_ipa_variants=complete,evidence_pos_variants={k:sorted(v) for k,v in by.items()},
       unambiguous_pos_readings=unambiguous,pos_variants_divergent=divergent,
       source_evidence=ev,source_sha256=q["source_sha256"],canonical_sense_id=None,
       qa_approved=False,release_allowed=False))
assert len(rows)==243 and len({r["record_id"] for r in rows})==243
counts=dict(collections.Counter(r["integrity_category"] for r in rows))
result=dict(version="V157",input_version="V155",source_sha256=d["source_sha256"],
   scope="SC50-0011..0014 / 243 multi-IPA cards",counts=counts,
   records=rows,formal_ready=0,release_allowed=False)
Path(sys.argv[2]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(counts,indent=2))
