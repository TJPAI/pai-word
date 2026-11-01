#!/usr/bin/env python3
import json,pathlib,re,hashlib
B=pathlib.Path(__file__).resolve().parent
R=B/"qa_reports"
pending=[json.loads(s) for s in (R/"active_recall_v6_review"/"priority_review.jsonl").read_text().splitlines()]
done=set()
for version in ("v7","v8"):
 f=R/("active_recall_"+version+"_contextual")/("curated_candidates.jsonl")
 done.update(json.loads(s)["ku_id"] for s in f.read_text().splitlines())
v3={x["ku_id"]:x for x in (json.loads(s) for s in (R/"active_recall_revised_v3"/"revised_records.jsonl").read_text().splitlines())}
spec=json.loads("[[\"regard\",\"deem to be\",\"The committee will ____ the application as incomplete.\"],[\"grant\",\"let have\",\"The judge agreed to ____ the defendant bail.\"],[\"cite\",\"refer to\",\"Please ____ two studies that support your argument.\"],[\"expression\",\"expression without words\",\"Her facial ____ revealed how disappointed she felt.\"],[\"sun\",\"the rays of the sun\",\"Keep the seedlings out of direct ____ at midday.\"],[\"anyone\",\"any person\",\"Does ____ have a question about the schedule?\"],[\"assign\",\"give out\",\"The manager will ____ each engineer a different task.\"],[\"attempt\",\"make an effort or attempt\",\"Few climbers would ____ the summit in such weather.\"],[\"stir\",\"stir feelings in\",\"The speech may ____ strong emotions among listeners.\"],[\"rapidly\",\"with speed\",\"The water level rose ____ after the heavy rainfall.\"],[\"unfortunately\",\"by bad luck\",\"____, our train was cancelled just before departure.\"],[\"unify\",\"become one\",\"A common mission can ____ several competing teams.\"],[\"merge\",\"become one\",\"The two companies plan to ____ next year.\"],[\"overtake\",\"travel past\",\"A cyclist should not ____ a bus at that junction.\"],[\"leftover\",\"not used up\",\"Store the ____ rice in the refrigerator.\"],[\"grasp\",\"hold firmly\",\"____ the handrail before stepping onto the platform.\"],[\"aggravate\",\"make worse\",\"Scratching the rash can ____ the irritation.\"],[\"exacerbate\",\"make worse\",\"Air pollution may ____ existing breathing problems.\"],[\"boast\",\"show off\",\"He likes to ____ about his achievements.\"],[\"pivot\",\"turn on a pivot\",\"The door can ____ around its central hinge.\"],[\"crumble\",\"fall apart\",\"The dry biscuit began to ____ in her hands.\"],[\"enlarge\",\"make larger\",\"Click this icon to ____ the photograph.\"],[\"jeopardize\",\"put at risk\",\"One careless mistake could ____ the entire project.\"],[\"compensate\",\"adjust for\",\"The sensor must ____ for changes in temperature.\"],[\"allot\",\"give out\",\"The organizer will ____ ten minutes to each speaker.\"],[\"worsen\",\"grow worse\",\"Symptoms may ____ without treatment.\"],[\"legalize\",\"make legal\",\"Parliament voted to ____ the previously prohibited activity.\"],[\"reluctant\",\"not eager\",\"He seemed ____ to discuss the incident.\"],[\"ascend\",\"travel up\",\"The hikers began to ____ the steep path.\"],[\"repossess\",\"claim back\",\"The lender may ____ the vehicle after repeated missed payments.\"]]")
out=[]
for lemma,gloss,cloze in spec:
 m=[x for x in pending if x["lemma"]==lemma and x["source_gloss_en"]==gloss and x["ku_id"] not in done]
 assert len(m)==1,(lemma,gloss,len(m))
 x=v3[m[0]["ku_id"]]
 assert cloze.count("____")==1
 assert not re.search(r"(?<![A-Za-z])"+re.escape(lemma)+r"(?![A-Za-z])",cloze,re.I)
 y=dict(x)
 y["question"]="请结合中文义项及句子语境填写英语单词（首字母："+lemma[0]+"，字母数："+str(len(lemma))+"）。\n中文义项："+x["gloss_zh"]+"\n"+cloze
 y["question_format"]="contextual_cloze_draft"
 y["context_example_original"]=True
 y["editorial_review_needed"]=True
 y["single_answer_verified"]=False
 y["production_ready"]=False
 y["release_eligible"]=False
 assert y["response"]==lemma
 out.append(y)
assert len(out)==30 and len({x["ku_id"] for x in out})==30
O=R/"active_recall_v9_contextual";O.mkdir(parents=True,exist_ok=True)
p=O/"curated_candidates.jsonl"
p.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
summary={"new_v9_candidates":len(out),"v7_v8_v9_total":len(done)+len(out),"pending_original":135,"remaining_without_context":135-len(done)-len(out),"requires_editorial_review":True,"source_modified":False,"runtime_modified":False,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("V9",json.dumps(summary))
