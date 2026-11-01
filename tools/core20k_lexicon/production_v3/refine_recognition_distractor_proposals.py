#!/usr/bin/env python3
"""Conservative QA on 64 replacement suggestions; review dossier for other 53.
No automatic semantic validation or edits of KU/Sense/runtime.
"""
import pathlib,json,re,collections
B=pathlib.Path(__file__).resolve().parent
D=B/"teaching_qa/full_recognition_audit"
read=lambda n:[json.loads(x) for x in (D/n).read_text(encoding="utf8").splitlines() if x.strip()]
write=lambda n,a:(D/n).write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in a),encoding="utf8")
h=read("replacement_candidates_high_priority_64.jsonl")
assert len(h)==64
common={"the","a","an","of","to","be","or","and","in","as","with","on","by","for","that","which","one","something","someone","person","thing","very","is","at","from"}
words=lambda x:set(re.findall(r"[a-z]{3,}",str(x).lower()))-common
refined=[]; stats=collections.Counter()
for q in h:
    answer=q["answer"]; original=q["original_options"]; competing=q["conflicting_options"]; pos=q.get("pos")
    pool=q["candidate_replacement_evidence"]
    valid=[]
    for c in pool:
        w=c["lemma"]
        if c.get("pos")!=pos or w.casefold() in {str(v).casefold() for v in original}:continue
        clue=words(q["definition_en"]); candidate_gloss=words(c.get("gloss_en",""))
        overlap=len(clue&candidate_gloss)
        # Similar meaning increases ambiguity, not teaching value; reject explicit overlap pending semantics.
        if overlap>=2:continue
        rank=int(re.search(r"rank:(\d+)",q["ku_id"]).group(1))
        other=int(re.search(r"rank:(\d+)",c["evidence_ku_id"]).group(1))
        valid.append((abs(rank-other),-overlap,c))
    valid.sort(key=lambda t:(t[0],t[1],t[2]["lemma"]))
    used={str(x).casefold() for x in original if x not in competing}
    recommended=list(original); evidence=[]; reason=[]
    for k,opt in enumerate(recommended):
        if opt not in competing:continue
        chosen=None
        for _,__,c in valid:
            if c["lemma"].casefold() not in used:
                chosen=c;break
        if chosen:
            recommended[k]=chosen["lemma"];used.add(chosen["lemma"].casefold());evidence.append(chosen)
        else:reason.append("NO_DISTINCT_POS_MATCHING_CANDIDATE")
    if len(set(x.casefold() for x in recommended))!=4:reason.append("DUPLICATE_REPLACEMENT_OPTION")
    if any(x in recommended for x in competing):reason.append("COMPETING_OPTION_REMAINS")
    if len(evidence)!=len(competing):reason.append("INCOMPLETE_REPLACEMENT")
    status="PRELIMINARY_REVIEWABLE" if not reason else "NEEDS_MANUAL_REWRITE"
    stats[status]+=1
    refined.append({"review_number":q["review_number"],"ku_id":q["ku_id"],"source":q["source"],"source_line":q["source_line"],"answer":answer,"pos":pos,"definition_en":q["definition_en"],"original_options":original,"competitors":competing,"proposed_options":recommended if not reason else None,"replacement_evidence":evidence,"status":status,"blockers":reason,"editorial_warning":"POS, distinct IDs and obvious definition overlap checked; subtle synonymy, distractor quality and learner difficulty unverified. Do not automatically apply."})
write("replacement_candidates_refined_64.jsonl",refined)
other=read("semantic_triage_contextual_disambiguation.jsonl")+read("semantic_triage_lexical_or_form_verification.jsonl")
assert len(other)==53
review=[]
for x in other:
 category=x["triage_category"]
 review.append({"ku_id":x["ku_id"],"review_number":x["review_number"],"lemma":x["lemma"],"answer":x["answer"],"competing_options":x["competing_options"],"definition_en":x["definition_en"],"category":category,"source":x["source"],"source_line":x["source_line"],"review_instruction":("Verify lemma/inflection/POS against the original teaching Sense and authentic lexical usage" if category=="lexical_or_form_verification" else "Specify distinctive usage or contextual example; check all answer options before editing"),"status":"MANUAL_LEXICAL_REVIEW_PENDING"})
write("remaining_53_review_dossier.jsonl",review)
summary={"high_priority":64,"candidate_status":dict(stats),"remaining_dossier":53,"source_modified":False,"semantic_certification":False,"safe_for_automatic_application":False}
(D/"replacement_refinement_summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
print(json.dumps(summary,ensure_ascii=False))
