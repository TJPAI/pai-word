#!/usr/bin/env python3
import json,pathlib,hashlib,re
B=pathlib.Path(__file__).resolve().parent
R=B/"qa_reports"
pending=[json.loads(s) for s in (R/"active_recall_v6_review"/"priority_review.jsonl").read_text().splitlines()]
v7={json.loads(s)["ku_id"] for s in (R/"active_recall_v7_contextual"/"curated_candidates.jsonl").read_text().splitlines()}
v3={x["ku_id"]:x for x in (json.loads(s) for s in (R/"active_recall_revised_v3"/"revised_records.jsonl").read_text().splitlines())}
spec=json.loads("[[\"make\",\"engage in\",\"They often ____ conversation with strangers at the station.\"],[\"give\",\"bring about\",\"The new policy may ____ rise to unexpected costs.\"],[\"issue\",\"make out and issue\",\"The authority will ____ a new permit once the checks are complete.\"],[\"pass\",\"come to pass\",\"No one knew how the prediction would come to ____.\"],[\"shift\",\"move around\",\"The workers had to ____ the furniture to clean the floor.\"],[\"evidence\",\"provide evidence for\",\"The documents ____ the claim that the payment was made.\"],[\"complete\",\"complete or carry out\",\"The team must ____ the assigned work before Friday.\"],[\"consider\",\"deem to be\",\"Many residents ____ the building unsafe after the inspection.\"],[\"transfer\",\"move around\",\"The hospital will ____ the patient to a specialist unit.\"],[\"too\",\"in addition\",\"I would like a copy of the report, ____.\"],[\"bear\",\"bring in\",\"The orchard should ____ fruit next summer.\"],[\"have\",\"undergo\",\"The patient will ____ surgery next week.\"],[\"emerge\",\"come out of\",\"The butterfly will ____ from its chrysalis.\"],[\"submit\",\"put before\",\"Applicants must ____ their documents before the deadline.\"],[\"respect\",\"show respect towards\",\"We should ____ people with different opinions.\"],[\"mention\",\"make mention of\",\"Did the witness ____ the time of the incident?\"],[\"contribute\",\"contribute to some cause\",\"Several donors agreed to ____ money to the relief fund.\"],[\"destroy\",\"destroy completely; damage irreparably\",\"The fire could ____ the historic building.\"],[\"devote\",\"dedicate\",\"She plans to ____ more time to her research.\"],[\"stake\",\"put at risk\",\"He would not ____ his reputation on an unverified claim.\"],[\"boost\",\"increase\",\"The campaign aims to ____ attendance at the museum.\"],[\"substitute\",\"be a substitute\",\"Plant-based milk can ____ for dairy milk in this recipe.\"],[\"mix\",\"mix together different elements\",\"____ the dry ingredients before adding water.\"],[\"unite\",\"become one\",\"The separate groups decided to ____ behind a common goal.\"],[\"impose\",\"impose something unpleasant\",\"The court may ____ a fine for the violation.\"],[\"impose\",\"impose and collect\",\"The council voted to ____ a levy on empty properties.\"],[\"found\",\"set up or found\",\"They plan to ____ a new research institute.\"],[\"revisit\",\"visit again\",\"We hope to ____ the city where we first met.\"],[\"accelerate\",\"move faster\",\"The car began to ____ as it joined the motorway.\"],[\"reclaim\",\"claim back\",\"The owner went to court to ____ the stolen property.\"]]")
new=[]
for lemma,english_gloss,cloze in spec:
 matches=[x for x in pending if x["lemma"]==lemma and x["source_gloss_en"]==english_gloss and x["ku_id"] not in v7]
 assert len(matches)==1,(lemma,english_gloss,len(matches))
 x=v3[matches[0]["ku_id"]]
 assert cloze.count("____")==1
 assert not re.search(r"(?<![A-Za-z])"+re.escape(lemma)+r"(?![A-Za-z])",cloze,re.I),lemma
 y=dict(x)
 y["question"]="请结合中文义项及句子语境填写英语单词（首字母："+lemma[0]+"，字母数："+str(len(lemma))+"）。\n中文义项："+x["gloss_zh"]+"\n"+cloze
 y["question_format"]="contextual_cloze_draft"
 y["context_example_original"]=True
 y["editorial_review_needed"]=True
 y["single_answer_verified"]=False
 y["production_ready"]=False
 y["release_eligible"]=False
 assert y["response"]==lemma and y["ku_id"] not in v7
 new.append(y)
assert len(new)==30 and len({x["ku_id"] for x in new})==30
O=R/"active_recall_v8_contextual";O.mkdir(parents=True,exist_ok=True)
p=O/"curated_candidates.jsonl"
p.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in new),encoding="utf8")
summary={"previous_v7_candidates":len(v7),"new_v8_candidates":len(new),"total_context_candidates":len(v7)+len(new),"pending_original":135,"remaining_without_context":135-len(v7)-len(new),"semantic_review_required":True,"source_modified":False,"runtime_modified":False,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("V8_VERIFIED",json.dumps(summary))
