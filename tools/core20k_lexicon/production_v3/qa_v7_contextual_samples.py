#!/usr/bin/env python3
"""Curated contextual rewrite candidates, checked against original Sense IDs."""
import json,pathlib,re,hashlib
B=pathlib.Path(__file__).resolve().parent
R=B/"qa_reports"
source=[json.loads(s) for s in (R/"active_recall_v6_review"/"priority_review.jsonl").read_text().splitlines()]
v3={x["ku_id"]:x for x in (json.loads(s) for s in (R/"active_recall_revised_v3"/"revised_records.jsonl").read_text().splitlines())}
spec=[
  [
    "left",
    "Only two tickets were ____ after the sale.",
    "not used up"
  ],
  [
    "below",
    "Their apartment is on the floor ____ ours.",
    "on a floor below"
  ],
  [
    "give",
    "Could you ____ me a glass of water?",
    "give or supply"
  ],
  [
    "see",
    "I ____ this result as a useful starting point.",
    "deem to be"
  ],
  [
    "people",
    "A democratic government should listen to the ____ it represents.",
    "the common people generally"
  ],
  [
    "talk",
    "We need to ____ with the neighbors about the noise.",
    "exchange thoughts; talk with"
  ],
  [
    "point",
    "The weather vane will ____ in the direction of the wind.",
    "be oriented"
  ],
  [
    "right",
    "It would not be ____ to accuse her without evidence.",
    "socially right or correct"
  ],
  [
    "pay",
    "Please ____ close attention to the instructions.",
    "dedicate"
  ],
  [
    "sample",
    "The scientists will ____ water from several wells.",
    "take a sample of"
  ],
  [
    "question",
    "The detectives plan to ____ the witness again.",
    "pose a question"
  ],
  [
    "watch",
    "Can you ____ the baby while I prepare dinner?",
    "see or watch"
  ],
  [
    "spend",
    "We shouldn't ____ so much money on advertising.",
    "pay out"
  ],
  [
    "stay",
    "When we visit, we usually ____ at a small hotel.",
    "dwell"
  ],
  [
    "allow",
    "The new policy will ____ visitors access to the archive.",
    "let have"
  ],
  [
    "agree",
    "The figures in the two reports do not ____.",
    "go together"
  ]
]
out=[];used=set()
for lemma,cloze,engloss in spec:
 assert cloze.count("____")==1 and lemma.lower() not in cloze.lower().split()
 eligible=[x for x in source if x["lemma"]==lemma and x["source_gloss_en"]==engloss]
 assert len(eligible)==1,(lemma,engloss,len(eligible))
 sid=eligible[0]["ku_id"];assert sid not in used;used.add(sid)
 x=v3[sid];y=dict(x)
 y["question"]="请根据中文义项和句子语境填写英文词（首字母："+lemma[0]+"；字母数："+str(len(lemma))+"）。\n中文义项："+x["gloss_zh"]+"\n"+cloze
 y["question_format"]="contextual_cloze_draft"
 y["context_example_original"]=True
 y["editorial_review_needed"]=True
 y["single_answer_verified"]=False
 y["production_ready"]=False;y["release_eligible"]=False
 y["contextual_answer"]=lemma
 assert y["ku_id"]==sid and y["response"]==x["response"] and y["teaching_sense_id"]==x["teaching_sense_id"]
 out.append(y)
O=R/"active_recall_v7_contextual";O.mkdir(parents=True,exist_ok=True)
p=O/"curated_candidates.jsonl"
p.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out))
summary={"original_queue":135,"contextual_candidates":len(out),"remaining_without_context":135-len(out),"verified_unique_answers":0,"manual_semantic_review_required":True,"source_modified":False,"runtime_modified":False,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("V7",json.dumps(summary,ensure_ascii=False))
