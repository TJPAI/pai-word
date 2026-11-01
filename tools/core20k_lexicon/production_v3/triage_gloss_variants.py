#!/usr/bin/env python3
"""Read-only triage of Chinese-gloss conflicts; no automated semantic replacement."""
import collections,json,pathlib,re,unicodedata
B=pathlib.Path(__file__).resolve().parent
groups=collections.defaultdict(list)
for path in sorted(B.glob("ku_drafts/v*/ku_*.jsonl")):
 for line_no,line in enumerate(path.read_text(encoding="utf8").splitlines(),1):
  if line.strip():
   r=json.loads(line);groups[r["ku_id"]].append((str(path.relative_to(B)),line_no,r))
def norm(s):
 s=unicodedata.normalize("NFKC",str(s or "")).casefold().strip()
 return re.sub(r"[\s+·;；,，。.!！:：、()（）\[\]【】\\/]+","",s)
def pos(s):
 return {"a":"adj","s":"adj","adjective":"adj","n":"n","noun":"n","v":"v","verb":"v","r":"adv","adverb":"adv"}.get(str(s or "").lower(),str(s or "").lower())
report=[];counts=collections.Counter()
for kid,items in sorted(groups.items()):
 if len(items)<2:continue
 zh={r.get("gloss_zh") for _,_,r in items}
 en={r.get("gloss_en") or r.get("definition_en") for _,_,r in items}
 ps={pos(r.get("pos")) for _,_,r in items}
 if len(zh)<2 and len(en)<2 and len(ps)<2:continue
 if len(en)>1:category="english_difference"
 elif len(zh)>1 and len({norm(v) for v in zh})==1:category="format_only"
 elif len(zh)>1:category="meaning_review"
 else:category="pos_only"
 counts[category]+=1
 report.append({"ku_id":kid,"teaching_sense_id":items[0][2].get("teaching_sense_id"),"lemma":items[0][2].get("lemma"),"category":category,"pos_values":sorted(str(v) for v in ps),"english_values":sorted(str(v) for v in en),"chinese_values":sorted(str(v) for v in zh),"sources":[{"file":p,"line":n} for p,n,_ in items]})
out=B/"ku_gloss_triage.jsonl"
out.write_text("".join(json.dumps(x,ensure_ascii=False,separators=(",",":"))+"\n" for x in report),encoding="utf8")
summary={"total_flagged":len(report),"categories":dict(counts),"meaning_review_samples":[x for x in report if x["category"]=="meaning_review"][:30]}
(B/"ku_gloss_triage_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({k:v for k,v in summary.items() if k!="meaning_review_samples"},ensure_ascii=False))
