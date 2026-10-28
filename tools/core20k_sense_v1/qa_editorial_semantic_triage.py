#!/usr/bin/env python3
"""Independent-of-authoring deterministic editorial risk triage; NOT semantic certification."""
import collections, json, pathlib, re
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
records=[]
for path in sorted(root.glob("bilingual_sense_ku_curated_batch[0-9][0-9].jsonl")):
    records.extend(json.loads(line) for line in path.open(encoding="utf8"))
other=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch-all/newly_resolved_sense_ku_editorial.jsonl")
records.extend(json.loads(line) for line in other.open(encoding="utf8"))
assert len(records)>=1484
review=[];counts=collections.Counter()
special={"ha":"SPECIALIZED_ASTRONOMY_ABBREVIATION","swastika":"HISTORICAL_HATE_SYMBOL_CONTEXT","jihadist":"RELIGION_POLITICS_CONTEXT","fucker":"EXPLICIT_PROFANITY_REGISTER","lovemaking":"ADULT_CONTEXT","wanker":"EXPLICIT_PROFANITY_REGISTER"}
for r in records:
    lemma=r["lemma"];prompt=r["prompt"];definition=r["definition_en_source"]
    flags=[]
    if re.search(r"\b(?:a|an) ___\b",prompt,re.I): flags.append("ARTICLE_AND_UNIQUE_ANSWER")
    if "-" in prompt and re.search(r"-___|___-",prompt):flags.append("HYPHENATED_COMPOUND_ANSWER")
    if re.search(r"\b(?:a|an|the) ___ (?:of|for|in)\b",prompt,re.I):flags.append("LOW_CONTEXT_ANSWER_AMBIGUITY")
    if lemma in {"mrs","wept","haired","lipped","desist","funnily","religiosity","journeyman","untitled","infertile","swarthy","mecca","sensuality","incomparable","offshoot","chuff","acrobatic"}:flags.append("SENSE_AND_REGISTER_TARGETED_REVIEW")
    if lemma in special:flags.append(special[lemma])
    if not re.search(r"[.!?]$",prompt):flags.append("PUNCTUATION")
    if len(prompt)<24:flags.append("LOW_CONTEXT_LENGTH")
    for f in flags:counts[f]+=1
    review.append({"rank":r["rank"],"lemma":lemma,"draft_ku_id":r["draft_ku_id"],"review_priority":"HIGH" if flags else "STANDARD","risk_flags":flags,"independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(review)==len(records)==len({x["rank"] for x in review})
out=root/"editorial_semantic_triage_v1.jsonl"
out.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in review),encoding="utf8")
summary={"reviewed":len(review),"high_priority":sum(bool(x["risk_flags"]) for x in review),"standard_priority":sum(not x["risk_flags"] for x in review),"flag_counts":dict(counts),"independently_semantic_certified":0,"production_ready":0,"method":"deterministic triage only; human/independent Sense-KU QA required"}
(root/"editorial_semantic_triage_summary_v1.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("EDITORIAL_SEMANTIC_TRIAGE_PASS",json.dumps(summary,ensure_ascii=False))
