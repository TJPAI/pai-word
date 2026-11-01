#!/usr/bin/env python3
"""Conservative substantive checks for isolated V1 candidates; no source changes."""
import json,pathlib,collections,re
B=pathlib.Path(__file__).resolve().parent;D=B/"teaching_qa/full_recognition_audit";O=D/"isolated_patch_v2";O.mkdir(exist_ok=True)
a=[json.loads(s) for s in (D/"isolated_patch_v1/recognition_patch_candidates_117.jsonl").read_text(encoding="utf8").splitlines() if s.strip()]
assert len(a)==117
# Explicit linguistic warning cases: near synonyms, variants, potential wrong source sense, or contrastive distractor too plausible.
known={
1:("REWRITE","arrive is also a possible answer for 'reach a destination'"),
12:("RECHECK","sedan can denote a chauffeured luxury car, so distinguish vehicle type explicitly"),
13:("RECHECK","limo and sedan overlap in extension; inspect definition scope"),
25:("RECHECK","sled and sledge may be lexical variants"),
26:("RECHECK","intentionally may overlap with purposely in unrestricted context"),
31:("SOURCE_HOLD","clove as verb inflection associated with cleave sense; do not change lemma mapping without authoritative lexical evidence"),
34:("RECHECK","characterization and interpretation may overlap in some contexts"),
37:("RECHECK","tenacity could overlap with stubbornness; inspect clue"),
47:("RECHECK","calmness and indifference can overlap in some contexts"),
54:("RECHECK","viewing and screening in film context overlap; proposed clue must exclude screening"),
55:("RECHECK","clank and squeak acoustically distinct, but definition broad"),
58:("RECHECK","merrily and happily synonymous for 'joyous'"),
60:("RECHECK","rickety may apply to brittle or weak structures; inspect clue"),
64:("SOURCE_HOLD","transcriber source specifically encodes translator-like meaning; do not overwrite a source-encoded lexical sense merely due to modern common meaning"),
65:("RECHECK","pacify and calm can overlap; ensure distractors are not semantic equivalents"),
67:("RECHECK","abstention and abstinence require context"),
72:("RECHECK","coda and finale can both be closing musical sections"),
78:("RECHECK","testicle and testis are direct synonyms"),
80:("RECHECK","trite may overlap with obsolete in limited situations; difficulty graded"),
81:("RECHECK","everlasting and ceaseless are close synonyms"),
82:("RECHECK","unending and ceaseless are close synonyms"),
93:("RECHECK","unyielding and dour share a stubbornness reading"),
100:("RECHECK","forebear and forbear are variant spellings for ancestor"),
107:("RECHECK","earlier vs sooner needs temporal example"),
109:("RECHECK","sooner vs earlier needs temporal example"),
111:("RECHECK","queasy can mean nauseated or nausea-inducing by source sense; check before glossary correction"),
112:("RECHECK","expressionless and deadpan have overlapping senses"),
113:("REWRITE","swamp is too close to morass in the geographical sense"),
117:("RECHECK","restorer can also be a kind of mender")
}
out=[];cnt=collections.Counter()
for q in a:
 n=q["review_number"];opts=q["candidate_changes"]["options"];gloss=q["candidate_changes"]["gloss_en"]
 if q["status"]=="HOLD":
  label="HOLD_SOURCE_SENSE";reason=known.get(n,("SOURCE_HOLD","Verify source Sense"))[1]
 elif n in known:
  label="REVISE_OR_SEMANTIC_CHECK";reason=known[n][1]
 elif opts is None and gloss is not None:
  label="ALL_OPTION_CONTEXT_CHECK";reason="Revised clue may still match competing option; full semantic comparison needed"
 else:
  label="PEDAGOGICAL_REVIEW_PENDING";reason="No new deterministic defect identified; no positive semantic approval implied"
 cnt[label]+=1
 out.append({"review_number":n,"ku_id":q["ku_id"],"lemma":q["original"]["lemma"],"source":q["source"],"source_line":q["source_line"],"candidate_changes":q["candidate_changes"],"decision":label,"diagnosis":reason,"approved":False,"source_modified":False})
(O/"recognition_v2_semantic_review_117.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
summary={"records":117,"statuses":dict(cnt),"confirmed_semantic_approvals":0,"source_changed":False,"runtime_changed":False,"note":"Conservative lexical review and targeted semantic warnings; no full independent linguistic certification"}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(summary,ensure_ascii=False))
