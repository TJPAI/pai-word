import json,pathlib,hashlib,collections
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_questions_v1";O.mkdir(exist_ok=True)
src=R/"cg_enlex_mu_integrated_v1"/"integrated_review_pack.jsonl"
assert hashlib.sha256(src.read_bytes()).hexdigest()=="fd7bc495220a950235111146426d5760cd15fd3f16e761ada50bd63d23385cfc"
out=[];count=collections.Counter();total=0
for line in src.open(encoding="utf8"):
 x=json.loads(line);total+=1
 if not x.get("question_requires_rebuild"):continue
 lemma=x["lemma"];gloss=x.get("gloss_zh","");pos=x.get("pos")
 if not gloss or not lemma or not pos:count["missing_essential"]+=1;continue
 y=dict(x)
 y["question"]="请识别以下英文词义，不进行单答案填空。\n英文词："+lemma+"\n词性："+str(pos)+"\n中文释义："+gloss+"\n英文释义："+x.get("gloss_en","")
 y["question_format"]="recognition_review_draft"
 y["recommended_learning_mode"]="recognition_only"
 y["question_requires_rebuild"]=False
 y["single_answer_quiz_enabled"]=False
 y["single_answer_verified"]=False;y["production_ready"]=False;y["release_eligible"]=False
 y["editorial_review_needed"]=True
 out.append(y)
assert total==27471
assert len(out)+count["missing_essential"]==140
with (O/"recognition_question_overlay.jsonl").open("w") as f:
 for x in out:f.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"baseline":total,"affected":140,"safe_recognition_questions":len(out),"deferred_missing_essential":count["missing_essential"],"single_answer_enabled":0,"runtime_modified":False,"sha256":hashlib.sha256((O/"recognition_question_overlay.jsonl").read_bytes()).hexdigest()}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("QUESTION REBUILD",summary)
