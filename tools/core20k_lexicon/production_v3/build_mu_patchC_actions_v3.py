import json,pathlib,collections
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_patchC_actions_v3";O.mkdir(exist_ok=True)
q=[json.loads(s) for s in (R/"cg_enlex_mu_patchC_resolution_v2"/"resolution_queue.jsonl").read_text().splitlines()]
assert len(q)==77
irregular={"wrought":"work","clove":"cleave","slew":"slay","rang":"ring","rode":"ride","struck":"strike","sprang":"spring","swollen":"swell","smelt":"smell","hung":"hang","shone":"shine","fled":"flee","swept":"sweep","sank":"sink","withdrawn":"withdraw","ridden":"ride","flung":"fling","sunk":"sink","wept":"weep","beaten":"beat","easier":"easy","stronger":"strong","bookshelves":"bookshelf","overlying":"overlie","tying":"tie","quitted":"quit"}
override={"stamina":"SOURCE_SEMANTIC_MISMATCH","capita":"VERIFY_PLURAL_RELATION","squatter":"SOURCE_SEMANTIC_MISMATCH","deeper":"SOURCE_SEMANTIC_MISMATCH","skinned":"SOURCE_SEMANTIC_MISMATCH","dryer":"MORPH_AMBIGUITY"}
def heuristic(a,b):
 if irregular.get(a)==b:return "MORPH_CANDIDATE"
 if a.endswith("ing") and (a[:-3]==b or a[:-3]+"e"==b or a[:-4]==b):return "MORPH_CANDIDATE"
 if a.endswith("ed") and (a[:-2]==b or a[:-1]==b or a[:-3]==b or a[:-3]+"y"==b):return "MORPH_CANDIDATE"
 if a.endswith("er") and (a[:-2]==b or a[:-1]==b):return "MORPH_CANDIDATE"
 if a.endswith("s") and (a[:-1]==b or a[:-3]+"f"==b):return "MORPH_CANDIDATE"
 return "UNVERIFIED_FORM_RELATION"
actions=[]
for x in q:
 a=x["original_lemma"];target=x["suggested_sense_lemma"]
 kind=override.get(a,heuristic(a,target))
 actions.append({"ku_id":x["ku_id"],"teaching_sense_id":x["teaching_sense_id"],"rank":x["rank"],"lemma":a,"sense_lemma":target,"reason_code":kind,"next_action":"REVIEW_SENSE_ALIGNMENT" if kind=="SOURCE_SEMANTIC_MISMATCH" else "VERIFY_INFLECTION_AND_REBUILD_LEARNING_TARGET","hold_single_answer":True,"no_rank_lemma_mutation":True,"source":"mu_patchC_77"})
assert len(actions)==77
(O/"action_queue.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in actions))
count=dict(collections.Counter(x["reason_code"] for x in actions))
summary={"total":77,"reason_counts":count,"hold_single_answer":77,"rank_lemma_modified":0,"runtime_modified":False,"heuristic_not_lexical_certification":True}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("PATCHC ACTIONS",summary)
