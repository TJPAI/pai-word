#!/usr/bin/env python3
"""Conservative same-POS semantic-neighbor discovery; proposals are NOT merged or certified."""
import json,pathlib,collections,re
from difflib import SequenceMatcher
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
rows=[json.loads(x) for x in (p/"first500_provisional_decisions.jsonl").open(encoding="utf8")]
assert len(rows)==500
stop={"a","an","the","to","of","or","and","in","for","with","that","on","something","someone","someone's","be","is","are","one","which"}
def words(s):return set(re.findall(r"[a-z]+",s.lower()))-stop
def compare(a,b):
 x,y=words(a),words(b)
 jac=len(x&y)/len(x|y) if x|y else 0
 seq=SequenceMatcher(None," ".join(sorted(x))," ".join(sorted(y))).ratio()
 return round(.7*jac+.3*seq,4),round(jac,4)
stats=collections.Counter()
with (p/"first500_semantic_neighbor_suggestions.jsonl").open("w",encoding="utf8") as out:
 for row in rows:
  senses=row["sense_decisions"];pairs=[]
  for i,a in enumerate(senses):
   if not a["gloss_en"]:continue
   for b in senses[i+1:]:
    if not b["gloss_en"]:continue
    if str(a["part_of_speech"]).lower()!=str(b["part_of_speech"]).lower():continue
    score,jac=compare(a["gloss_en"],b["gloss_en"])
    if score>=.72 and jac>=.44:
     pairs.append({"left":a["draft_key"],"right":b["draft_key"],"similarity":score,
       "token_jaccard":jac,"left_gloss":a["gloss_en"],"right_gloss":b["gloss_en"],
       "decision":"REVIEW_FOR_POSSIBLE_SEMANTIC_MERGE","auto_merge":False})
  pairs.sort(key=lambda x:-x["similarity"])
  stats["words"]+=1;stats["possible_merge_pairs"]+=len(pairs)
  stats["words_with_possible_merges"]+=bool(pairs)
  stats["pairs_top_threshold_0_88"]+=sum(x["similarity"]>=.88 for x in pairs)
  out.write(json.dumps({"rank":row["rank"],"lemma":row["lemma"],"candidates":len(senses),
   "merge_review_pairs":pairs,"semantic_certified":False},ensure_ascii=False)+"\n")
report={"metrics":dict(stats),"gate":"SEMANTIC_NEIGHBOR_SUGGESTIONS_ONLY","auto_merged":0,"certified":0,
 "limitations":"Lexical overlap may confuse related but distinct meanings; every merge requires contextual review"}
(p/"first500_semantic_neighbor_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("NEIGHBOR_REVIEW_500",json.dumps(report,ensure_ascii=False))
