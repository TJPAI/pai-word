#!/usr/bin/env python3
"""Audit top1000 inherited bilingual senses for exact semantic duplicates, unsafe answer ambiguity,
and per-headword Sense-KU QA queues. Never equate lexical duplication with certified semantics.
"""
import json,pathlib,collections,re,unicodedata
base=pathlib.Path("tools/core20k_sense_v1/release/v2.1-top1000")
records=[json.loads(l) for l in (base/"top1000_sense_lexicon_staging.jsonl").open(encoding="utf8")]
kus=[json.loads(l) for l in (base/"top1000_sense_recognition_ku_staging.jsonl").open(encoding="utf8")]
assert len(records)==len(kus)==2465
kuids={r["ku_id"] for r in kus};assert len(kuids)==len(kus)
def norm(v):
 return re.sub(r"\s+"," ",unicodedata.normalize("NFKC",str(v)).casefold()).strip().strip(".,;: ")
stats=collections.Counter();byrank=collections.defaultdict(list);out=[]
for s in records:
 byrank[s["rank"]].append(s)
for rank,ss in sorted(byrank.items()):
 eng=collections.defaultdict(list);zh=collections.defaultdict(list);both=collections.defaultdict(list)
 for s in ss:
  ku=s["legacy_ku_id"];en=norm(s["gloss_en"]);cn=norm(s["gloss_zh"])
  eng[en].append(ku);zh[cn].append(ku);both[(en,cn)].append(ku)
 for s in ss:
  flags=[];en=norm(s["gloss_en"]);cn=norm(s["gloss_zh"])
  if len(both[(en,cn)])>1:flags.append("DUPLICATE_BILINGUAL_GLOSS")
  elif len(eng[en])>1:flags.append("DUPLICATE_EN_GLOSS_ZH_CONFLICT")
  elif len(zh[cn])>1:flags.append("SHARED_ZH_GLOSS_DISTINCT_EN")
  if len(en)<5:flags.append("VERY_SHORT_EN_GLOSS")
  if len(cn)<2:flags.append("VERY_SHORT_ZH_GLOSS")
  if "/" in cn or "；" in cn or ";" in cn:flags.append("MULTIPLE_ZH_ANSWER_ALTERNATIVES")
  if not re.search(r"[a-z]",en):flags.append("NO_ENGLISH_LETTERS")
  if s["legacy_ku_id"] not in kuids:flags.append("MISSING_KU_LINK")
  status="PRIORITY_SEMANTIC_REVIEW" if any(x.startswith("DUPLICATE") or x in ("NO_ENGLISH_LETTERS","MISSING_KU_LINK") for x in flags) else ("ANSWER_OR_DISTINCTION_REVIEW" if flags else "STANDARD_INDEPENDENT_QA")
  stats[status]+=1
  for flag in flags:stats["flag:"+flag]+=1
  out.append({"rank":rank,"lemma":s["lemma"],"legacy_ku_id":s["legacy_ku_id"],"draft_sense_key":s["draft_sense_key"],"status":status,"flags":flags,
    "gloss_en":s["gloss_en"],"gloss_zh":s["gloss_zh"],"release_eligible":False})
stats["words"]=len(byrank);stats["candidates"]=len(records)
assert len(out)==2465
with (base/"top1000_semantic_qa_queue.jsonl").open("w",encoding="utf8") as f:
 for x in out:f.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"version":"Core20K-V2.1-TOP1000-SEMANTIC-TRIAGE","stats":dict(stats),
"independently_certified":0,"auto_merge":0,
"limitations":"String duplication and ambiguity flags are heuristic; no semantic approval and no new KU production."}
(base/"top1000_semantic_qa_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("TOP1000_SEMANTIC_TRIAGE",json.dumps(summary,ensure_ascii=False))
