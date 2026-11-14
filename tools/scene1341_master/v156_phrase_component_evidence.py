#!/usr/bin/env python3
"""V156: Evidence-only token crosswalk for Kaikki NO_EXACT_HEADWORD expressions.
Never infer or publish phrase IPA from word components.
Usage: python v156_phrase_component_evidence.py V154_crosswalk.json V156_output.json
"""
import json,re,collections,sys
from pathlib import Path
source=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
by_word=collections.defaultdict(list)
for r in source["records"]:
    if r["status"] in {"SINGLE_PHONEMIC_TEST_CANDIDATE","MULTIVARIANT_UNSELECTED"} and r["source_evidence"]:
        by_word[r["expression"].casefold().strip()].append(r)
rows=[]
for r in source["records"]:
    if r["status"]!="NO_EXACT_HEADWORD": continue
    tokens=re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?",r["expression"])
    parts=[]
    for token in tokens:
        matched=by_word.get(token.casefold(),[])
        variants=sorted({e["ipa"] for x in matched for e in x["source_evidence"] if e.get("ipa","").startswith("/") and e["ipa"].endswith("/")})
        parts.append({"token":token,"phonemic_variants":variants,"kaikki_entry_lines":sorted({e["line"] for x in matched for e in x["source_evidence"] if e.get("ipa") in variants}),"reference_record_ids":sorted({x["record_id"] for x in matched}),"unique_phonemic_variant":variants[0] if len(variants)==1 else None})
    covered=sum(bool(p["phonemic_variants"]) for p in parts)
    single=sum(bool(p["unique_phonemic_variant"]) for p in parts)
    status=("ALL_COMPONENTS_SINGLE_IPA_EVIDENCE_ONLY" if tokens and single==len(tokens)
       else "ALL_COMPONENTS_SOME_IPA_EVIDENCE_ONLY" if tokens and covered==len(tokens)
       else "PARTIAL_COMPONENT_EVIDENCE_ONLY" if covered
       else "NO_COMPONENT_EVIDENCE")
    rows.append({"scene_id":r["scene_id"],"record_id":r["record_id"],"source_final_row":r["source_final_row"],"expression":r["expression"],"meaning_zh_source":r.get("meaning_zh_source"),"source_locator":r["source_locator"],"tokens":parts,"status":status,"phrase_ipa":None,"is_native_exact_phrase_ipa":False,"canonical_sense_id":None,"qa_approved":False,"release_allowed":False})
assert len(rows)==548 and len({x["record_id"] for x in rows})==548
counts=dict(collections.Counter(x["status"] for x in rows))
assert counts=={"PARTIAL_COMPONENT_EVIDENCE_ONLY":200,"ALL_COMPONENTS_SOME_IPA_EVIDENCE_ONLY":6,"NO_COMPONENT_EVIDENCE":342}
result={"version":"V156","source_version":"V154","source_sha256":source["raw_source_sha256"],"counts":counts,"records":rows,"release_allowed":False}
Path(sys.argv[2]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"rows":len(rows),"counts":counts},indent=2))
