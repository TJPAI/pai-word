#!/usr/bin/env python3
"""Strict editorial hold on automated distractor candidates; propose actionable, safe source-edit workflow."""
import json,pathlib,re,collections
B=pathlib.Path(__file__).resolve().parent
D=B/"teaching_qa/full_recognition_audit"
read=lambda f:[json.loads(x) for x in (D/f).read_text(encoding="utf-8").splitlines() if x.strip()]
rows=read("replacement_candidates_refined_64.jsonl")
others=read("remaining_53_review_dossier.jsonl")
assert len(rows)==64 and len(others)==53
# Case-specific editorial findings on the 64 source-backed candidates. These are intentionally conservative:
# they are not a replacement for full human semantic certification.
bad_words={"vaccination","massage","affection","cranberry","fag","inpatient","racehorse","brigadier","alkali","mastectomy","multilingualism","titillate","wholeness","mathematician","hiccup","barter","signatory","commando","cyanide","clique","midterm","posse","loin"}
# Various original options are also near synonyms and need full-option semantic QA.
additional_ambiguity={
  37:["insistence"],47:["tranquilizer"],55:["hubbub"],65:["assuage","mollify"],
  75:["perplexity"],80:["threadbare"],81:["ceaseless","unabated"],
  82:["ceaseless","unabated"],94:["boob"],117:["restorer"]
}
def dump(f,x):(D/f).write_text("".join(json.dumps(t,ensure_ascii=False)+"\n" for t in x),encoding="utf-8")
review=[]
counts=collections.Counter()
for x in rows:
 n=x["review_number"]
 proposal=x.get("proposed_options")
 original=x["original_options"]
 replacement=[p for p in (proposal or []) if p not in original]
 flags=[]
 if any(w.casefold() in bad_words for w in replacement):flags.append("OBVIOUSLY_UNRELATED_OR_UNSUITABLE")
 if n in additional_ambiguity:flags.append("OTHER_POTENTIAL_SEMANTIC_COMPETITORS")
 # Original option count=4 is verified; absence of flagged issues does not certify suitability.
 if len(set(v.casefold() for v in (proposal or [])))!=4:flags.append("OPTION_CONTRACT")
 status="REWRITE_NEEDED" if flags else "MANUAL_QUALITY_REVIEW_REQUIRED"
 counts[status]+=1
 review.append({"review_number":n,"ku_id":x["ku_id"],"lemma":x["answer"],"original_options":original,"discard_unreviewed_automatic_proposal":True,"prior_proposed_options":proposal,"editorial_red_flags":flags,"additional_potential_competitors":additional_ambiguity.get(n,[]),"status":status,"recommendation":"Regenerate distractor set from vetted same-POS teaching vocabulary with graded semantic distance; verify all four options against definition and part of speech. Do not use nearest-rank first candidate.","source":x["source"],"source_line":x["source_line"]})
dump("editorial_gate_high_priority_64.jsonl",review)
# Make a manifest with each source and intended resolution route: manual vocabulary judgment before edit.
manifest=review+[{"review_number":x["review_number"],"ku_id":x["ku_id"],"lemma":x["answer"],"source":x["source"],"source_line":x["source_line"],"status":"LEXICAL_FORM_VERIFICATION" if x["category"]=="lexical_or_form_verification" else "CONTEXT_DISAMBIGUATION","recommendation":x["review_instruction"],"discard_unreviewed_automatic_proposal":True} for x in others]
manifest.sort(key=lambda x:x["review_number"])
assert len(manifest)==117 and len({x["ku_id"] for x in manifest})==117
dump("editorial_resolution_manifest_117.jsonl",manifest)
summary={"total_review_cases":117,"high_priority":64,"remaining":53,"high_priority_gate":dict(counts),"auto_proposals_approved":0,"automatic_source_changes":0,"status":"HOLD_FOR_EXPLICIT_SEMANTIC_EDITORIAL_REVIEW","note":"Earlier 64 formally valid distractor proposals must not be treated as teaching-quality approved."}
(D/"editorial_gate_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(summary,ensure_ascii=False))
