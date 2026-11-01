import pathlib,json,collections,hashlib
B=pathlib.Path(__file__).resolve().parent;R=B/"qa_reports";O=R/"cg_enlex_mu_morph_v6";O.mkdir(exist_ok=True)
q=[json.loads(s) for s in (R/"cg_enlex_mu_patchC_actions_v3"/"action_queue.jsonl").read_text().splitlines()]
base={x["ku_id"]:x for x in (json.loads(s) for s in (R/"cg_enlex_mu_patchC_hold_v4"/"review_pack_patchC_hold.jsonl").read_text().splitlines())}
regular_past={"travelled","signalled","transferred","dropped","quitted","stripped","shipped","bedded","chatted","scanned","spotted","mapped","cropped","plotted","labelled","popped","petted","summed","hugged","sinned","squatted","chopped","equalled","tripped","nodded","jammed","canned","webbed","clipped","fanned","dragged","topped","gummed","rubbed","wetted","fatted","pinned","plugged","mobbed"}
regular_ing={"tying","scanning","trekking","mapping","embedding","rigging","stabbing","transferring","overlying"}
irregular={"wrought":"work","clove":"cleave","slew":"slay","beaten":"beat","rang":"ring","rode":"ride","struck":"strike","sprang":"spring","swollen":"swell","smelt":"smell","hung":"hang","shone":"shine","fled":"flee","swept":"sweep","sank":"sink","withdrawn":"withdraw","ridden":"ride","flung":"fling","sunk":"sink","wept":"weep","bookshelves":"bookshelf"}
comparative={"easier":"easy","stronger":"strong"}
exceptions={"quitted","wrought","clove","slew","smelt","hung","canned","fatted","wetted","bookshelves"}
rows=[];exception=[];count=collections.Counter()
for x in q:
 if x["reason_code"]!="MORPH_CANDIDATE":continue
 k=x["ku_id"];old=base[k];lemma=x["lemma"];target=x["sense_lemma"]
 assert old["rank"]==x["rank"] and old["lemma"]==lemma and old["response"]==lemma
 if lemma in regular_past:kind="PAST_OR_PARTICIPLE"
 elif lemma in regular_ing:kind="GERUND_OR_PARTICIPLE"
 elif irregular.get(lemma)==target:kind="IRREGULAR_OR_PLURAL"
 elif comparative.get(lemma)==target:kind="COMPARATIVE"
 else:kind="UNVERIFIED"
 if kind=="UNVERIFIED":raise ValueError(lemma)
 # Never replace the frozen lemma answer by source lemma.
 y={"ku_id":k,"rank":x["rank"],"frozen_lemma":lemma,"source_lemma":target,"morphology":kind,"next_action":"REWRITE_SENSE_FOR_INFLECTED_FORM","single_answer_quiz_enabled":False,"release_eligible":False,"source_sense_id":old["teaching_sense_id"],"original_answer":old["response"]}
 if lemma in exceptions:
  y["next_action"]="LEXICAL_REVIEW_BEFORE_INFLECTION_REWRITE";exception.append(y)
 rows.append(y);count[kind]+=1
assert len(rows)==71
(O/"morphology_candidates.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows))
(O/"exceptions.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in exception))
summary={"total":71,"classification":dict(count),"exceptions":len(exception),"automatic_source_sense_remaps":0,"frozen_lemmas_modified":0,"runtime_modified":False,"candidate_only":True}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print(summary)
