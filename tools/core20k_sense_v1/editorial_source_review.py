#!/usr/bin/env python3
"""Review real OEWN2025 evidence for 20 editorial risk headwords; conservative triage."""
import json,pathlib,re,collections,wn
p=pathlib.Path("tools/core20k_sense_v1");out=p/"reports";out.mkdir(exist_ok=True,parents=True)
rows=[]
for f in ("editorial_pilot_8_headwords.jsonl","editorial_pilot_12_more_headwords.jsonl"):
 rows += [json.loads(x) for x in (p/f).read_text(encoding="utf-8").splitlines() if x]
assert len(rows)==20
lex=wn.Wordnet(lexicon="oewn:2025")
stop={"a","the","or","to","of","an","with","and","in","on","that","something","someone","is","be","as","for"}
def toks(s):return set(re.findall("[a-z]+",s.lower()))-stop
summary=collections.Counter()
with (out/"editorial_20_oewn2025_evidence.jsonl").open("w",encoding="utf-8") as f:
 for row in rows:
  source=[]
  for word in lex.words(row["lemma"]):
   for sense in word.senses():
    ss=sense.synset()
    if ss.id not in [s["synset_id"] for s in source]:
     source.append({"sense_id":sense.id,"synset_id":ss.id,"pos":ss.pos,"definition":ss.definition()})
  output=[]
  for draft in row["sense_proposals"]:
   st=toks(draft["gloss_en"])
   ranked=sorted(((len(st&toks(s["definition"]))/max(1,len(st|toks(s["definition"]))),s) for s in source),key=lambda x:x[0],reverse=True)
   score,top=ranked[0] if ranked else (0,None)
   state="LEXICAL_SUPPORT_HINT" if score>=0.2 else "DICTIONARY_SEMANTIC_REVIEW_REQUIRED"
   summary[state]+=1
   output.append({"draft_key":draft.get("draft_sense_key",draft.get("draft_key")),"gloss_en":draft["gloss_en"],"candidate_source_id":top["sense_id"] if top else None,"source_definition":top["definition"] if top else None,"token_jaccard":round(score,3),"triage":state,"source_verified_semantic_equivalence":False})
  summary["headwords"]+=1;summary["oeWN_source_senses"]+=len(source)
  f.write(json.dumps({"lemma":row["lemma"],"source":"OEWN2025","source_sense_count":len(source),"proposals":output},ensure_ascii=False)+"\n")
report={"counts":dict(summary),"method":"Lexical token overlap only, not independent semantic verification","independently_certified":0,"release_eligible":False}
(out/"editorial_20_oewn2025_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("EDITORIAL_EVIDENCE",json.dumps(report,ensure_ascii=False))
