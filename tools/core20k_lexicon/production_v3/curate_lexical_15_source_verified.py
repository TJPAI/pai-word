#!/usr/bin/env python3
"""Source-verified isolation proposals for 15 lexical Sense risks."""
import pathlib,json,collections
B=pathlib.Path(__file__).resolve().parent
D=B/"teaching_qa/full_recognition_audit"
cases=[json.loads(x) for x in (D/"curated_remaining_53.jsonl").read_text(encoding="utf8").splitlines() if x.strip() and json.loads(x)["action_type"]=="VERIFY_LEXICAL_SENSE_FIRST"]
proposals={int(k):v for k,v in json.loads("{\"35\":[\"slice\",\"condone\",\"cleave\",\"personate\"],\"58\":[\"rudely\",\"merrily\",\"silently\",\"angrily\"],\"60\":[\"brittle\",\"rigid\",\"solid\",\"rickety\"],\"67\":[\"attendance\",\"austerity\",\"riser\",\"abstention\"],\"72\":[\"overture\",\"coda\",\"cantata\",\"medley\"],\"78\":[\"kidney\",\"pancreas\",\"liver\",\"testicle\"],\"83\":[\"rescue\",\"perplexity\",\"deliverance\",\"constancy\"],\"93\":[\"delirious\",\"unyielding\",\"supine\",\"agreeable\"],\"100\":[\"forebear\",\"dissenter\",\"freedman\",\"successor\"],\"107\":[\"belatedly\",\"earlier\",\"causally\",\"hereto\"],\"109\":[\"subsequently\",\"hereto\",\"analytically\",\"sooner\"],\"111\":[\"queasy\",\"wholesome\",\"chargeable\",\"passable\"],\"112\":[\"extroverted\",\"stoic\",\"animated\",\"expressionless\"]}").items()}
hold={31:"clove is an inflected form of cleave attached to a cleave Sense ID; requires lemma/inflection source remapping",64:"transcriber source Sense is translation-specific; source lemma/Sense semantics and Chinese gloss require verified lexical decision"}
assert len(cases)==15 and len(proposals)==13
cache={};out=[]
for x in cases:
 p=B/x["source"]
 if p not in cache:cache[p]=[json.loads(t) for t in p.read_text(encoding="utf8").splitlines() if t.strip()]
 source=cache[p][x["source_line"]-1]
 assert source["ku_id"]==x["ku_id"] and source["response"]==x["answer"]
 n=x["review_number"]
 if n in hold:
  status="HOLD_SOURCE_SENSE_REVIEW";options=None;instruction=hold[n]
 else:
  status="OPTION_REWRITE_PENDING_SEMANTIC_QA";options=proposals[n]
  assert len(options)==len(set(t.casefold() for t in options))==4
  assert options.index(source["response"])==source["options"].index(source["response"])
  assert all(term not in options for term in x["competing_options"])
  instruction="Review whether each new distractor is pedagogically plausible and incompatible with the authentic Sense, then apply through source patch only after approval"
 out.append({"review_number":n,"ku_id":x["ku_id"],"source":x["source"],"source_line":x["source_line"],"teaching_sense_id":source["teaching_sense_id"],"lemma":source["lemma"],"pos":source["pos"],"definition_en":source["gloss_en"],"original_options":source["options"],"answer":source["response"],"proposed_options":options,"status":status,"review_instruction":instruction,"approved":False,"source_modified":False})
out.sort(key=lambda z:z["review_number"])
assert len(out)==15 and len({t["ku_id"] for t in out})==15
(D/"lexical_15_source_review.jsonl").write_text("".join(json.dumps(t,ensure_ascii=False)+"\n" for t in out),encoding="utf8")
count=dict(collections.Counter(x["status"] for x in out))
summary={"source_verified":len(out),"statuses":count,"source_modified":False,"semantic_certification":False,"release_eligible":False}
(D/"lexical_15_source_review_summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
print(json.dumps(summary))
