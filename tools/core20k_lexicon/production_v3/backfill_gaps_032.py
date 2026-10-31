#!/usr/bin/env python3
"""Generate gap-only staging recognition KU; never overwrite existing IDs."""
import collections,json,pathlib,re
BASE=pathlib.Path(__file__).resolve().parent
def rows(pattern):
 for p in sorted(BASE.glob(pattern)):
  for line in p.read_text(encoding="utf-8").splitlines():
   if line.strip(): yield json.loads(line)
def terms(s): return set(re.findall(r"[a-z]{4,}",str(s).lower()))
def pos(s): return "a" if s=="s" else s
def has(s,lemma):return re.search(r"(?<![A-Za-z])"+re.escape(lemma)+r"(?![A-Za-z])",s,re.I) is not None
def valid(r):
 return all(r.get(k) for k in ("teaching_sense_id","rank","lemma","pos","definition_en","gloss_zh")) and not re.search(r"ethnic slur|racial slur|offensive term|derogatory|vulgar|obscene",r["definition_en"],re.I) and not has(r["definition_en"],r["lemma"])
source=list(rows("v4_ai_gloss_batch_*.jsonl"))
existing=list(rows("ku_drafts/v*/ku_*.jsonl"))
seen_ids={r.get("teaching_sense_id") for r in existing}
existing_ku={r.get("ku_id") for r in existing}
pool=[r for r in source if valid(r)]
uncovered=[r for r in pool if r["teaching_sense_id"] not in seen_ids]
all_by_pos=collections.defaultdict(list)
for r in pool:all_by_pos[pos(r["pos"])].append(r)
output=[]
for r in uncovered:
 opts=[]
 w=terms(r["definition_en"])
 c=[x for x in all_by_pos[pos(r["pos"])] if x["lemma"].lower()!=r["lemma"].lower() and not has(r["definition_en"],x["lemma"])]
 c.sort(key=lambda x:(-len(w&terms(x["definition_en"])),abs(x["rank"]-r["rank"]),x["lemma"]))
 used={r["lemma"].lower()}
 for x in c:
  if x["lemma"].lower() not in used:
   used.add(x["lemma"].lower());opts.append(x["lemma"])
  if len(opts)==3:break
 if len(opts)<3:continue
 i=len(output)
 opts.insert(i%4,r["lemma"])
 ku_id="staging:cg-enlex-ku-v2:"+r["teaching_sense_id"]+":recognition:01"
 if ku_id in existing_ku: continue
 output.append(dict(ku_id=ku_id,teaching_sense_id=r["teaching_sense_id"],rank=r["rank"],lemma=r["lemma"],pos=r["pos"],ku_type="sense_recognition",render_kind="sense_recognition",question="Choose the word matching this meaning: "+r["definition_en"],options=opts,response=r["lemma"],gloss_en=r["definition_en"],gloss_zh=r["gloss_zh"],qa_flags=["semantic_distractor_review_pending","gap_backfill"],draft=True,production_ready=False,release_eligible=False))
 if len(output)==250:break
out=BASE/"ku_drafts"/"v2"
out.mkdir(parents=True,exist_ok=True)
for i in range(0,len(output),50):
 chunk=output[i:i+50]
 if not chunk:break
 file=out/f"ku_recognition_032_{i//50+1:02d}.jsonl"
 if file.exists():
  existing=[json.loads(line) for line in file.read_text(encoding="utf8").splitlines() if line.strip()]
  if [x["ku_id"] for x in existing]!=[x["ku_id"] for x in chunk]:raise RuntimeError("Existing file mismatch: "+str(file))
  print("VERIFIED_EXISTING",file.name,len(existing));continue
 file.write_text("".join(json.dumps(r,ensure_ascii=False,separators=(",",":"))+"\n" for r in chunk),encoding="utf8")
 print("GENERATED",file.name,len(chunk))
print(json.dumps(dict(source=len(source),existing=len(existing),uncovered_source=len({r["teaching_sense_id"] for r in source}-{r.get("teaching_sense_id") for r in existing}),eligible_uncovered=len(uncovered),generated=len(output),unique_ku=len({r["ku_id"] for r in output}),unique_sense=len({r["teaching_sense_id"] for r in output}))))
