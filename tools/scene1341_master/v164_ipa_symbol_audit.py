#!/usr/bin/env python3
"""V164 IPA notation risk audit of V154's four-scene Kaikki crosswalk.
Runs without network; provenance and source rows are never modified.
Usage: python v164_ipa_symbol_audit.py INPUT_CROSSWALK_JSON OUTPUT_REPORT_JSON
"""
import collections,hashlib,json,re,sys
from pathlib import Path
source=Path(sys.argv[1]);out=Path(sys.argv[2]);data=json.loads(source.read_text())
rows=data["records"];assert len(rows)==996
patterns={
"RHOTIC_APPROXIMANT_ɹ":r"ɹ","RHOTIC_SCHWA_ɚ":r"ɚ","STRESSED_RHOTIC_VOWEL_ɝ":r"ɝ",
"IPA_SCRIPT_G_ɡ":r"ɡ","AFFRICATE_TIE_BAR_͡":r"͡","NONSYLLABIC_DIACRITIC_̯":r"̯",
"SYLLABIC_DIACRITIC_̩":r"̩","SYLLABLE_DOT":r"\.","LONG_MARK_ː":r"ː",
"PRIMARY_STRESS_ˈ":r"ˈ","SECONDARY_STRESS_ˌ":r"ˌ","OPTIONAL_PARENS":r"[()]",
"SOURCE_FRAGMENT_HYPHEN":r"-","FLAP_ɾ":r"ɾ","GLOTTAL_STOP_ʔ":r"ʔ",
"DARK_L_ɫ":r"ɫ","ASPIRATION_ʰ":r"ʰ","OTHER_COMBINING_MARK":r"[\u0300-\u036f]",
"BRITISH_VOWEL_ɒ":r"ɒ","DIPHTHONG_VARIANT_ʉ":r"ʉ"
}
inv={}
for k,p in patterns.items():
 matches=[(r,v) for r in rows for v in r["phonemic_variants"] if re.search(p,v)]
 inv[k]={"source_variant_occurrences":len(matches),
  "unique_record_count":len({r["record_id"] for r,v in matches}),
  "examples":[{"expression":r["expression"],"ipa":v,"scene_id":r["scene_id"],"status":r["status"]} for r,v in matches[:4]]}
counts={"status_counts":dict(collections.Counter(r["status"] for r in rows)),
 "records_total":len(rows),"records_with_phonemic_ipa":sum(bool(r["phonemic_variants"]) for r in rows),
 "variants_total":sum(len(r["phonemic_variants"]) for r in rows),
 "formal_approved":sum(bool(r.get("ipa_formal_approved")) for r in rows),
 "records_with_multiple_distinct_ipa":sum(len(set(r["phonemic_variants"]))>1 for r in rows)}
queue=[]
for r in rows:
 for v in r["phonemic_variants"]:
  flags=[]
  if "-" in v:flags.append("SOURCE_FRAGMENT_OR_COMPOUND_HYPHEN_NEEDS_REVIEW")
  if "(" in v or ")" in v:flags.append("OPTIONAL_SEGMENT_NEEDS_REVIEW")
  if any(s in v for s in "ɾʔɫʰ"):flags.append("PHONETIC_DETAIL_NEEDS_BROAD_TRANSCRIPTION_DECISION")
  if flags:queue.append({"record_id":r["record_id"],"source_final_row":r["source_final_row"],"expression":r["expression"],"ipa":v,"flags":flags})
report={
 "version":"V164","scope":"V154 SC50-0011..0014 996 record original Kaikki-derived crosswalk, not full Kaikki corpus",
 "dictionary_source_sha256":rows[0]["dictionary_source_sha256"],
 "input_crosswalk_sha256":hashlib.sha256(source.read_bytes()).hexdigest(),
 "counts":counts,"symbol_inventory":inv,
 "display_only": {
 "APPROVED":"ɹ to r, only in identified English IPA display fields, V163",
 "PROPOSED":["ɡ to g as English learner notation glyph convention","t͡ʃ to tʃ and d͡ʒ to dʒ for broad English phonemic display; QA review before release"],
 "CONDITIONAL":["ɚ and ɝ conversion needs accent and vowel stress semantics","ʉ/ɒ and other vowel symbols require pronunciation dialect assessment","ɾ/ʔ/ɫ/ʰ cannot be replaced by guessed citation phonemes","(optional) and -fragment IPA require data quality holds"],
 "DO_NOT_STRIP":["ˈ","ˌ","ː",".","̯","̩"],"source_immutable":True,"qa_status_immutable":True,"release_allowed":False},
 "source_risk_occurrences_total":len(queue),"source_risk_preview_first50":queue[:50],
 "formal_ready":0,"release_allowed":False
}
assert counts["variants_total"]==959 and counts["records_with_phonemic_ipa"]==330
assert inv["RHOTIC_APPROXIMANT_ɹ"]["unique_record_count"]==136
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(counts,ensure_ascii=False))
